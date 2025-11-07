/**
 * Types for web interface
 * Re-exports from shared package for backward compatibility
 */

export type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  Post,
  MemeStats,
  QueueItem,
  ChannelStat,
  TimelineStat,
} from "@meme-stealer/shared";

// Web-specific interface for archivable entities
export interface ArchivableEntity {
  id: number;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
