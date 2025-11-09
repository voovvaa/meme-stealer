import { getDatabase } from "./database.js";
import type { SourceChannel, SourceChannelInput } from "../../types/database.js";
import { logger } from "../logger.js";
import { setNeedsReload, getCurrentTimestamp } from "./helpers.js";

const db = getDatabase();

// Prepared statements для source_channels
const getAllSourceChannelsStmt = db.prepare(`
  SELECT * FROM source_channels ORDER BY created_at DESC
`);

const getSourceChannelByIdStmt = db.prepare(`
  SELECT * FROM source_channels WHERE id = ?
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

// Helper types and functions
type SourceChannelRow = {
  id: number;
  channel_id: string;
  channel_name: string | null;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};

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
  getAllSourceChannels(): SourceChannel[] {
    const rows = getAllSourceChannelsStmt.all() as SourceChannelRow[];
    return rows.map((row) => rowToSourceChannel(row));
  },

  getSourceChannelById(id: number): SourceChannel | null {
    const row = getSourceChannelByIdStmt.get(id) as SourceChannelRow | undefined;
    return row ? rowToSourceChannel(row) : null;
  },

  getEnabledSourceChannels(): SourceChannel[] {
    const rows = getEnabledSourceChannelsStmt.all() as SourceChannelRow[];
    return rows.map((row) => rowToSourceChannel(row));
  },

  addSourceChannel(input: SourceChannelInput): void {
    const now = getCurrentTimestamp();
    try {
      insertSourceChannelStmt.run(
        input.channelId,
        input.channelName ?? null,
        input.enabled !== false ? 1 : 0,
        now,
        now,
      );
      setNeedsReload();
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
    const now = getCurrentTimestamp();
    // FIXED: Use getById instead of loading all channels (N+1 query fix)
    const channel = this.getSourceChannelById(id);
    if (!channel) {
      throw new Error("Канал не найден");
    }

    updateSourceChannelStmt.run(
      input.channelName !== undefined ? input.channelName : channel.channelName,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : channel.enabled ? 1 : 0,
      now,
      id,
    );
    setNeedsReload();
    logger.info({ id, channelId: channel.channelId }, "Канал-источник обновлен");
  },

  deleteSourceChannel(id: number): void {
    deleteSourceChannelStmt.run(id);
    setNeedsReload();
    logger.info({ id }, "Канал-источник удален");
  },
};
