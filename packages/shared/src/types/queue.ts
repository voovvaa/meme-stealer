/**
 * Post queue types
 */

export type QueueItem = {
  id: number;
  sourceChannelId: string;
  sourceMessageId: number;
  status: string;
  scheduledAt: string;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
};

export type QueueItemInput = {
  sourceChannelId: string;
  sourceMessageId: number;
  status: string;
  scheduledAt: string;
};

export type QueueStats = {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
};

/**
 * Raw database row type for queue items
 */
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
