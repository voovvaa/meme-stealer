import type Database from "better-sqlite3";

import { CONFIG } from "../constants/index.js";
import type { Config, ConfigInput, ConfigRow } from "../types/index.js";
import { rowToConfig } from "../utils/index.js";

/**
 * Configuration repository
 */
export class ConfigRepository {
  private getConfigStmt: ReturnType<Database.Database["prepare"]>;
  private updateConfigStmt: ReturnType<Database.Database["prepare"]>;
  private insertConfigStmt: ReturnType<Database.Database["prepare"]>;
  private setNeedsReloadStmt: ReturnType<Database.Database["prepare"]>;
  private clearNeedsReloadStmt: ReturnType<Database.Database["prepare"]>;

  constructor(db: ReturnType<typeof Database>) {
    this.getConfigStmt = db.prepare("SELECT * FROM config WHERE id = 1");

    this.updateConfigStmt = db.prepare(`
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

    this.insertConfigStmt = db.prepare(`
      INSERT INTO config (
        id, api_id, api_hash, phone_number, telegram_password,
        target_channel_id, enable_queue, publish_interval_min,
        publish_interval_max, needs_reload, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    this.setNeedsReloadStmt = db.prepare(CONFIG.NEEDS_RELOAD_QUERY);
    this.clearNeedsReloadStmt = db.prepare(CONFIG.CLEAR_RELOAD_QUERY);
  }

  /**
   * Get configuration
   */
  getConfig(): Config | null {
    const row = this.getConfigStmt.get([]) as ConfigRow | undefined;
    if (!row) return null;
    return rowToConfig(row);
  }

  /**
   * Save configuration (insert or update)
   */
  saveConfig(config: ConfigInput): void {
    const now = new Date().toISOString();
    const existingConfig = this.getConfig();

    if (existingConfig) {
      this.updateConfigStmt.run([
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now,
      ]);
    } else {
      this.insertConfigStmt.run([
        config.apiId,
        config.apiHash,
        config.phoneNumber,
        config.telegramPassword,
        config.targetChannelId,
        config.enableQueue ? 1 : 0,
        config.publishIntervalMin,
        config.publishIntervalMax,
        now,
      ]);
    }
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Set needs reload flag
   */
  setNeedsReload(): void {
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Clear needs reload flag
   */
  clearNeedsReload(): void {
    this.clearNeedsReloadStmt.run([]);
  }
}
