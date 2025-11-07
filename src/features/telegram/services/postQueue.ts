import type { TelegramClient } from "telegram";

import { sendMediaFiles } from "./mediaSender.js";
import { env } from "../../../core/config/env.js";
import { queueRepository } from "../../../core/db/queueRepository.js";
import { memeRepository } from "../../../core/db/repositories.js";
import { logger } from "../../../core/logger.js";
import type { HashedMediaFile } from "../../../types/media.js";

/**
 * Генерирует случайный интервал между min и max
 */
const getRandomInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Вычисляет время следующей публикации
 */
const calculateNextPublishTime = (): string => {
  const lastScheduledTime = queueRepository.getLastScheduledTime();
  const now = new Date();
  const baseTime = lastScheduledTime ? new Date(lastScheduledTime) : now;

  // Если последняя запланированная публикация в будущем, используем её как базу
  const startTime = baseTime > now ? baseTime : now;

  const intervalSeconds = getRandomInterval(env.publishIntervalMin, env.publishIntervalMax);
  const nextTime = new Date(startTime.getTime() + intervalSeconds * 1000);

  return nextTime.toISOString();
};

/**
 * Класс для управления очередью публикаций
 */
export class PostQueue {
  private client: TelegramClient;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly checkIntervalMs = 5000; // Проверяем очередь каждые 5 секунд

  constructor(client: TelegramClient) {
    this.client = client;
  }

  /**
   * Добавляет медиа файлы в очередь
   */
  enqueueMedia(
    mediaFiles: HashedMediaFile[],
    sourceChannelId: string,
    sourceMessageId: number,
  ): void {
    for (const mediaFile of mediaFiles) {
      const scheduledAt = calculateNextPublishTime();

      queueRepository.enqueue({
        mediaData: mediaFile,
        sourceChannelId,
        sourceMessageId,
        scheduledAt,
      });

      logger.info(
        {
          hash: mediaFile.hash,
          scheduledAt,
          sourceChannelId,
          sourceMessageId,
        },
        "Медиа добавлено в очередь публикаций",
      );
    }

    const stats = queueRepository.getStats();
    logger.debug({ stats }, "Текущая статистика очереди");
  }

  /**
   * Обрабатывает один элемент из очереди
   */
  private async processNextItem(): Promise<boolean> {
    const item = queueRepository.getNextPending();

    if (!item) {
      return false;
    }

    logger.info(
      {
        queueItemId: item.id,
        hash: item.mediaData.hash,
        scheduledAt: item.scheduledAt,
      },
      "Начинается публикация из очереди",
    );

    // Обновляем статус на processing
    queueRepository.updateStatus(item.id, "processing");

    try {
      // Публикуем медиа
      const uploadResults = await sendMediaFiles(this.client, env.targetChannelId, [
        item.mediaData,
      ]);

      if (uploadResults.length > 0 && uploadResults[0]) {
        const result = uploadResults[0];

        // Сохраняем в таблицу memes
        memeRepository.save({
          hash: result.hash,
          sourceChannelId: item.sourceChannelId,
          sourceMessageId: item.sourceMessageId,
          targetMessageId: result.targetMessageId,
          filePath: result.filePath ?? null,
        });

        // Обновляем статус на completed
        queueRepository.updateStatus(item.id, "completed");

        logger.info(
          {
            queueItemId: item.id,
            hash: item.mediaData.hash,
            targetMessageId: result.targetMessageId,
          },
          "Медиа успешно опубликовано из очереди",
        );

        return true;
      } else {
        throw new Error("Не удалось загрузить медиа");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      queueRepository.updateStatus(item.id, "failed", errorMessage);

      logger.error(
        {
          err: error,
          queueItemId: item.id,
          hash: item.mediaData.hash,
        },
        "Ошибка при публикации из очереди",
      );

      return false;
    }
  }

  /**
   * Основной цикл обработки очереди
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const processed = await this.processNextItem();

      if (processed) {
        const pendingCount = queueRepository.getPendingCount();
        logger.debug({ pendingCount }, "Элементов в очереди осталось");
      }
    } catch (error) {
      logger.error({ err: error }, "Ошибка в цикле обработки очереди");
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Запускает процессор очереди
   */
  start(): void {
    if (this.intervalId) {
      logger.warn("Процессор очереди уже запущен");
      return;
    }

    const pendingCount = queueRepository.getPendingCount();
    const stats = queueRepository.getStats();

    logger.info(
      {
        checkIntervalMs: this.checkIntervalMs,
        publishIntervalMin: env.publishIntervalMin,
        publishIntervalMax: env.publishIntervalMax,
        pendingCount,
        stats,
      },
      "Запуск процессора очереди публикаций",
    );

    // Запускаем периодическую проверку очереди
    this.intervalId = setInterval(() => {
      void this.processQueue();
    }, this.checkIntervalMs);

    // Сразу проверяем очередь при старте
    void this.processQueue();
  }

  /**
   * Останавливает процессор очереди
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;

      logger.info("Процессор очереди публикаций остановлен");
    }
  }

  /**
   * Получает текущую статистику очереди
   */
  getStats() {
    return queueRepository.getStats();
  }
}
