import { Api, type TelegramClient } from "telegram";
import { NewMessage, type NewMessageEvent } from "telegram/events/index.js";

import { buildAdFilter } from "./adFilter.js";
import { env } from "../../../core/config/env.js";
import { CONTENT_PREVIEW_LENGTH } from "../../../core/constants.js";
import { memeRepository } from "../../../core/db/memeRepository.js";
import { logger } from "../../../core/logger.js";
import { createChannelMatcher } from "../helpers/channelMatcher.js";
import { checkForDuplicates } from "../services/deduplicator.js";
import { extractMediaFiles } from "../services/mediaExtractor.js";
import { sendMediaFiles } from "../services/mediaSender.js";
import type { PostQueue } from "../services/postQueue.js";

// Ленивая инициализация для избежания обращения к env до initConfig()
let isAdContent: ReturnType<typeof buildAdFilter> | null = null;
let channelMatcher: ReturnType<typeof createChannelMatcher> | null = null;

const getIsAdContent = () => {
  if (!isAdContent) {
    isAdContent = buildAdFilter(env.adKeywords);
  }
  return isAdContent;
};

const getChannelMatcher = () => {
  if (!channelMatcher) {
    channelMatcher = createChannelMatcher(env.sourceChannelIds);
  }
  return channelMatcher;
};

/**
 * Сбрасывает кеши фильтров при перезагрузке конфигурации
 */
export const resetFilters = () => {
  isAdContent = null;
  channelMatcher = null;
  logger.debug("Фильтры сброшены для перезагрузки конфигурации");
};

type ChannelMeta = {
  id: bigInt.BigInteger;
  username: string | null;
  title: string;
};

/**
 * Извлекает предварительный просмотр контента сообщения
 */
const extractContentPreview = (event: NewMessageEvent): string => {
  const text = event.message.message ?? event.message.rawText ?? "";
  return text.slice(0, CONTENT_PREVIEW_LENGTH);
};

/**
 * Разрешает метаданные канала из события
 */
const resolveChannelMeta = async (event: NewMessageEvent): Promise<ChannelMeta | null> => {
  const chat = await event.message.getChat();

  if (!chat || !(chat instanceof Api.Channel)) {
    return null;
  }

  return {
    id: chat.id,
    username: chat.username ?? null,
    title: chat.title ?? "unknown",
  };
};

/**
 * Обрабатывает входящее сообщение из канала
 */
const handleChannelPost = async (
  client: TelegramClient,
  event: NewMessageEvent,
  postQueue?: PostQueue,
) => {
  const channelMeta = await resolveChannelMeta(event);

  if (!channelMeta) {
    logger.debug("Сообщение получено не из канала, пропуск");
    return;
  }

  if (!getChannelMatcher()(channelMeta.id.toString(), channelMeta.username)) {
    logger.debug(
      { channelId: channelMeta.id, username: channelMeta.username },
      "Источник не входит в белый список, пропуск",
    );
    return;
  }

  const content = event.message.message ?? "";
  const caption = event.message.media ? content : null;

  if (getIsAdContent()(content, caption)) {
    logger.info(
      {
        channelId: channelMeta.id,
        username: channelMeta.username,
        preview: extractContentPreview(event),
      },
      "Объявление распознано как реклама и пропущено",
    );
    return;
  }

  try {
    const mediaFiles = await extractMediaFiles(client, event);

    if (!mediaFiles.length) {
      logger.debug(
        {
          messageId: event.message.id,
          channelId: channelMeta.id,
        },
        "Сообщение не содержит поддерживаемого медиа, пропуск",
      );
      return;
    }

    const { newFiles, duplicateCount } = checkForDuplicates(mediaFiles, memeRepository.hasHash, {
      messageId: event.message.id,
      channel: channelMeta.username ?? channelMeta.id.toString(),
    });

    if (!newFiles.length) {
      logger.info(
        {
          messageId: event.message.id,
          channelId: channelMeta.id,
          duplicateCount,
        },
        "Все вложения оказались дублями, сообщение пропущено",
      );
      return;
    }

    const sourceChannelId = String(channelMeta.id);

    // Если очередь включена, добавляем в очередь
    if (env.enableQueue && postQueue) {
      postQueue.enqueueMedia(newFiles, sourceChannelId, event.message.id);

      logger.info(
        {
          from: channelMeta.username ?? channelMeta.id,
          messageId: event.message.id,
          enqueuedCount: newFiles.length,
        },
        "Медиа добавлено в очередь для отложенной публикации",
      );
    } else {
      // Иначе публикуем сразу (старое поведение)
      const uploadResults = await sendMediaFiles(client, env.targetChannelId, newFiles);

      for (const result of uploadResults) {
        memeRepository.save({
          hash: result.hash,
          sourceChannelId,
          sourceMessageId: event.message.id,
          targetMessageId: result.targetMessageId,
          filePath: result.filePath,
        });
      }

      logger.info(
        {
          from: channelMeta.username ?? channelMeta.id,
          to: env.targetChannelId,
          messageId: event.message.id,
          uploadedCount: uploadResults.length,
        },
        "Новые медиа опубликованы в целевом канале",
      );
    }
  } catch (error) {
    logger.error(
      {
        err: error,
        messageId: event.message.id,
        channelId: channelMeta.id,
      },
      "Ошибка при пересылке сообщения",
    );
  }
};

// Хранение ссылок для перерегистрации обработчика
let currentEventHandler: ((event: NewMessageEvent) => void) | null = null;
let currentNewMessage: NewMessage | null = null;
let currentClient: TelegramClient | null = null;

/**
 * Регистрирует обработчик постов из каналов
 */
export const registerChannelPostHandler = (client: TelegramClient, postQueue?: PostQueue) => {
  // Удаляем старый обработчик, если он существует
  if (currentClient && currentEventHandler && currentNewMessage) {
    try {
      currentClient.removeEventHandler(currentEventHandler, currentNewMessage);
      logger.debug("Старый обработчик событий удалён");
    } catch (error) {
      logger.warn({ err: error }, "Ошибка при удалении старого обработчика");
    }
  }

  // Сбрасываем кеши фильтров
  resetFilters();

  // Получаем sourceChannelIds из env при вызове функции
  const sourceChannelIds = env.sourceChannelIds;

  // Создаём новый обработчик и event builder
  const eventHandler = (event: NewMessageEvent) => handleChannelPost(client, event, postQueue);
  const newMessage = new NewMessage({ chats: sourceChannelIds });

  // Регистрируем обработчик
  client.addEventHandler(eventHandler, newMessage);

  // Сохраняем ссылки для последующей перерегистрации
  currentEventHandler = eventHandler;
  currentNewMessage = newMessage;
  currentClient = client;

  logger.info(
    { sourceChannelsCount: sourceChannelIds.length },
    "Обработчик постов зарегистрирован для каналов",
  );
};
