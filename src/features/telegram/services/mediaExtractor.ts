import { Api, type TelegramClient } from "telegram";
import type { NewMessageEvent } from "telegram/events/index.js";

import type { MediaFile } from "../../../types/media.js";
import { ensureBuffer } from "../../../utils/helpers.js";

/**
 * Проверяет, является ли документ изображением
 */
const isImageDocument = (document: Api.TypeDocument): document is Api.Document => {
  if (!(document instanceof Api.Document)) {
    return false;
  }

  const mime = document.mimeType ?? "";
  return mime.startsWith("image/");
};

/**
 * Извлекает имя файла из атрибутов документа
 */
const resolveFileName = (document: Api.Document, fallback: string): string => {
  for (const attr of document.attributes ?? []) {
    if (attr instanceof Api.DocumentAttributeFilename) {
      return attr.fileName;
    }
  }

  return fallback;
};

/**
 * Извлекает медиа файлы из сообщения Telegram
 */
export const extractMediaFiles = async (
  client: TelegramClient,
  event: NewMessageEvent,
): Promise<MediaFile[]> => {
  const media = event.message.media;
  if (!media) {
    return [];
  }

  if (media instanceof Api.MessageMediaPhoto && media.photo) {
    const downloaded = await client.downloadMedia(event.message, {});
    if (!downloaded || typeof downloaded === "string") {
      return [];
    }

    return [
      {
        buffer: ensureBuffer(downloaded),
        fileName: `photo_${event.message.id}.jpg`,
        mimeType: "image/jpeg",
      },
    ];
  }

  if (media instanceof Api.MessageMediaDocument && media.document) {
    if (!isImageDocument(media.document)) {
      return [];
    }

    const downloaded = await client.downloadMedia(event.message, {});
    if (!downloaded || typeof downloaded === "string") {
      return [];
    }

    const document = media.document;
    const fallbackName = `image_${event.message.id}`;
    const fileName = resolveFileName(document, fallbackName);

    return [
      {
        buffer: ensureBuffer(downloaded),
        fileName,
        mimeType: document.mimeType ?? undefined,
      },
    ];
  }

  return [];
};
