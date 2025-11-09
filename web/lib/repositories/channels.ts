import { getDb } from "../db";
import type { SourceChannel, SourceChannelInput } from "@bot-types/database";
import type { SourceChannelRow } from "./types";
import { setNeedsReload, getCurrentTimestamp } from "./helpers";

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

  getById(id: number): SourceChannel | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM source_channels WHERE id = ?").get(id);
    return row ? rowToSourceChannel(row as SourceChannelRow) : null;
  },

  add(input: SourceChannelInput): void {
    const db = getDb();
    const now = getCurrentTimestamp();
    db.prepare(
      `
      INSERT INTO source_channels (channel_id, channel_name, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(input.channelId, input.channelName ?? null, input.enabled !== false ? 1 : 0, now, now);
    setNeedsReload();
  },

  update(id: number, input: Partial<SourceChannelInput>): void {
    const db = getDb();
    const now = getCurrentTimestamp();
    const channel = this.getById(id);
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
    setNeedsReload();
  },

  archive(id: number): void {
    const db = getDb();
    const now = getCurrentTimestamp();
    db.prepare(
      `
      UPDATE source_channels SET archived = 1, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    setNeedsReload();
  },

  unarchive(id: number): void {
    const db = getDb();
    const now = getCurrentTimestamp();
    db.prepare(
      `
      UPDATE source_channels SET archived = 0, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    setNeedsReload();
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare("DELETE FROM source_channels WHERE id = ?").run(id);
    setNeedsReload();
  },
};
