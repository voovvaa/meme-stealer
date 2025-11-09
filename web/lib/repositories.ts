/**
 * Репозитории для работы с БД из веб-интерфейса
 * Использует типы из единого источника правды (src/types/database.ts)
 */

import { getDb } from "./db";
import type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  Post,
  MemeStats,
  QueueStatus,
} from "@bot-types/database";

// Re-export типов для обратной совместимости
export type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  Post,
  MemeStats,
  QueueStatus,
};

// ===== Helper функции =====

const rowToConfig = (row: {
  id: number;
  api_id: number;
  api_hash: string;
  phone_number: string;
  telegram_password: string | null;
  target_channel_id: string;
  enable_queue: number;
  publish_interval_min: number;
  publish_interval_max: number;
  needs_reload: number;
  updated_at: string;
}): Config => ({
  id: 1,
  apiId: row.api_id,
  apiHash: row.api_hash,
  phoneNumber: row.phone_number,
  telegramPassword: row.telegram_password,
  targetChannelId: row.target_channel_id,
  enableQueue: Boolean(row.enable_queue),
  publishIntervalMin: row.publish_interval_min,
  publishIntervalMax: row.publish_interval_max,
  needsReload: Boolean(row.needs_reload),
  updatedAt: row.updated_at,
});

const rowToSourceChannel = (row: {
  id: number;
  channel_id: string;
  channel_name: string | null;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
}): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToFilterKeyword = (row: {
  id: number;
  keyword: string;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
}): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToPost = (row: {
  id: number;
  hash: string;
  source_channel_id: string;
  source_message_id: number;
  target_message_id: number | null;
  file_path: string | null;
  created_at: string;
}): Post => ({
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

const rowToQueueItem = (row: {
  id: number;
  source_channel_id: string;
  source_message_id: number;
  status: string;
  scheduled_at: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}): QueueItem => ({
  id: row.id,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  status: row.status as QueueStatus,
  scheduledAt: row.scheduled_at,
  createdAt: row.created_at,
  processedAt: row.processed_at,
  errorMessage: row.error_message,
});

// ===== Config Repository =====

export const configRepository = {
  getConfig(): Config | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM config WHERE id = 1").get();
    if (!row) return null;
    return rowToConfig(row as any);
  },

  saveConfig(config: ConfigInput): void {
    const db = getDb();
    const now = new Date().toISOString();
    const existingConfig = this.getConfig();

    if (existingConfig) {
      db.prepare(`
        UPDATE config SET
          api_id = ?,
          api_hash = ?,
          phone_number = ?,
          telegram_password = ?,
          target_channel_id = ?,
          enable_queue = ?,
          publish_interval_min = ?,
          publish_interval_max = ?,
          updated_at = ?
        WHERE id = 1
      `).run(
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now
      );
    } else {
      db.prepare(`
        INSERT INTO config (
          id, api_id, api_hash, phone_number, telegram_password,
          target_channel_id, enable_queue, publish_interval_min,
          publish_interval_max, needs_reload, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now
      );
    }

    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },
};

// ===== Source Channels Repository =====

export const sourceChannelsRepository = {
  getAll(): SourceChannel[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM source_channels ORDER BY created_at DESC")
      .all();
    return rows.map((row) => rowToSourceChannel(row as any));
  },

  add(input: SourceChannelInput): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO source_channels (channel_id, channel_name, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      input.channelId,
      input.channelName ?? null,
      input.enabled !== false ? 1 : 0,
      now,
      now
    );
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  update(id: number, input: Partial<SourceChannelInput>): void {
    const db = getDb();
    const now = new Date().toISOString();
    const channel = this.getAll().find((c) => c.id === id);
    if (!channel) throw new Error("Канал не найден");

    db.prepare(`
      UPDATE source_channels SET channel_name = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.channelName !== undefined ? input.channelName : channel.channelName,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (channel.enabled ? 1 : 0),
      now,
      id
    );
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  archive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE source_channels SET archived = 1, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  unarchive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE source_channels SET archived = 0, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare("DELETE FROM source_channels WHERE id = ?").run(id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },
};

// ===== Filter Keywords Repository =====

export const filterKeywordsRepository = {
  getAll(): FilterKeyword[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM filter_keywords ORDER BY created_at DESC")
      .all();
    return rows.map((row) => rowToFilterKeyword(row as any));
  },

  add(input: FilterKeywordInput): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO filter_keywords (keyword, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(input.keyword, input.enabled !== false ? 1 : 0, now, now);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  update(id: number, input: Partial<FilterKeywordInput>): void {
    const db = getDb();
    const now = new Date().toISOString();
    const keyword = this.getAll().find((k) => k.id === id);
    if (!keyword) throw new Error("Ключевое слово не найдено");

    db.prepare(`
      UPDATE filter_keywords SET keyword = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.keyword !== undefined ? input.keyword : keyword.keyword,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (keyword.enabled ? 1 : 0),
      now,
      id
    );
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  archive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE filter_keywords SET archived = 1, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  unarchive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE filter_keywords SET archived = 0, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare("DELETE FROM filter_keywords WHERE id = ?").run(id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },
};

// ===== Stats Repository =====

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

  getPosts(limit: number = 50, offset: number = 0): Post[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM memes ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(limit, offset);
    return rows.map((row) => rowToPost(row as any));
  },

  getPostsCount(): number {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM memes").get() as {
      count: number;
    };
    return row.count;
  },

  getChannelStats(): Array<{ channelId: string; channelName: string | null; count: number }> {
    const db = getDb();
    const rows = db
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
      .all() as Array<{ channelId: string; channelName: string | null; count: number }>;
    return rows;
  },

  getTimelineStats(days: number = 30): Array<{ date: string; count: number }> {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM memes
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all(days) as Array<{ date: string; count: number }>;
    return rows;
  },

  getQueuedPosts(limit: number = 50, offset: number = 0): QueueItem[] {
    const db = getDb();
    const rows = db
      .prepare(`
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
      `)
      .all(limit, offset);
    return rows.map((row) => rowToQueueItem(row as any));
  },

  getQueuedPostsCount(): number {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) as count FROM post_queue WHERE status = 'pending'")
      .get() as { count: number };
    return row.count;
  },
};
