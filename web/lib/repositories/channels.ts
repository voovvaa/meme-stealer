import type { SourceChannel, SourceChannelInput } from "@bot-types/database";
import type { SourceChannelRow } from "./types";
import { createArchivableRepository } from "./createArchivableRepository";

const rowToSourceChannel = (row: SourceChannelRow): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const sourceChannelsRepository = createArchivableRepository<
  SourceChannel,
  SourceChannelInput,
  SourceChannelRow
>({
  tableName: "source_channels",
  rowMapper: rowToSourceChannel,
  notFoundError: "Канал не найден",

  insertFields: "channel_id, channel_name, enabled, created_at, updated_at",
  insertPlaceholders: "?, ?, ?, ?, ?",
  buildInsertParams: (input, now) => [
    input.channelId,
    input.channelName ?? null,
    input.enabled !== false ? 1 : 0,
    now,
    now,
  ],

  updateFields: "channel_name = ?, enabled = ?, updated_at = ?",
  buildUpdateParams: (input, existing, now) => [
    input.channelName !== undefined ? input.channelName : existing.channelName,
    input.enabled !== undefined ? (input.enabled ? 1 : 0) : existing.enabled ? 1 : 0,
    now,
  ],
});
