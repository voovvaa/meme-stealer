/**
 * Meme/Post types
 */

export type Post = {
  id: number;
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath: string | null;
  createdAt: string;
};

export type MemeInput = {
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath: string | null;
};

export type MemeStats = {
  total: number;
  totalPublished: number;
  pending: number;
};

/**
 * Channel statistics type
 */
export type ChannelStat = {
  channelId: string;
  channelName: string | null;
  count: number;
};

/**
 * Timeline statistics type
 */
export type TimelineStat = {
  date: string;
  count: number;
};

/**
 * Raw database row type for memes
 */
export type MemeRow = {
  id: number;
  hash: string;
  source_channel_id: string;
  source_message_id: number;
  target_message_id: number | null;
  file_path: string | null;
  created_at: string;
};
