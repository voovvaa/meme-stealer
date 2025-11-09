import { getDb } from "../db";
import type { SourceChannel, SourceChannelInput } from "@bot-types/database";
import type { SourceChannelRow } from "./types";

const rowToSourceChannel = (row: SourceChannelRow): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const sourceChannelsRepository = {
  getAll(): SourceChannel[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM source_channels ORDER BY created_at DESC").all();
    return rows.map((row) => rowToSourceChannel(row as SourceChannelRow));
  },

  add(input: SourceChannelInput): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO source_channels (channel_id, channel_name, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(input.channelId, input.channelName ?? null, input.enabled !== false ? 1 : 0, now, now);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  update(id: number, input: Partial<SourceChannelInput>): void {
    const db = getDb();
    const now = new Date().toISOString();
    const channel = this.getAll().find((c) => c.id === id);
    if (!channel) throw new Error("Канал не найден");

    db.prepare(
      `
      UPDATE source_channels SET channel_name = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(
      input.channelName !== undefined ? input.channelName : channel.channelName,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : channel.enabled ? 1 : 0,
      now,
      id,
    );
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  archive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      UPDATE source_channels SET archived = 1, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  unarchive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      UPDATE source_channels SET archived = 0, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare("DELETE FROM source_channels WHERE id = ?").run(id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },
};
