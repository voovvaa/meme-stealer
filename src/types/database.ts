/**
 * Единый источник правды для типов базы данных
 * Используется как в bot (src/), так и в web (web/)
 */

// ===== Config типы =====

export type Config = {
  id: 1;
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  telegramPassword: string | null;
  targetChannelId: string;
  enableQueue: boolean;
  publishIntervalMin: number;
  publishIntervalMax: number;
  needsReload: boolean;
  updatedAt: string;
};

export type ConfigInput = Omit<Config, "id" | "needsReload" | "updatedAt">;

// ===== Source Channels типы =====

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

// ===== Filter Keywords типы =====

export type FilterKeyword = {
  id: number;
  keyword: string;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FilterKeywordInput = {
  keyword: string;
  enabled?: boolean;
};

// ===== Post типы =====

export type Post = {
  id: number;
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath: string | null;
  createdAt: string;
};

// ===== Stats типы =====

export type MemeStats = {
  total: number;
  totalPublished: number;
  pending: number;
};

// ===== Queue Status =====

export type QueueStatus = "pending" | "processing" | "completed" | "failed";

// ===== Базовый интерфейс для архивируемых сущностей =====

export interface ArchivableEntity {
  id: number;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
