import { getDatabase } from "./database.js";
import { logger } from "../logger.js";

const db = getDatabase();

const selectByHashStmt = db.prepare("SELECT 1 FROM memes WHERE hash = ? LIMIT 1");
const insertStmt = db.prepare(
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

export type MemeRecordInput = {
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath?: string;
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
