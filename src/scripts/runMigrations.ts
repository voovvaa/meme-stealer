/**
 * Скрипт для запуска миграций базы данных
 * Выполняется автоматически при старте контейнера
 */

import Database from "better-sqlite3";

import { logger } from "../core/logger.js";
import { ensureDirectoryForFile } from "../utils/helpers.js";

const MEME_DB_PATH = process.env.MEME_DB_PATH || "./sessions/memes.sqlite";

type Db = ReturnType<typeof Database>;

/**
 * Проверяет существование колонки в таблице
 */
const columnExists = (db: Db, table: string, column: string): boolean => {
  try {
    const result = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return result.some((col) => col.name === column);
  } catch {
    return false;
  }
};

/**
 * Проверяет существование таблицы
 */
const tableExists = (db: Db, table: string): boolean => {
  try {
    const result = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    return !!result;
  } catch {
    return false;
  }
};

const runMigrations = () => {
  logger.info({ dbPath: MEME_DB_PATH }, "Запуск миграций базы данных");

  try {
    // Убеждаемся, что директория существует
    ensureDirectoryForFile(MEME_DB_PATH);

    const db = new Database(MEME_DB_PATH, {
      readonly: false,
      fileMustExist: false,
    });

    db.pragma("journal_mode = WAL;");

    // Создаем таблицу для отслеживания миграций
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL
      );
    `);

    const migrations = [
      {
        name: "001_add_archived_to_source_channels",
        up: () => {
          // Проверяем существование таблицы
          if (!tableExists(db, "source_channels")) {
            logger.warn("Таблица source_channels не существует, пропускаем миграцию");
            return;
          }

          // Проверяем существование колонки
          if (columnExists(db, "source_channels", "archived")) {
            logger.debug("Колонка archived уже существует в source_channels");
            return;
          }

          db.exec(`ALTER TABLE source_channels ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
          db.exec(
            `CREATE INDEX IF NOT EXISTS idx_source_channels_archived ON source_channels(archived);`,
          );
          logger.info("Добавлена колонка archived в source_channels");
        },
      },
      {
        name: "002_add_archived_to_filter_keywords",
        up: () => {
          if (!tableExists(db, "filter_keywords")) {
            logger.warn("Таблица filter_keywords не существует, пропускаем миграцию");
            return;
          }

          if (columnExists(db, "filter_keywords", "archived")) {
            logger.debug("Колонка archived уже существует в filter_keywords");
            return;
          }

          db.exec(`ALTER TABLE filter_keywords ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
          db.exec(
            `CREATE INDEX IF NOT EXISTS idx_filter_keywords_archived ON filter_keywords(archived);`,
          );
          logger.info("Добавлена колонка archived в filter_keywords");
        },
      },
      {
        name: "003_add_file_path_to_memes",
        up: () => {
          if (!tableExists(db, "memes")) {
            logger.warn("Таблица memes не существует, пропускаем миграцию");
            return;
          }

          if (columnExists(db, "memes", "file_path")) {
            logger.debug("Колонка file_path уже существует в memes");
            return;
          }

          db.exec(`ALTER TABLE memes ADD COLUMN file_path TEXT;`);
          logger.info("Добавлена колонка file_path в memes");
        },
      },
    ];

    // Проверяем и выполняем миграции
    const executed = db
      .prepare("SELECT name FROM migrations")
      .all()
      .map((row: { name: string }) => row.name);

    for (const migration of migrations) {
      if (executed.includes(migration.name)) {
        logger.debug({ migration: migration.name }, "Миграция уже выполнена");
        continue;
      }

      try {
        logger.info({ migration: migration.name }, "Выполняем миграцию");
        migration.up();

        // Записываем успешное выполнение
        db.prepare("INSERT INTO migrations (name, executed_at) VALUES (?, ?)").run(
          migration.name,
          new Date().toISOString(),
        );

        logger.info({ migration: migration.name }, "Миграция выполнена успешно");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          { migration: migration.name, error: errorMessage },
          "Ошибка выполнения миграции",
        );
        throw error;
      }
    }

    db.close();
    logger.info("Все миграции выполнены успешно");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ error: errorMessage }, "Критическая ошибка при выполнении миграций");
    process.exit(1);
  }
};

// Запускаем миграции
runMigrations();
