import type Database from "better-sqlite3";

import { CONFIG } from "../constants/index.js";
import type { SourceChannel, SourceChannelInput, SourceChannelRow } from "../types/index.js";
import { rowToSourceChannel } from "../utils/index.js";

/**
 * Source channels repository
 */
export class ChannelRepository {
  private getAllStmt: ReturnType<Database.Database["prepare"]>;
  private getEnabledStmt: ReturnType<Database.Database["prepare"]>;
  private insertStmt: ReturnType<Database.Database["prepare"]>;
  private updateStmt: ReturnType<Database.Database["prepare"]>;
  private archiveStmt: ReturnType<Database.Database["prepare"]>;
  private unarchiveStmt: ReturnType<Database.Database["prepare"]>;
  private deleteStmt: ReturnType<Database.Database["prepare"]>;
  private setNeedsReloadStmt: ReturnType<Database.Database["prepare"]>;

  constructor(db: ReturnType<typeof Database>) {
    this.getAllStmt = db.prepare(`
      SELECT * FROM source_channels ORDER BY created_at DESC
    `);

    this.getEnabledStmt = db.prepare(`
      SELECT * FROM source_channels
      WHERE enabled = 1 AND archived = 0
      ORDER BY created_at DESC
    `);

    this.insertStmt = db.prepare(`
      INSERT INTO source_channels (channel_id, channel_name, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.updateStmt = db.prepare(`
      UPDATE source_channels
      SET channel_name = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `);

    this.archiveStmt = db.prepare(`
      UPDATE source_channels
      SET archived = 1, updated_at = ?
      WHERE id = ?
    `);

    this.unarchiveStmt = db.prepare(`
      UPDATE source_channels
      SET archived = 0, updated_at = ?
      WHERE id = ?
    `);

    this.deleteStmt = db.prepare(`
      DELETE FROM source_channels WHERE id = ?
    `);

    this.setNeedsReloadStmt = db.prepare(CONFIG.NEEDS_RELOAD_QUERY);
  }

  /**
   * Get all channels (including archived)
   */
  getAll(): SourceChannel[] {
    const rows = this.getAllStmt.all([]) as SourceChannelRow[];
    return rows.map(rowToSourceChannel);
  }

  /**
   * Get only enabled and non-archived channels
   */
  getEnabled(): SourceChannel[] {
    const rows = this.getEnabledStmt.all([]) as SourceChannelRow[];
    return rows.map(rowToSourceChannel);
  }

  /**
   * Add new channel
   */
  add(input: SourceChannelInput): void {
    const now = new Date().toISOString();
    this.insertStmt.run([input.channelId,
      input.channelName ?? null,
      input.enabled !== false ? 1 : 0,
      now,
      now]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Update channel
   */
  update(id: number, input: Partial<SourceChannelInput>): void {
    const now = new Date().toISOString();
    const channel = this.getAll().find((c) => c.id === id);

    if (!channel) {
      throw new Error("Channel not found");
    }

    this.updateStmt.run([
      input.channelName !== undefined ? input.channelName : channel.channelName,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (channel.enabled ? 1 : 0),
      now,
      id
    ]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Archive channel (soft delete)
   */
  archive(id: number): void {
    const now = new Date().toISOString();
    this.archiveStmt.run([now, id]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Unarchive channel
   */
  unarchive(id: number): void {
    const now = new Date().toISOString();
    this.unarchiveStmt.run([now, id]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Delete channel permanently
   */
  delete(id: number): void {
    this.deleteStmt.run([id]);
    this.setNeedsReloadStmt.run([]);
  }
}
