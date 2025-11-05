/**
 * Репозитории для работы с БД из веб-интерфейса
 * Дублируют логику из bot/src/core/db/, но без зависимостей от логгера
 */

import { getDb } from "./db";

// ===== Типы =====

export type Config = {
  id: 1;
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  telegramPassword: string | null;
  targetChannelId: string;
  enableQueue: boolean;
  publishIntervalMin: number;
  publishIntervalMax: number;
  needsReload: boolean;
  updatedAt: string;
};

export type ConfigInput = Omit<Config, "id" | "needsReload" | "updatedAt">;

export type SourceChannel = {
  id: number;
  channelId: string;
  channelName: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SourceChannelInput = {
  channelId: string;
  channelName?: string;
  enabled?: boolean;
};

export type FilterKeyword = {
  id: number;
  keyword: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FilterKeywordInput = {
  keyword: string;
  enabled?: boolean;
};

export type MemeStats = {
  total: number;
  totalPublished: number;
  pending: number;
};

export type Post = {
  id: number;
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  createdAt: string;
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
  created_at: string;
  updated_at: string;
}): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToFilterKeyword = (row: {
  id: number;
  keyword: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToPost = (row: {
  id: number;
  hash: string;
  source_channel_id: string;
  source_message_id: number;
  target_message_id: number | null;
  created_at: string;
}): Post => ({
  id: row.id,
  hash: row.hash,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  targetMessageId: row.target_message_id,
  createdAt: row.created_at,
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
};
