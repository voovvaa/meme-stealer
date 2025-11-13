/**
 * Database row types for better-sqlite3 query results
 */

export type ConfigRow = {
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
};

export type SourceChannelRow = {
  id: number;
  channel_id: string;
  channel_name: string | null;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type FilterKeywordRow = {
  id: number;
  keyword: string;
  is_regex: number;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};

export type PostRow = {
  id: number;
  hash: string;
  source_channel_id: string;
  source_message_id: number;
  target_message_id: number | null;
  file_path: string | null;
  created_at: string;
};

export type QueueItemRow = {
  id: number;
  source_channel_id: string;
  source_message_id: number;
  status: string;
  scheduled_at: string;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
};
