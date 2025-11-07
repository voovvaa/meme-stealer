import { initializeDatabase } from "@meme-stealer/shared";
import Database from "better-sqlite3";

import { ensureDirectoryForFile } from "../../utils/helpers.js";
import { logger } from "../logger.js";

/**
 * Единый инстанс базы данных для всего приложения.
 * Предотвращает создание множественных подключений и проблемы с блокировками.
 */
class DatabaseConnection {
  private static instance: ReturnType<typeof Database> | null = null;
  private static dbPath: string = process.env.MEME_DB_PATH || "./sessions/memes.sqlite";
  private static initialized: boolean = false;

  /**
   * Получить singleton инстанс базы данных
   */
  public static getInstance(): ReturnType<typeof Database> {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = DatabaseConnection.createConnection();
      DatabaseConnection.initializeTables();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Создать новое подключение к базе данных
   */
  private static createConnection(): ReturnType<typeof Database> {
    ensureDirectoryForFile(DatabaseConnection.dbPath);

    const db = new Database(DatabaseConnection.dbPath, {
      readonly: false,
      fileMustExist: false,
    });

    // Включаем WAL режим для лучшей производительности
    db.pragma("journal_mode = WAL");

    // Оптимизируем производительность
    db.pragma("synchronous = NORMAL");
    db.pragma("cache_size = 10000");
    db.pragma("temp_store = MEMORY");

    logger.info({ path: DatabaseConnection.dbPath }, "База данных подключена");

    return db;
  }

  /**
   * Инициализировать структуру таблиц
   */
  private static initializeTables(): void {
    if (!DatabaseConnection.initialized && DatabaseConnection.instance) {
      initializeDatabase(DatabaseConnection.instance, { logger });
      DatabaseConnection.initialized = true;
    }
  }

  /**
   * Закрыть подключение к базе данных
   */
  public static close(): void {
    if (DatabaseConnection.instance) {
      try {
        DatabaseConnection.instance.close();
        logger.info("База данных закрыта");
      } catch (error) {
        logger.error({ err: error }, "Ошибка при закрытии базы данных");
      } finally {
        DatabaseConnection.instance = null;
        DatabaseConnection.initialized = false;
      }
    }
  }

  /**
   * Проверить доступность подключения
   */
  public static isConnected(): boolean {
    try {
      if (!DatabaseConnection.instance) {
        return false;
      }
      // Простой запрос для проверки соединения
      DatabaseConnection.instance.prepare("SELECT 1").get();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Получить инстанс базы данных
 */
export const getDatabase = (): ReturnType<typeof Database> => {
  return DatabaseConnection.getInstance();
};

/**
 * Закрыть базу данных (используется при graceful shutdown)
 */
export const closeDatabase = (): void => {
  DatabaseConnection.close();
};

/**
 * Проверить подключение к БД
 */
export const isDatabaseConnected = (): boolean => {
  return DatabaseConnection.isConnected();
};
