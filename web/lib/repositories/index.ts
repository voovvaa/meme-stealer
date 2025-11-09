/**
 * Репозитории для работы с БД из веб-интерфейса
 * Использует типы из единого источника правды (src/types/database.ts)
 */

// Экспорт репозиториев
export { configRepository } from "./config";
export { sourceChannelsRepository } from "./channels";
export { filterKeywordsRepository } from "./keywords";
export { statsRepository } from "./stats";

// Экспорт типов из bot
export type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  Post,
  MemeStats,
  QueueStatus,
} from "@bot-types/database";

// Экспорт web-специфичных типов
export type { QueueItem } from "./stats";
