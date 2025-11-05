/**
 * Скрипт для запуска миграций базы данных
 * Выполняется автоматически при старте контейнера
 */

import Database from "better-sqlite3";

import { logger } from "../core/logger.js";
import { ensureDirectoryForFile } from "../utils/helpers.js";

const MEME_DB_PATH = process.env.MEME_DB_PATH || "./sessions/memes.sqlite";

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
          db.exec(`ALTER TABLE source_channels ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
          db.exec(
            `CREATE INDEX IF NOT EXISTS idx_source_channels_archived ON source_channels(archived);`,
          );
        },
      },
      {
        name: "002_add_archived_to_filter_keywords",
        up: () => {
          db.exec(`ALTER TABLE filter_keywords ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
          db.exec(
            `CREATE INDEX IF NOT EXISTS idx_filter_keywords_archived ON filter_keywords(archived);`,
          );
        },
      },
      {
        name: "003_add_file_path_to_memes",
        up: () => {
          db.exec(`ALTER TABLE memes ADD COLUMN file_path TEXT;`);
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
        if (error instanceof Error && error.message.includes("duplicate column name")) {
          logger.warn(
            { migration: migration.name, error: error.message },
            "Колонка уже существует, пропускаем миграцию",
          );

          // Записываем как выполненную, чтобы не пытаться снова
          db.prepare("INSERT OR IGNORE INTO migrations (name, executed_at) VALUES (?, ?)").run(
            migration.name,
            new Date().toISOString(),
          );
        } else {
          logger.error({ migration: migration.name, error }, "Ошибка выполнения миграции");
          throw error;
        }
      }
    }

    db.close();
    logger.info("Все миграции выполнены успешно");
  } catch (error) {
    logger.error({ error }, "Критическая ошибка при выполнении миграций");
    process.exit(1);
  }
};

// Запускаем миграции
runMigrations();
