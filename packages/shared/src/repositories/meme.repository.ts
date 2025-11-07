import type Database from "better-sqlite3";

import type { MemeInput, MemeRow, Post } from "../types/index.js";
import { rowToPost } from "../utils/index.js";

/**
 * Meme/Post repository
 */
export class MemeRepository {
  private hasHashStmt: ReturnType<Database.Database["prepare"]>;
  private insertStmt: ReturnType<Database.Database["prepare"]>;
  private getAllStmt: ReturnType<Database.Database["prepare"]>;
  private getByHashStmt: ReturnType<Database.Database["prepare"]>;

  constructor(private db: ReturnType<typeof Database>) {
    this.hasHashStmt = db.prepare("SELECT 1 FROM memes WHERE hash = ? LIMIT 1");

    this.insertStmt = db.prepare(`
      INSERT INTO memes (
        hash,
        source_channel_id,
        source_message_id,
        target_message_id,
        file_path,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    this.getAllStmt = db.prepare(`
      SELECT * FROM memes ORDER BY created_at DESC LIMIT ? OFFSET ?
    `);

    this.getByHashStmt = db.prepare(`
      SELECT * FROM memes WHERE hash = ? LIMIT 1
    `);
  }

  /**
   * Check if hash exists
   */
  hasHash(hash: string): boolean {
    return Boolean(this.hasHashStmt.get(hash));
  }

  /**
   * Save meme record
   */
  save(record: MemeInput): void {
    try {
      this.insertStmt.run([
        record.hash,
        record.sourceChannelId,
        record.sourceMessageId,
        record.targetMessageId,
        record.filePath || null,
        new Date().toISOString()
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        // Hash already exists, skip
        return;
      }
      throw error;
    }
  }

  /**
   * Get all posts with pagination
   */
  getAll(limit: number = 50, offset: number = 0): Post[] {
    const rows = this.getAllStmt.all([limit, offset]) as MemeRow[];
    return rows.map(rowToPost);
  }

  /**
   * Get post by hash
   */
  getByHash(hash: string): Post | null {
    const row = this.getByHashStmt.get(hash) as MemeRow | undefined;
    return row ? rowToPost(row) : null;
  }

  /**
   * Get total count
   */
  getCount(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM memes")
      .get() as { count: number };
    return row.count;
  }

  /**
   * Get published count
   */
  getPublishedCount(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM memes WHERE target_message_id IS NOT NULL")
      .get() as { count: number };
    return row.count;
  }
}
