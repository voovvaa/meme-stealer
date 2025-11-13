import type Database from "better-sqlite3";

import { logger } from "../logger.js";

/**
 * Версия схемы базы данных
 * Увеличивайте при изменении структуры таблиц
 */
const SCHEMA_VERSION = 2;

/**
 * Инициализирует все таблицы базы данных
 * Вызывается один раз при первом подключении к БД
 */
export const initializeDatabase = (db: ReturnType<typeof Database>): void => {
  logger.info("🔧 Инициализация базы данных...");

  // Включаем транзакцию для атомарности
  const init = db.transaction(() => {
    // Таблица для версии схемы
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    // Проверяем текущую версию
    const currentVersion = db
      .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
      .get() as { version: number } | undefined;

    if (currentVersion && currentVersion.version === SCHEMA_VERSION) {
      logger.info({ version: SCHEMA_VERSION }, "✅ База данных актуальна");
      return;
    }

    logger.info({ version: SCHEMA_VERSION }, "📦 Создание таблиц базы данных...");

    // ==================== КОНФИГУРАЦИЯ ====================
    db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        api_id INTEGER NOT NULL,
        api_hash TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        telegram_password TEXT,
        target_channel_id TEXT NOT NULL,
        enable_queue INTEGER NOT NULL DEFAULT 1,
        publish_interval_min INTEGER NOT NULL DEFAULT 60,
        publish_interval_max INTEGER NOT NULL DEFAULT 300,
        needs_reload INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    // ==================== КАНАЛЫ-ИСТОЧНИКИ ====================
    db.exec(`
      CREATE TABLE IF NOT EXISTS source_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL UNIQUE,
        channel_name TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_source_channels_enabled
        ON source_channels(enabled);
      CREATE INDEX IF NOT EXISTS idx_source_channels_archived
        ON source_channels(archived);
    `);

    // ==================== КЛЮЧЕВЫЕ СЛОВА ФИЛЬТРАЦИИ ====================
    db.exec(`
      CREATE TABLE IF NOT EXISTS filter_keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL UNIQUE,
        enabled INTEGER NOT NULL DEFAULT 1,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_filter_keywords_enabled
        ON filter_keywords(enabled);
      CREATE INDEX IF NOT EXISTS idx_filter_keywords_archived
        ON filter_keywords(archived);
    `);

    // ==================== МЕМЫ (ИСТОРИЯ) ====================
    db.exec(`
      CREATE TABLE IF NOT EXISTS memes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        source_channel_id TEXT NOT NULL,
        source_message_id INTEGER NOT NULL,
        target_message_id INTEGER,
        file_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memes_hash
        ON memes(hash);
      CREATE INDEX IF NOT EXISTS idx_memes_created_at
        ON memes(created_at);
      CREATE INDEX IF NOT EXISTS idx_memes_source_channel
        ON memes(source_channel_id);
    `);

    // ==================== ОЧЕРЕДЬ ПУБЛИКАЦИЙ ====================
    db.exec(`
      CREATE TABLE IF NOT EXISTS post_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_data TEXT NOT NULL,
        source_channel_id TEXT NOT NULL,
        source_message_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        scheduled_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        processed_at TEXT,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_queue_status
        ON post_queue(status);
      CREATE INDEX IF NOT EXISTS idx_queue_scheduled
        ON post_queue(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_queue_created
        ON post_queue(created_at);
    `);

    // Сохраняем версию схемы
    if (!currentVersion) {
      db.prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)").run(
        SCHEMA_VERSION,
        new Date().toISOString(),
      );
    } else {
      db.prepare("UPDATE schema_version SET version = ?, applied_at = ? WHERE version = ?").run(
        SCHEMA_VERSION,
        new Date().toISOString(),
        currentVersion.version,
      );
    }

    logger.info({ version: SCHEMA_VERSION }, "✅ База данных инициализирована");
  });

  // Выполняем инициализацию
  init();
};
