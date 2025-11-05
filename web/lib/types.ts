/**
 * Общие типы для веб-интерфейса
 */

// Базовый тип для архивируемых сущностей
export interface ArchivableEntity {
  id: number;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типы для конфигурации
export interface Config {
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
}

export type ConfigInput = Omit<Config, "id" | "needsReload" | "updatedAt">;

// Типы для каналов
export interface SourceChannel extends ArchivableEntity {
  channelId: string;
  channelName: string | null;
}

export type SourceChannelInput = {
  channelId: string;
  channelName?: string;
  enabled?: boolean;
};

// Типы для ключевых слов
export interface FilterKeyword extends ArchivableEntity {
  keyword: string;
}

export type FilterKeywordInput = {
  keyword: string;
  enabled?: boolean;
};

// Типы для статистики
export interface MemeStats {
  total: number;
  totalPublished: number;
  pending: number;
}

// Типы для постов
export interface Post {
  id: number;
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  filePath: string | null;
  createdAt: string;
}

// Типы для графиков
export interface ChannelStat {
  channelId: string;
  channelName: string | null;
  count: number;
}

export interface TimelineStat {
  date: string;
  count: number;
}
