import { getDatabase } from "./database.js";
import type { HashedMediaFile } from "../../types/media.js";
import type { QueueStatus } from "../../types/database.js";
import { logger } from "../logger.js";

// Re-export для обратной совместимости
export type { QueueStatus };

const db = getDatabase();

export type QueueItem = {
  id: number;
  mediaData: HashedMediaFile;
  sourceChannelId: string;
  sourceMessageId: number;
  status: QueueStatus;
  scheduledAt: string;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
};

export type QueueItemInput = {
  mediaData: HashedMediaFile;
  sourceChannelId: string;
  sourceMessageId: number;
  scheduledAt: string;
};

// Prepared statements
const insertStmt = db.prepare(
  `
  INSERT INTO post_queue (
    media_data,
    source_channel_id,
    source_message_id,
    status,
    scheduled_at,
    created_at
  )
  VALUES (?, ?, ?, 'pending', ?, ?)
`,
);

const getNextPendingStmt = db.prepare(`
  SELECT
    id,
    media_data,
    source_channel_id,
    source_message_id,
    status,
    scheduled_at,
    created_at,
    processed_at,
    error_message
  FROM post_queue
  WHERE status = 'pending' AND scheduled_at <= ?
  ORDER BY scheduled_at ASC
  LIMIT 1
`);

const updateStatusStmt = db.prepare(
  `
  UPDATE post_queue
  SET status = ?, processed_at = ?
  WHERE id = ?
`,
);

const updateStatusWithErrorStmt = db.prepare(
  `
  UPDATE post_queue
  SET status = ?, processed_at = ?, error_message = ?
  WHERE id = ?
`,
);

const getQueueStatsStmt = db.prepare(`
  SELECT
    status,
    COUNT(*) as count
  FROM post_queue
  GROUP BY status
`);

const getPendingCountStmt = db.prepare(`
  SELECT COUNT(*) as count
  FROM post_queue
  WHERE status = 'pending'
`);

const getLastScheduledTimeStmt = db.prepare(`
  SELECT scheduled_at
  FROM post_queue
  WHERE status = 'pending'
  ORDER BY scheduled_at DESC
  LIMIT 1
`);

/**
 * Парсит строку JSON в объект HashedMediaFile
 */
const parseMediaData = (jsonString: string): HashedMediaFile => {
  const parsed = JSON.parse(jsonString);
  // Конвертируем buffer из массива обратно в Buffer
  if (parsed.buffer && Array.isArray(parsed.buffer)) {
    parsed.buffer = Buffer.from(parsed.buffer);
  }
  return parsed as HashedMediaFile;
};

/**
 * Преобразует объект HashedMediaFile в строку JSON
 */
const stringifyMediaData = (mediaData: HashedMediaFile): string => {
  // Buffer нужно преобразовать в массив для JSON
  const serializable = {
    ...mediaData,
    buffer: Array.from(mediaData.buffer),
  };
  return JSON.stringify(serializable);
};

/**
 * Преобразует строку из БД в QueueItem
 */
const rowToQueueItem = (row: {
  id: number;
  media_data: string;
  source_channel_id: string;
  source_message_id: number;
  status: string;
  scheduled_at: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}): QueueItem => ({
  id: row.id,
  mediaData: parseMediaData(row.media_data),
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  status: row.status as QueueStatus,
  scheduledAt: row.scheduled_at,
  createdAt: row.created_at,
  processedAt: row.processed_at,
  errorMessage: row.error_message,
});

export const queueRepository = {
  /**
   * Добавляет элемент в очередь
   */
  enqueue(item: QueueItemInput): void {
    try {
      const mediaDataString = stringifyMediaData(item.mediaData);
      insertStmt.run(
        mediaDataString,
        item.sourceChannelId,
        item.sourceMessageId,
        item.scheduledAt,
        new Date().toISOString(),
      );

      logger.debug(
        {
          hash: item.mediaData.hash,
          scheduledAt: item.scheduledAt,
          sourceChannelId: item.sourceChannelId,
        },
        "Элемент добавлен в очередь",
      );
    } catch (error) {
      logger.error({ err: error, hash: item.mediaData.hash }, "Ошибка добавления в очередь");
      throw error;
    }
  },

  /**
   * Получает следующий элемент для публикации
   */
  getNextPending(): QueueItem | null {
    const row = getNextPendingStmt.get(new Date().toISOString());
    if (!row) {
      return null;
    }

    return rowToQueueItem(
      row as {
        id: number;
        media_data: string;
        source_channel_id: string;
        source_message_id: number;
        status: string;
        scheduled_at: string;
        created_at: string;
        processed_at: string | null;
        error_message: string | null;
      },
    );
  },

  /**
   * Обновляет статус элемента
   */
  updateStatus(id: number, status: QueueStatus, errorMessage?: string): void {
    const processedAt = new Date().toISOString();

    if (errorMessage) {
      updateStatusWithErrorStmt.run(status, processedAt, errorMessage, id);
    } else {
      updateStatusStmt.run(status, processedAt, id);
    }

    logger.debug({ queueItemId: id, status }, "Статус элемента очереди обновлен");
  },

  /**
   * Получает статистику по очереди
   */
  getStats(): Record<QueueStatus, number> {
    const rows = getQueueStatsStmt.all() as Array<{ status: QueueStatus; count: number }>;
    const stats: Record<QueueStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const row of rows) {
      stats[row.status] = row.count;
    }

    return stats;
  },

  /**
   * Получает количество элементов в очереди
   */
  getPendingCount(): number {
    const row = getPendingCountStmt.get() as { count: number };
    return row.count;
  },

  /**
   * Получает время последней запланированной публикации
   */
  getLastScheduledTime(): string | null {
    const row = getLastScheduledTimeStmt.get() as { scheduled_at: string } | undefined;
    return row?.scheduled_at ?? null;
  },
};
