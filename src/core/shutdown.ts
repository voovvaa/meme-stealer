import type { TelegramClient } from "telegram";
import { closeDatabase } from "./db/database.js";
import { logger } from "./logger.js";

/**
 * Тип функции для очистки ресурсов
 */
type CleanupFunction = () => Promise<void> | void;

/**
 * Менеджер для корректного завершения работы приложения
 */
class ShutdownManager {
  private cleanupFunctions: CleanupFunction[] = [];
  private isShuttingDown = false;
  private shutdownTimeout = 10000; // 10 секунд на завершение

  /**
   * Регистрирует функцию очистки ресурсов
   */
  public registerCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Выполняет graceful shutdown
   */
  public async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn("Shutdown уже выполняется, игнорируем повторный вызов");
      return;
    }

    this.isShuttingDown = true;
    logger.info({ signal }, "Начинается graceful shutdown");

    // Устанавливаем таймаут для принудительного завершения
    const forceExitTimeout = setTimeout(() => {
      logger.error("Graceful shutdown превысил таймаут, принудительное завершение");
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Выполняем все функции очистки в обратном порядке регистрации
      for (let i = this.cleanupFunctions.length - 1; i >= 0; i--) {
        const cleanup = this.cleanupFunctions[i];
        if (!cleanup) continue;

        try {
          await cleanup();
        } catch (error) {
          logger.error({ err: error, index: i }, "Ошибка при выполнении cleanup функции");
        }
      }

      // Закрываем базу данных последней
      closeDatabase();

      logger.info("Graceful shutdown завершен успешно");
      clearTimeout(forceExitTimeout);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Критическая ошибка при shutdown");
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  }

  /**
   * Устанавливает обработчики сигналов завершения
   */
  public setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGHUP"];

    for (const signal of signals) {
      process.on(signal, () => {
        void this.shutdown(signal);
      });
    }

    // Обработка необработанных исключений
    process.on("uncaughtException", (error: Error) => {
      logger.error({ err: error }, "Необработанное исключение");
      void this.shutdown("uncaughtException");
    });

    // Обработка необработанных отклонений промисов
    process.on("unhandledRejection", (reason: unknown) => {
      logger.error({ reason }, "Необработанное отклонение промиса");
      void this.shutdown("unhandledRejection");
    });

    logger.info("Обработчики сигналов завершения установлены");
  }
}

// Singleton инстанс
const shutdownManager = new ShutdownManager();

/**
 * Регистрирует функцию очистки ресурсов
 */
export const registerCleanup = (cleanup: CleanupFunction): void => {
  shutdownManager.registerCleanup(cleanup);
};

/**
 * Устанавливает обработчики сигналов завершения
 */
export const setupShutdownHandlers = (): void => {
  shutdownManager.setupSignalHandlers();
};

/**
 * Создает cleanup функцию для Telegram клиента
 */
export const createTelegramClientCleanup = (client: TelegramClient): CleanupFunction => {
  return async () => {
    try {
      logger.info("Закрытие Telegram клиента");
      await client.disconnect();
      logger.info("Telegram клиент закрыт");
    } catch (error) {
      logger.error({ err: error }, "Ошибка при закрытии Telegram клиента");
    }
  };
};
