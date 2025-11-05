import fs from "fs/promises";
import path from "path";
import { Api, type TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads.js";

import { UPLOAD_WORKERS } from "../../../core/constants.js";
import { logger } from "../../../core/logger.js";
import type { HashedMediaFile } from "../../../types/media.js";

export type MediaUploadResult = {
  targetMessageId: number;
  hash: string;
  filePath?: string;
};

/**
 * Сохраняет файл мема в структуре YYYY/MM/hash.ext
 */
const saveMediaFile = async (file: HashedMediaFile): Promise<string | null> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Определяем расширение файла
    const ext = path.extname(file.fileName) || ".jpg";
    const fileName = `${file.hash}${ext}`;

    // Создаем структуру каталогов: ./media/YYYY/MM/
    const mediaDir = path.join(process.cwd(), "media", String(year), month);
    await fs.mkdir(mediaDir, { recursive: true });

    // Полный путь к файлу
    const filePath = path.join(mediaDir, fileName);

    // Сохраняем файл
    await fs.writeFile(filePath, file.buffer);

    // Возвращаем относительный путь для БД
    const relativePath = `media/${year}/${month}/${fileName}`;
    logger.debug({ filePath: relativePath }, "Мем сохранен на диск");

    return relativePath;
  } catch (error) {
    logger.error({ error, hash: file.hash }, "Ошибка сохранения мема на диск");
    return null;
  }
};

/**
 * Отправляет медиа файлы в целевой канал
 */
export const sendMediaFiles = async (
  client: TelegramClient,
  targetChannelId: string,
  mediaFiles: HashedMediaFile[],
): Promise<MediaUploadResult[]> => {
  const results: MediaUploadResult[] = [];

  for (const file of mediaFiles) {
    const forceDocument = Boolean(file.mimeType && !file.mimeType.startsWith("image/"));

    const customFile = new CustomFile(file.fileName, file.buffer.byteLength, "", file.buffer);

    const sendFileOptions: Parameters<TelegramClient["sendFile"]>[1] = {
      file: customFile,
      forceDocument,
      workers: UPLOAD_WORKERS,
    };

    if (forceDocument) {
      sendFileOptions.attributes = [
        new Api.DocumentAttributeFilename({
          fileName: file.fileName,
        }),
      ];
    }

    const sentMessage = await client.sendFile(targetChannelId, sendFileOptions);

    // Сохраняем файл на диск после успешной отправки
    const filePath = await saveMediaFile(file);

    results.push({
      targetMessageId: sentMessage.id,
      hash: file.hash,
      filePath: filePath || undefined,
    });
  }

  return results;
};
