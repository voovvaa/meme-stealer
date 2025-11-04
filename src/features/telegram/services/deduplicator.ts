import type { MediaFile, HashedMediaFile } from "../../../types/media.js";
import { hashBufferSHA256 } from "../../../utils/hash.js";
import { logger } from "../../../core/logger.js";

export type DuplicateCheckResult = {
  newFiles: HashedMediaFile[];
  duplicateCount: number;
};

/**
 * Проверяет медиа файлы на дубликаты
 * @param mediaFiles - массив медиа файлов
 * @param hasHashInDb - функция для проверки наличия хеша в БД
 * @param context - контекст для логирования (ID сообщения, канал и т.д.)
 */
export const checkForDuplicates = (
  mediaFiles: MediaFile[],
  hasHashInDb: (hash: string) => boolean,
  context: { messageId: number; channel: string | number },
): DuplicateCheckResult => {
  const hashedFiles = mediaFiles.map((file) => ({
    ...file,
    hash: hashBufferSHA256(file.buffer),
  }));

  const seenHashes = new Set<string>();
  const newFiles: HashedMediaFile[] = [];

  for (const file of hashedFiles) {
    // Проверка дубликата в рамках одного сообщения
    if (seenHashes.has(file.hash)) {
      logger.debug({ hash: file.hash }, "Дубликат в рамках сообщения, пропуск");
      continue;
    }

    seenHashes.add(file.hash);

    // Проверка дубликата в БД
    if (hasHashInDb(file.hash)) {
      logger.info(
        {
          hash: file.hash,
          sourceMessageId: context.messageId,
          sourceChannel: context.channel,
        },
        "Найден ранее опубликованный мем, пропуск",
      );
      continue;
    }

    newFiles.push(file);
  }

  return {
    newFiles,
    duplicateCount: hashedFiles.length - newFiles.length,
  };
};
