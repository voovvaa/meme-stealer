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

const isAdContent = buildAdFilter(env.adKeywords);
const channelMatcher = createChannelMatcher(env.sourceChannelIds);

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
const handleChannelPost = async (client: TelegramClient, event: NewMessageEvent) => {
  const channelMeta = await resolveChannelMeta(event);

  if (!channelMeta) {
    logger.debug("Сообщение получено не из канала, пропуск");
    return;
  }

  if (!channelMatcher(channelMeta.id.toString(), channelMeta.username)) {
    logger.debug(
      { channelId: channelMeta.id, username: channelMeta.username },
      "Источник не входит в белый список, пропуск",
    );
    return;
  }

  const content = event.message.message ?? "";
  const caption = event.message.media ? content : null;

  if (isAdContent(content, caption)) {
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

    const uploadResults = await sendMediaFiles(client, env.targetChannelId, newFiles);

    const sourceChannelId = String(channelMeta.id);

    for (const result of uploadResults) {
      memeRepository.save({
        hash: result.hash,
        sourceChannelId,
        sourceMessageId: event.message.id,
        targetMessageId: result.targetMessageId,
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

/**
 * Регистрирует обработчик постов из каналов
 */
export const registerChannelPostHandler = (client: TelegramClient) => {
  client.addEventHandler(
    (event) => handleChannelPost(client, event),
    new NewMessage({
      chats: env.sourceChannelIds,
    }),
  );
};
