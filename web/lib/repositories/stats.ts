import { getDb } from "../db";
import type { Post, MemeStats, QueueStatus } from "@bot-types/database";
import type { PostRow, QueueItemRow } from "./types";

const rowToPost = (row: PostRow): Post => ({
  id: row.id,
  hash: row.hash,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  targetMessageId: row.target_message_id,
  filePath: row.file_path,
  createdAt: row.created_at,
});

// Web-версия QueueItem (без mediaData, т.к. web только показывает данные)
export type QueueItem = {
  id: number;
  sourceChannelId: string;
  sourceMessageId: number;
  status: QueueStatus;
  scheduledAt: string;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
};

const rowToQueueItem = (row: QueueItemRow): QueueItem => ({
  id: row.id,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  status: row.status as QueueStatus,
  scheduledAt: row.scheduled_at,
  createdAt: row.created_at,
  processedAt: row.processed_at,
  errorMessage: row.error_message,
});

export const statsRepository = {
  getMemeStats(): MemeStats {
    const db = getDb();
    const totalRow = db.prepare("SELECT COUNT(*) as count FROM memes").get() as {
      count: number;
    };
    const publishedRow = db
      .prepare("SELECT COUNT(*) as count FROM memes WHERE target_message_id IS NOT NULL")
      .get() as { count: number };
    const pendingRow = db
      .prepare("SELECT COUNT(*) as count FROM post_queue WHERE status = 'pending'")
      .get() as { count: number };

    return {
      total: totalRow.count,
      totalPublished: publishedRow.count,
      pending: pendingRow.count,
    };
  },

  getPosts(limit: number = 50, offset: number = 0, publishedOnly: boolean = false): Post[] {
    const db = getDb();
    const whereClause = publishedOnly
      ? "WHERE file_path IS NOT NULL AND target_message_id IS NOT NULL"
      : "";
    const rows = db
      .prepare(`SELECT * FROM memes ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(limit, offset);
    return rows.map((row) => rowToPost(row as PostRow));
  },

  getPostsCount(publishedOnly: boolean = false): number {
    const db = getDb();
    const whereClause = publishedOnly
      ? "WHERE file_path IS NOT NULL AND target_message_id IS NOT NULL"
      : "";
    const row = db.prepare(`SELECT COUNT(*) as count FROM memes ${whereClause}`).get() as {
      count: number;
    };
    return row.count;
  },

  getChannelStats(): Array<{ channelId: string; channelName: string | null; count: number }> {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          m.source_channel_id as channelId,
          sc.channel_name as channelName,
          COUNT(*) as count
        FROM memes m
        LEFT JOIN source_channels sc ON m.source_channel_id = sc.channel_id
        WHERE sc.enabled = 1 AND sc.archived = 0
        GROUP BY m.source_channel_id
        ORDER BY count DESC
        LIMIT 10
      `,
      )
      .all() as Array<{ channelId: string; channelName: string | null; count: number }>;
    return rows;
  },

  getTimelineStats(days: number = 30): Array<{ date: string; count: number }> {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM memes
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      )
      .all(days) as Array<{ date: string; count: number }>;
    return rows;
  },

  getQueuedPosts(limit: number = 50, offset: number = 0): QueueItem[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          id,
          source_channel_id,
          source_message_id,
          status,
          scheduled_at,
          created_at,
          processed_at,
          error_message
        FROM post_queue
        WHERE status = 'pending'
        ORDER BY scheduled_at ASC
        LIMIT ? OFFSET ?
      `,
      )
      .all(limit, offset);
    return rows.map((row) => rowToQueueItem(row as QueueItemRow));
  },

  getQueuedPostsCount(): number {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) as count FROM post_queue WHERE status = 'pending'")
      .get() as { count: number };
    return row.count;
  },
};
