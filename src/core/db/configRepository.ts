import { getDatabase } from "./database.js";
import type { Config, ConfigInput } from "../../types/database.js";
import { logger } from "../logger.js";
import { setNeedsReload, getCurrentTimestamp } from "./helpers.js";

// Re-export типов для обратной совместимости
export type { Config, ConfigInput };

const db = getDatabase();

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

const clearNeedsReloadStmt = db.prepare(`
  UPDATE config SET needs_reload = 0 WHERE id = 1
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
    const now = getCurrentTimestamp();
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

    setNeedsReload();
    logger.info("Конфигурация обновлена, установлен флаг needs_reload");
  },

  setNeedsReload(): void {
    setNeedsReload();
  },

  clearNeedsReload(): void {
    clearNeedsReloadStmt.run();
  },
};
