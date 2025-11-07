import type Database from "better-sqlite3";

/**
 * Database schema version
 * Increment when changing table structure
 */
const SCHEMA_VERSION = 2; // Increased to 2 for archived columns

export interface InitOptions {
  logger?: {
    info: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
  };
}

/**
 * Initialize database schema
 */
export const initializeDatabase = (
  db: ReturnType<typeof Database>,
  options: InitOptions = {}
): void => {
  const logger = options.logger;
  logger?.info({}, "Initializing database...");

  const init = db.transaction(() => {
    // Schema version table
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    // Check current version
    const currentVersion = db
      .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
      .get() as { version: number } | undefined;

    if (currentVersion && currentVersion.version === SCHEMA_VERSION) {
      logger?.info({ version: SCHEMA_VERSION }, "Database schema is up to date");
      return;
    }

    logger?.info({ version: SCHEMA_VERSION }, "Creating/updating database tables...");

    // ==================== CONFIG ====================
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

    // ==================== SOURCE CHANNELS ====================
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

    // Add archived column to existing source_channels if missing
    try {
      db.exec(`ALTER TABLE source_channels ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
      logger?.info({}, "Added 'archived' column to source_channels");
    } catch {
      // Column already exists
    }

    // ==================== FILTER KEYWORDS ====================
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

    // Add archived column to existing filter_keywords if missing
    try {
      db.exec(`ALTER TABLE filter_keywords ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;`);
      logger?.info({}, "Added 'archived' column to filter_keywords");
    } catch {
      // Column already exists
    }

    // ==================== MEMES (HISTORY) ====================
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
      CREATE INDEX IF NOT EXISTS idx_memes_target_message
        ON memes(target_message_id);
    `);

    // ==================== POST QUEUE ====================
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

    // Save schema version
    if (!currentVersion) {
      db.prepare("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)").run(
        SCHEMA_VERSION,
        new Date().toISOString()
      );
    } else {
      db.prepare("UPDATE schema_version SET version = ?, applied_at = ? WHERE version = ?").run(
        SCHEMA_VERSION,
        new Date().toISOString(),
        currentVersion.version
      );
    }

    logger?.info({ version: SCHEMA_VERSION }, "Database initialized successfully");
  });

  // Execute initialization
  init();
};
