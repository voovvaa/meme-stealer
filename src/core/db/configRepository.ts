import { getDatabase } from "./database.js";
import { logger } from "../logger.js";

const db = getDatabase();

// Типы
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

// Prepared statements для config
const getConfigStmt = db.prepare("SELECT * FROM config WHERE id = 1");
const updateConfigStmt = db.prepare(`
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
`);

const insertConfigStmt = db.prepare(`
  INSERT INTO config (
    id, api_id, api_hash, phone_number, telegram_password,
    target_channel_id, enable_queue, publish_interval_min,
    publish_interval_max, needs_reload, updated_at
  ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`);

const setNeedsReloadStmt = db.prepare(`
  UPDATE config SET needs_reload = 1 WHERE id = 1
`);

const clearNeedsReloadStmt = db.prepare(`
  UPDATE config SET needs_reload = 0 WHERE id = 1
`);

// Prepared statements для source_channels
const getAllSourceChannelsStmt = db.prepare(`
  SELECT * FROM source_channels ORDER BY created_at DESC
`);

const getEnabledSourceChannelsStmt = db.prepare(`
  SELECT * FROM source_channels WHERE enabled = 1 ORDER BY created_at DESC
`);

const insertSourceChannelStmt = db.prepare(`
  INSERT INTO source_channels (channel_id, channel_name, enabled, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`);

const updateSourceChannelStmt = db.prepare(`
  UPDATE source_channels SET channel_name = ?, enabled = ?, updated_at = ?
  WHERE id = ?
`);

const deleteSourceChannelStmt = db.prepare(`
  DELETE FROM source_channels WHERE id = ?
`);

// Prepared statements для filter_keywords
const getAllFilterKeywordsStmt = db.prepare(`
  SELECT * FROM filter_keywords ORDER BY created_at DESC
`);

const getEnabledFilterKeywordsStmt = db.prepare(`
  SELECT * FROM filter_keywords WHERE enabled = 1 ORDER BY created_at DESC
`);

const insertFilterKeywordStmt = db.prepare(`
  INSERT INTO filter_keywords (keyword, enabled, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`);

const updateFilterKeywordStmt = db.prepare(`
  UPDATE filter_keywords SET keyword = ?, enabled = ?, updated_at = ?
  WHERE id = ?
`);

const deleteFilterKeywordStmt = db.prepare(`
  DELETE FROM filter_keywords WHERE id = ?
`);

// Helper функции для преобразования данных
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

type SourceChannelRow = {
  id: number;
  channel_id: string;
  channel_name: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
};

type FilterKeywordRow = {
  id: number;
  keyword: string;
  enabled: number;
  created_at: string;
  updated_at: string;
};

const rowToSourceChannel = (row: SourceChannelRow): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToFilterKeyword = (row: FilterKeywordRow): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const configRepository = {
  // Config operations
  getConfig(): Config | null {
    const row = getConfigStmt.get();
    if (!row) return null;
    return rowToConfig(
      row as {
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
      },
    );
  },

  saveConfig(config: ConfigInput): void {
    const now = new Date().toISOString();
    const existingConfig = this.getConfig();

    if (existingConfig) {
      updateConfigStmt.run(
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now,
      );
    } else {
      insertConfigStmt.run(
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now,
      );
    }

    setNeedsReloadStmt.run();
    logger.info("Конфигурация обновлена, установлен флаг needs_reload");
  },

  setNeedsReload(): void {
    setNeedsReloadStmt.run();
  },

  clearNeedsReload(): void {
    clearNeedsReloadStmt.run();
  },

  // Source channels operations
  getAllSourceChannels(): SourceChannel[] {
    const rows = getAllSourceChannelsStmt.all() as SourceChannelRow[];
    return rows.map((row) => rowToSourceChannel(row));
  },

  getEnabledSourceChannels(): SourceChannel[] {
    const rows = getEnabledSourceChannelsStmt.all() as SourceChannelRow[];
    return rows.map((row) => rowToSourceChannel(row));
  },

  addSourceChannel(input: SourceChannelInput): void {
    const now = new Date().toISOString();
    try {
      insertSourceChannelStmt.run(
        input.channelId,
        input.channelName ?? null,
        input.enabled !== false ? 1 : 0,
        now,
        now,
      );
      setNeedsReloadStmt.run();
      logger.info({ channelId: input.channelId }, "Добавлен канал-источник");
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        logger.warn({ channelId: input.channelId }, "Канал уже существует");
        throw new Error("Канал с таким ID уже существует");
      }
      throw error;
    }
  },

  updateSourceChannel(id: number, input: Partial<SourceChannelInput>): void {
    const now = new Date().toISOString();
    const channel = this.getAllSourceChannels().find((c) => c.id === id);
    if (!channel) {
      throw new Error("Канал не найден");
    }

    updateSourceChannelStmt.run(
      input.channelName !== undefined ? input.channelName : channel.channelName,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (channel.enabled ? 1 : 0),
      now,
      id,
    );
    setNeedsReloadStmt.run();
    logger.info({ id, channelId: channel.channelId }, "Канал-источник обновлен");
  },

  deleteSourceChannel(id: number): void {
    deleteSourceChannelStmt.run(id);
    setNeedsReloadStmt.run();
    logger.info({ id }, "Канал-источник удален");
  },

  // Filter keywords operations
  getAllFilterKeywords(): FilterKeyword[] {
    const rows = getAllFilterKeywordsStmt.all() as FilterKeywordRow[];
    return rows.map((row) => rowToFilterKeyword(row));
  },

  getEnabledFilterKeywords(): FilterKeyword[] {
    const rows = getEnabledFilterKeywordsStmt.all() as FilterKeywordRow[];
    return rows.map((row) => rowToFilterKeyword(row));
  },

  addFilterKeyword(input: FilterKeywordInput): void {
    const now = new Date().toISOString();
    try {
      insertFilterKeywordStmt.run(input.keyword, input.enabled !== false ? 1 : 0, now, now);
      setNeedsReloadStmt.run();
      logger.info({ keyword: input.keyword }, "Добавлено ключевое слово");
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        logger.warn({ keyword: input.keyword }, "Ключевое слово уже существует");
        throw new Error("Ключевое слово уже существует");
      }
      throw error;
    }
  },

  updateFilterKeyword(id: number, input: Partial<FilterKeywordInput>): void {
    const now = new Date().toISOString();
    const keyword = this.getAllFilterKeywords().find((k) => k.id === id);
    if (!keyword) {
      throw new Error("Ключевое слово не найдено");
    }

    updateFilterKeywordStmt.run(
      input.keyword !== undefined ? input.keyword : keyword.keyword,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (keyword.enabled ? 1 : 0),
      now,
      id,
    );
    setNeedsReloadStmt.run();
    logger.info({ id, keyword: keyword.keyword }, "Ключевое слово обновлено");
  },

  deleteFilterKeyword(id: number): void {
    deleteFilterKeywordStmt.run(id);
    setNeedsReloadStmt.run();
    logger.info({ id }, "Ключевое слово удалено");
  },
};
