import Database from "better-sqlite3";

import { ensureDirectoryForFile } from "../../utils/helpers.js";
import { logger } from "../logger.js";

const MEME_DB_PATH = process.env.MEME_DB_PATH || "./sessions/memes.sqlite";

ensureDirectoryForFile(MEME_DB_PATH);

const db = new Database(MEME_DB_PATH, {
  readonly: false,
  fileMustExist: false,
});

db.pragma("journal_mode = WAL;");

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

  CREATE INDEX IF NOT EXISTS idx_memes_hash ON memes(hash);
  CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at);
  CREATE INDEX IF NOT EXISTS idx_memes_source_channel ON memes(source_channel_id);
`);

// Ленивая инициализация prepared statements (создаются после миграций)
let selectByHashStmt: ReturnType<typeof db.prepare> | null = null;
let insertStmt: ReturnType<typeof db.prepare> | null = null;

const getSelectByHashStmt = () => {
  if (!selectByHashStmt) {
    selectByHashStmt = db.prepare("SELECT 1 FROM memes WHERE hash = ? LIMIT 1");
  }
  return selectByHashStmt;
};

const getInsertStmt = () => {
  if (!insertStmt) {
    insertStmt = db.prepare(
      `
      INSERT INTO memes (
        hash,
        source_channel_id,
        source_message_id,
        target_message_id,
        file_path,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    );
  }
  return insertStmt;
};

export type MemeRecordInput = {
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath?: string;
};

export const memeRepository = {
  hasHash(hash: string): boolean {
    return Boolean(getSelectByHashStmt().get(hash));
  },

  save(record: MemeRecordInput): void {
    try {
      getInsertStmt().run(
        record.hash,
        record.sourceChannelId,
        record.sourceMessageId,
        record.targetMessageId,
        record.filePath || null,
        new Date().toISOString(),
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        logger.debug({ hash: record.hash }, "Хеш уже существует, пропуск вставки");
        return;
      }

      throw error;
    }
  },
};
