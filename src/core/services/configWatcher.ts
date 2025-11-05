import { reloadConfig } from "../config/env.js";
import { configRepository } from "../db/configRepository.js";
import { logger } from "../logger.js";

/**
 * Сервис для отслеживания изменений конфигурации
 */
export class ConfigWatcher {
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number;

  constructor(checkInterval: number = 5000) {
    this.checkInterval = checkInterval;
  }

  /**
   * Запустить отслеживание изменений
   */
  start(): void {
    if (this.intervalId) {
      logger.warn("ConfigWatcher уже запущен");
      return;
    }

    logger.info({ checkInterval: this.checkInterval }, "Запуск ConfigWatcher");

    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
  }

  /**
   * Остановить отслеживание
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("ConfigWatcher остановлен");
    }
  }

  /**
   * Проверить наличие обновлений конфигурации
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const config = configRepository.getConfig();

      if (config && config.needsReload) {
        logger.info("Обнаружено изменение конфигурации, перезагрузка...");

        // Перезагружаем конфигурацию
        const newConfig = await reloadConfig();

        // Сбрасываем флаг needs_reload
        configRepository.clearNeedsReload();

        logger.info(
          {
            sourceChannels: newConfig.sourceChannelIds.length,
            adKeywords: newConfig.adKeywords.length,
            enableQueue: newConfig.enableQueue,
            publishIntervalMin: newConfig.publishIntervalMin,
            publishIntervalMax: newConfig.publishIntervalMax,
          },
          "Конфигурация успешно перезагружена",
        );

        // Можно добавить дополнительные действия при изменении конфигурации
        // Например, переподключение к каналам или обновление фильтров
      }
    } catch (error) {
      logger.error({ err: error }, "Ошибка при проверке обновлений конфигурации");
    }
  }
}

// Экспортируем singleton
export const configWatcher = new ConfigWatcher();
