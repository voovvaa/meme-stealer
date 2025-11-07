/**
 * Source channel types
 */

export type SourceChannel = {
  id: number;
  channelId: string;
  channelName: string | null;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SourceChannelInput = {
  channelId: string;
  channelName?: string;
  enabled?: boolean;
};

/**
 * Raw database row type for source channels
 */
export type SourceChannelRow = {
  id: number;
  channel_id: string;
  channel_name: string | null;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};
