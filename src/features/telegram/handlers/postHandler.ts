import { Api, type TelegramClient } from "telegram";
import { NewMessage, type NewMessageEvent } from "telegram/events/index.js";

import { buildAdFilter } from "./adFilter.js";
import { env } from "../../../core/config/env.js";
import { CONTENT_PREVIEW_LENGTH } from "../../../core/constants.js";
import { memeRepository } from "../../../core/db/repositories.js";
import { logger } from "../../../core/logger.js";
import { createChannelMatcher } from "../helpers/channelMatcher.js";
import { checkForDuplicates } from "../services/deduplicator.js";
import { extractMediaFiles } from "../services/mediaExtractor.js";
import { sendMediaFiles } from "../services/mediaSender.js";
import type { PostQueue } from "../services/postQueue.js";

/**
 * Ленивая инициализация фильтров для избежания обращения к env до initConfig()
 */
let isAdContent: ReturnType<typeof buildAdFilter> | null = null;
let channelMatcher: ReturnType<typeof createChannelMatcher> | null = null;

/**
 * Получает или создает фильтр рекламного контента
 */
const getIsAdContent = (): ReturnType<typeof buildAdFilter> => {
  if (!isAdContent) {
    isAdContent = buildAdFilter(env.adKeywords);
  }
  return isAdContent;
};

/**
 * Получает или создает matcher для каналов
 */
const getChannelMatcher = (): ReturnType<typeof createChannelMatcher> => {
  if (!channelMatcher) {
    channelMatcher = createChannelMatcher(env.sourceChannelIds);
  }
  return channelMatcher;
};

/**
 * Сбрасывает кеши фильтров при перезагрузке конфигурации
 */
export const resetFilters = (): void => {
  isAdContent = null;
  channelMatcher = null;
  logger.debug("Фильтры сброшены для перезагрузки конфигурации");
};

/**
 * Метаданные канала
 */
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
  try {
    const chat = await event.message.getChat();

    if (!chat || !(chat instanceof Api.Channel)) {
      return null;
    }

    return {
      id: chat.id,
      username: chat.username ?? null,
      title: chat.title ?? "unknown",
    };
  } catch (error) {
    logger.error({ err: error, messageId: event.message.id }, "Ошибка при получении метаданных канала");
    return null;
  }
};

/**
 * Проверяет, является ли сообщение рекламой
 */
const isAdvertisement = (event: NewMessageEvent, channelMeta: ChannelMeta): boolean => {
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
    return true;
  }

  return false;
};

/**
 * Публикует медиа в очередь или напрямую
 */
const publishMedia = async (
  client: TelegramClient,
  newFiles: Array<{ buffer: Buffer; fileName: string; mimeType?: string; hash: string }>,
  sourceChannelId: string,
  messageId: number,
  channelMeta: ChannelMeta,
  postQueue?: PostQueue,
): Promise<void> => {
  if (env.enableQueue && postQueue) {
    // Добавляем в очередь для отложенной публикации
    postQueue.enqueueMedia(newFiles, sourceChannelId, messageId);

    logger.info(
      {
        from: channelMeta.username ?? channelMeta.id,
        messageId,
        enqueuedCount: newFiles.length,
      },
      "Медиа добавлено в очередь для отложенной публикации",
    );
  } else {
    // Публикуем сразу
    const uploadResults = await sendMediaFiles(client, env.targetChannelId, newFiles);

    for (const result of uploadResults) {
      memeRepository.save({
        hash: result.hash,
        sourceChannelId,
        sourceMessageId: messageId,
        targetMessageId: result.targetMessageId,
        filePath: result.filePath ?? null,
      });
    }

    logger.info(
      {
        from: channelMeta.username ?? channelMeta.id,
        to: env.targetChannelId,
        messageId,
        uploadedCount: uploadResults.length,
      },
      "Новые медиа опубликованы в целевом канале",
    );
  }
};

/**
 * Обрабатывает входящее сообщение из канала
 */
const handleChannelPost = async (
  client: TelegramClient,
  event: NewMessageEvent,
  postQueue?: PostQueue,
): Promise<void> => {
  try {
    // Получаем метаданные канала
    const channelMeta = await resolveChannelMeta(event);
    if (!channelMeta) {
      logger.debug("Сообщение получено не из канала, пропуск");
      return;
    }

    // Проверяем, входит ли канал в белый список
    if (!getChannelMatcher()(channelMeta.id.toString(), channelMeta.username)) {
      logger.debug(
        { channelId: channelMeta.id, username: channelMeta.username },
        "Источник не входит в белый список, пропуск",
      );
      return;
    }

    // Проверяем, является ли сообщение рекламой
    if (isAdvertisement(event, channelMeta)) {
      return;
    }

    // Извлекаем медиа файлы
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

    // Проверяем на дубликаты
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

    // Публикуем медиа
    const sourceChannelId = String(channelMeta.id);
    await publishMedia(client, newFiles, sourceChannelId, event.message.id, channelMeta, postQueue);
  } catch (error) {
    logger.error(
      {
        err: error,
        messageId: event.message.id,
      },
      "Ошибка при обработке сообщения",
    );
  }
};

/**
 * Хранение ссылок для перерегистрации обработчика
 */
let currentEventHandler: ((event: NewMessageEvent) => void) | null = null;
let currentNewMessage: NewMessage | null = null;
let currentClient: TelegramClient | null = null;

/**
 * Регистрирует обработчик постов из каналов
 */
export const registerChannelPostHandler = (client: TelegramClient, postQueue?: PostQueue): void => {
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
  const eventHandler = (event: NewMessageEvent) => void handleChannelPost(client, event, postQueue);
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
