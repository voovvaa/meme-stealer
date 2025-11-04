import Database from "better-sqlite3";

import { ensureDirectoryForFile } from "../../utils/helpers.js";
import { env } from "../config/env.js";
import { logger } from "../logger.js";

ensureDirectoryForFile(env.memeDbPath);

const db = new Database(env.memeDbPath, {
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
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_memes_hash ON memes(hash);
  CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at);
  CREATE INDEX IF NOT EXISTS idx_memes_source_channel ON memes(source_channel_id);
`);

const selectByHashStmt = db.prepare("SELECT 1 FROM memes WHERE hash = ? LIMIT 1");
const insertStmt = db.prepare(
  `
    INSERT INTO memes (
      hash,
      source_channel_id,
      source_message_id,
      target_message_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `,
);

export type MemeRecordInput = {
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
};

export const memeRepository = {
  hasHash(hash: string): boolean {
    return Boolean(selectByHashStmt.get(hash));
  },

  save(record: MemeRecordInput): void {
    try {
      insertStmt.run(
        record.hash,
        record.sourceChannelId,
        record.sourceMessageId,
        record.targetMessageId,
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
