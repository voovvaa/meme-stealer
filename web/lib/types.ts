/**
 * Типы специфичные для веб-интерфейса
 * Общие типы БД импортируются из @bot-types/database
 */

// Базовый тип для архивируемых сущностей импортирован из database.ts
export type { ArchivableEntity } from "@bot-types/database";

// Re-export основных типов БД для удобства (из repositories)
export type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  Post,
  MemeStats,
} from "./repositories";

// Типы для графиков и статистики (web-специфичные)
export interface ChannelStat {
  channelId: string;
  channelName: string | null;
  count: number;
}

export interface TimelineStat {
  date: string;
  count: number;
}
