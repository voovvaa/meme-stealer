/**
 * Data transformation utilities for converting database rows to typed objects
 */

import type {
  Config,
  ConfigRow,
  SourceChannel,
  SourceChannelRow,
  FilterKeyword,
  FilterKeywordRow,
  Post,
  MemeRow,
  QueueItem,
  QueueItemRow,
} from "../types/index.js";

/**
 * Transform database row to Config object
 */
export const rowToConfig = (row: ConfigRow): Config => ({
  id: 1,
  apiId: row.api_id,
  apiHash: row.api_hash,
  phoneNumber: row.phone_number,
  telegramPassword: row.telegram_password,
  targetChannelId: row.target_channel_id,
  enableQueue: row.enable_queue === 1,
  publishIntervalMin: row.publish_interval_min,
  publishIntervalMax: row.publish_interval_max,
  needsReload: row.needs_reload === 1,
  updatedAt: row.updated_at,
});

/**
 * Transform database row to SourceChannel object
 */
export const rowToSourceChannel = (row: SourceChannelRow): SourceChannel => ({
  id: row.id,
  channelId: row.channel_id,
  channelName: row.channel_name,
  enabled: row.enabled === 1,
  archived: row.archived === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Transform database row to FilterKeyword object
 */
export const rowToFilterKeyword = (row: FilterKeywordRow): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: row.enabled === 1,
  archived: row.archived === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Transform database row to Post object
 */
export const rowToPost = (row: MemeRow): Post => ({
  id: row.id,
  hash: row.hash,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  targetMessageId: row.target_message_id,
  filePath: row.file_path,
  createdAt: row.created_at,
});

/**
 * Transform database row to QueueItem object
 */
export const rowToQueueItem = (row: QueueItemRow): QueueItem => ({
  id: row.id,
  sourceChannelId: row.source_channel_id,
  sourceMessageId: row.source_message_id,
  status: row.status,
  scheduledAt: row.scheduled_at,
  createdAt: row.created_at,
  processedAt: row.processed_at,
  errorMessage: row.error_message,
});
