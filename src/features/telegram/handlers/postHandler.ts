import { Api, type TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads";
import { NewMessage, type NewMessageEvent } from "telegram/events";

import { buildAdFilter } from "./adFilter";
import { env } from "../../../core/config/env";
import { memeRepository } from "../../../core/db";
import { logger } from "../../../core/logger";
import { hashBufferSHA256 } from "../../../utils/hash";
import { ensureChannelAllowed } from "../helpers/channelMatcher";

const isAdContent = buildAdFilter(env.adKeywords);
const channelMatcher = ensureChannelAllowed(env.sourceChannelIds);

type MediaFile = {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
};

const extractContentPreview = (event: NewMessageEvent): string => {
  const text = event.message.message ?? event.message.rawText ?? "";
  return text.slice(0, 120);
};

const resolveChannelMeta = async (event: NewMessageEvent) => {
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

const isImageDocument = (document: Api.TypeDocument): document is Api.Document => {
  if (!(document instanceof Api.Document)) {
    return false;
  }

  const mime = document.mimeType ?? "";
  return mime.startsWith("image/");
};

const resolveFileName = (document: Api.Document, fallback: string): string => {
  for (const attr of document.attributes ?? []) {
    if (attr instanceof Api.DocumentAttributeFilename) {
      return attr.fileName;
    }
  }

  return fallback;
};

const extractMediaFiles = async (
  client: TelegramClient,
  event: NewMessageEvent,
): Promise<MediaFile[]> => {
  const media = event.message.media;
  if (!media) {
    return [];
  }

  if (media instanceof Api.MessageMediaPhoto && media.photo) {
    const buffer = await client.downloadMedia(event.message, {});
    if (!buffer) {
      return [];
    }

    return [
      {
        buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
        fileName: `photo_${event.message.id}.jpg`,
        mimeType: "image/jpeg",
      },
    ];
  }

  if (media instanceof Api.MessageMediaDocument && media.document) {
    if (!isImageDocument(media.document)) {
      return [];
    }

    const buffer = await client.downloadMedia(event.message, {});
    if (!buffer) {
      return [];
    }

    const document = media.document;
    const fallbackName = `image_${event.message.id}`;
    const fileName = resolveFileName(document, fallbackName);

    return [
      {
        buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
        fileName,
        mimeType: document.mimeType ?? undefined,
      },
    ];
  }

  return [];
};

export const registerChannelPostHandler = (client: TelegramClient) => {
  client.addEventHandler(
    async (event) => {
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

        const hashedFiles = mediaFiles.map((file) => ({
          ...file,
          hash: hashBufferSHA256(file.buffer),
        }));

        const seenHashes = new Set<string>();
        const newMedia: Array<MediaFile & { hash: string }> = [];

        for (const file of hashedFiles) {
          if (seenHashes.has(file.hash)) {
            logger.debug({ hash: file.hash }, "Дубликат в рамках сообщения, пропуск");
            continue;
          }

          seenHashes.add(file.hash);

          if (memeRepository.hasHash(file.hash)) {
            logger.info(
              {
                hash: file.hash,
                sourceMessageId: event.message.id,
                sourceChannel: channelMeta.username ?? channelMeta.id,
              },
              "Найден ранее опубликованный мем, пропуск",
            );
            continue;
          }

          newMedia.push(file);
        }

        if (!newMedia.length) {
          logger.info(
            {
              messageId: event.message.id,
              channelId: channelMeta.id,
            },
            "Все вложения оказались дублями, сообщение пропущено",
          );
          return;
        }

        const captionText = content.length ? content : null;
        const sourceChannelId = String(channelMeta.id);

        for (const [index, file] of newMedia.entries()) {
          const forceDocument = Boolean(file.mimeType && !file.mimeType.startsWith("image/"));
          const captionForFile = index === 0 ? captionText ?? undefined : undefined;

          const customFile = new CustomFile(file.fileName, file.buffer.byteLength, "", file.buffer);

          const sendFileOptions: Parameters<TelegramClient["sendFile"]>[1] = {
            file: customFile,
            caption: captionForFile,
            forceDocument,
            workers: 1,
          };

          if (forceDocument) {
            sendFileOptions.attributes = [
              new Api.DocumentAttributeFilename({
                fileName: file.fileName,
              }),
            ];
          }

          const sentMessage = await client.sendFile(env.targetChannelId, sendFileOptions);
          const targetMessageId = sentMessage instanceof Api.Message ? sentMessage.id : null;

          memeRepository.save({
            hash: file.hash,
            sourceChannelId,
            sourceMessageId: event.message.id,
            targetMessageId,
          });
        }

        logger.info(
          {
            from: channelMeta.username ?? channelMeta.id,
            to: env.targetChannelId,
            messageId: event.message.id,
            uploadedCount: newMedia.length,
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
    },
    new NewMessage({
      chats: env.sourceChannelIds,
    }),
  );
};
