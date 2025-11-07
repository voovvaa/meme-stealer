import type { SourceChannel, FilterKeyword } from "@meme-stealer/shared";
import dotenvFlow from "dotenv-flow";
import { z } from "zod";

// Загружаем .env только в dev режиме (в Docker переменные передаются через docker-compose)
if (process.env.NODE_ENV !== "production") {
  dotenvFlow.config();
}

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

/**
 * Единая схема для валидации и трансформации переменных окружения
 * Используется только для LOG_LEVEL, SESSION_STORAGE_PATH, MEME_DB_PATH
 */
const EnvSchema = z.object({
  LOG_LEVEL: z.string().optional(),
  SESSION_STORAGE_PATH: z.string().optional(),
  MEME_DB_PATH: z.string().optional(),
});

/**
 * Тип конфигурации приложения
 */
export type AppConfig = {
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  telegramPassword: string | undefined;
  targetChannelId: string;
  sourceChannelIds: string[];
  adKeywords: string[];
  logLevel: (typeof logLevels)[number];
  sessionStoragePath: string;
  memeDbPath: string;
  enableQueue: boolean;
  publishIntervalMin: number;
  publishIntervalMax: number;
};

/**
 * Парсит системные переменные окружения (пути, лог-уровень)
 */
const parseSystemEnv = () => {
  try {
    const parsed = EnvSchema.parse(process.env);
    return {
      logLevel:
        parsed.LOG_LEVEL && logLevels.includes(parsed.LOG_LEVEL as (typeof logLevels)[number])
          ? (parsed.LOG_LEVEL as (typeof logLevels)[number])
          : ("info" as const),
      sessionStoragePath: parsed.SESSION_STORAGE_PATH ?? "./sessions/client.session",
      memeDbPath: parsed.MEME_DB_PATH ?? "./sessions/memes.sqlite",
    };
  } catch (error) {
    console.error("Системные переменные окружения не проходят валидацию:");
    console.error(error);
    process.exit(1);
  }
};

/**
 * Загружает конфигурацию из базы данных или .env (для обратной совместимости)
 */
export const loadConfig = async (): Promise<AppConfig> => {
  const systemEnv = parseSystemEnv();

  // Ленивый импорт для избежания циклических зависимостей
  const { configRepository, channelRepository, keywordRepository } = await import("../db/repositories.js");

  // Пробуем загрузить из БД
  const dbConfig = configRepository.getConfig();

  if (dbConfig) {
    // Конфигурация найдена в БД
    const sourceChannels = channelRepository.getEnabled();
    const filterKeywords = keywordRepository.getEnabled();

    return {
      apiId: dbConfig.apiId,
      apiHash: dbConfig.apiHash,
      phoneNumber: dbConfig.phoneNumber,
      telegramPassword: dbConfig.telegramPassword ?? undefined,
      targetChannelId: dbConfig.targetChannelId,
      sourceChannelIds: sourceChannels.map((ch: SourceChannel) => ch.channelId),
      adKeywords: filterKeywords.map((kw: FilterKeyword) => kw.keyword),
      enableQueue: dbConfig.enableQueue,
      publishIntervalMin: dbConfig.publishIntervalMin,
      publishIntervalMax: dbConfig.publishIntervalMax,
      ...systemEnv,
    };
  }

  // Конфигурация не найдена в БД - открыть веб-интерфейс для настройки
  console.error("❌ Конфигурация не найдена в базе данных");
  console.error("📝 Откройте веб-интерфейс (http://localhost:3333) и настройте бота в разделе Settings");
  process.exit(1);
};

// Глобальная конфигурация (инициализируется асинхронно)
let currentConfig: AppConfig | null = null;

/**
 * Инициализация конфигурации (вызывается один раз при старте)
 */
export const initConfig = async (): Promise<AppConfig> => {
  if (!currentConfig) {
    currentConfig = await loadConfig();
  }
  return currentConfig;
};

/**
 * Получить текущую конфигурацию
 */
export const getConfig = (): AppConfig => {
  if (!currentConfig) {
    throw new Error(
      "Конфигурация не инициализирована! Вызовите initConfig() перед использованием.",
    );
  }
  return currentConfig;
};

/**
 * Перезагрузить конфигурацию из БД
 */
export const reloadConfig = async (): Promise<AppConfig> => {
  currentConfig = await loadConfig();
  return currentConfig;
};

/**
 * Для обратной совместимости со старым кодом
 * @deprecated Используйте getConfig() вместо прямого доступа к env
 */
export const env = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!currentConfig) {
        throw new Error(
          "Конфигурация не инициализирована! Вызовите initConfig() перед использованием.",
        );
      }
      return currentConfig[prop as keyof AppConfig];
    },
  },
) as AppConfig;
