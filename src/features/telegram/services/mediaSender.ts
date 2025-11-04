import { Api, type TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads.js";

import type { HashedMediaFile } from "../../../types/media.js";
import { UPLOAD_WORKERS } from "../../../core/constants.js";

export type MediaUploadResult = {
  targetMessageId: number;
  hash: string;
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

    results.push({
      targetMessageId: sentMessage.id,
      hash: file.hash,
    });
  }

  return results;
};
