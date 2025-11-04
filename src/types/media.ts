/**
 * Базовый тип медиа файла
 */
export type MediaFile = {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
};

/**
 * Медиа файл с хешем для дедупликации
 */
export type HashedMediaFile = MediaFile & {
  hash: string;
};
