import type Database from "better-sqlite3";

import { PAGINATION, TIMELINE } from "../constants/index.js";
import type { MemeStats } from "../types/index.js";

/**
 * Statistics repository
 */
export class StatsRepository {
  constructor(private db: ReturnType<typeof Database>) {}

  /**
   * Get meme statistics
   */
  getMemeStats(): MemeStats {
    const totalRow = this.db
      .prepare("SELECT COUNT(*) as count FROM memes")
      .get() as { count: number };

    const publishedRow = this.db
      .prepare("SELECT COUNT(*) as count FROM memes WHERE target_message_id IS NOT NULL")
      .get() as { count: number };

    const pendingRow = this.db
      .prepare("SELECT COUNT(*) as count FROM post_queue WHERE status = 'pending'")
      .get() as { count: number };

    return {
      total: totalRow.count,
      totalPublished: publishedRow.count,
      pending: pendingRow.count,
    };
  }

  /**
   * Get statistics by channel
   */
  getChannelStats(): Array<{
    channelId: string;
    channelName: string | null;
    count: number;
  }> {
    const rows = this.db
      .prepare(`
        SELECT
          m.source_channel_id as channelId,
          sc.channel_name as channelName,
          COUNT(*) as count
        FROM memes m
        LEFT JOIN source_channels sc ON m.source_channel_id = sc.channel_id
        GROUP BY m.source_channel_id
        ORDER BY count DESC
        LIMIT 10
      `)
      .all([]) as Array<{ channelId: string; channelName: string | null; count: number }>;

    return rows;
  }

  /**
   * Get timeline statistics
   */
  getTimelineStats(days: number = TIMELINE.DEFAULT_DAYS): Array<{
    date: string;
    count: number;
  }> {
    // Validate days
    const validDays = Math.min(Math.max(days, TIMELINE.MIN_DAYS), TIMELINE.MAX_DAYS);

    const rows = this.db
      .prepare(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM memes
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all(validDays) as Array<{ date: string; count: number }>;

    return rows;
  }

  /**
   * Get gallery posts (posts with file_path and target_message_id)
   */
  getGalleryPosts(
    limit: number = PAGINATION.DEFAULT_GALLERY_LIMIT,
    offset: number = 0
  ): Array<{
    id: number;
    hash: string;
    filePath: string;
    createdAt: string;
  }> {
    // Validate limit
    const validLimit = Math.min(
      Math.max(limit, PAGINATION.MIN_LIMIT),
      PAGINATION.MAX_LIMIT
    );

    const rows = this.db
      .prepare(`
        SELECT id, hash, file_path as filePath, created_at as createdAt
        FROM memes
        WHERE file_path IS NOT NULL AND target_message_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(validLimit, offset) as Array<{
      id: number;
      hash: string;
      filePath: string;
      createdAt: string;
    }>;

    return rows;
  }

  /**
   * Get gallery posts count
   */
  getGalleryPostsCount(): number {
    const row = this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM memes
        WHERE file_path IS NOT NULL AND target_message_id IS NOT NULL
      `)
      .get() as { count: number };

    return row.count;
  }
}
