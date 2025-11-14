import type { TelegramClient } from "telegram";

import { TIMEOUTS } from "./constants.js";
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
  private shutdownTimeout = TIMEOUTS.SHUTDOWN;

  /**
   * Регистрирует функцию очистки ресурсов
   */
  public registerCleanup(cleanup: CleanupFunction): void {
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Проверяет, является ли ошибка сетевой ошибкой Telegram клиента
   */
  private isTelegramNetworkError(reason: unknown): boolean {
    if (!reason) return false;

    // Проверяем строковое представление ошибки
    const errorString = String(reason);
    const errorMessage = reason instanceof Error ? reason.message : errorString;

    // Список сетевых ошибок Telegram, которые не должны вызывать shutdown
    const telegramNetworkErrors = [
      "TIMEOUT",
      "EHOSTUNREACH", // Host is unreachable
      "ECONNRESET", // Connection reset by peer
      "ECONNREFUSED", // Connection refused
      "ETIMEDOUT", // Connection timed out
      "ENETUNREACH", // Network is unreachable
      "ENOTFOUND", // DNS lookup failed
    ];

    // Проверяем, содержит ли ошибка один из известных сетевых кодов
    for (const errorCode of telegramNetworkErrors) {
      if (errorString.includes(errorCode) || errorMessage.includes(errorCode)) {
        // Дополнительно проверяем, что это ошибка из telegram клиента
        // (путь содержит telegram или updates.js)
        if (
          errorString.includes("telegram") ||
          errorString.includes("updates.js") ||
          errorMessage.includes("telegram") ||
          errorMessage.includes("updates.js")
        ) {
          return true;
        }
      }
    }

    return false;
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
      // Проверяем, является ли это сетевой ошибкой Telegram клиента
      const isTelegramNetworkError = this.isTelegramNetworkError(reason);

      if (isTelegramNetworkError) {
        // Логируем ошибку, но не завершаем приложение
        // Telegram клиент с autoReconnect автоматически переподключится
        logger.warn(
          { reason },
          "Сетевая ошибка Telegram клиента (TIMEOUT/EHOSTUNREACH). Клиент переподключится автоматически",
        );
        return;
      }

      // Для всех остальных ошибок выполняем shutdown
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
