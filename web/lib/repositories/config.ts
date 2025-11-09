import { getDb } from "../db";
import type { Config, ConfigInput } from "@bot-types/database";
import type { ConfigRow } from "./types";
import { setNeedsReload, getCurrentTimestamp } from "./helpers";

const rowToConfig = (row: ConfigRow): Config => ({
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
  getConfig(): Config | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM config WHERE id = 1").get();
    if (!row) return null;
    return rowToConfig(row as ConfigRow);
  },

  saveConfig(config: ConfigInput): void {
    const db = getDb();
    const now = getCurrentTimestamp();
    const existingConfig = this.getConfig();

    if (existingConfig) {
      db.prepare(
        `
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
      `,
      ).run(
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
      db.prepare(
        `
        INSERT INTO config (
          id, api_id, api_hash, phone_number, telegram_password,
          target_channel_id, enable_queue, publish_interval_min,
          publish_interval_max, needs_reload, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `,
      ).run(
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
  },
};
