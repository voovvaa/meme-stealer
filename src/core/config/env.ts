import dotenvFlow from "dotenv-flow";
import { z } from "zod";

dotenvFlow.config();

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

/**
 * Разбивает строку с разделителями-запятыми на массив
 */
const splitEnvList = (value?: string): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

/**
 * Единая схема для валидации и трансформации переменных окружения
 * Теперь используется только для LOG_LEVEL, SESSION_STORAGE_PATH, MEME_DB_PATH
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
export const loadConfig = (): AppConfig => {
  const systemEnv = parseSystemEnv();

  // Импортируем configRepository динамически после того, как MEME_DB_PATH установлен
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { configRepository } = require("../db/configRepository.js");

  const dbConfig = configRepository.getConfig();

  if (dbConfig) {
    // Конфигурация найдена в БД
    const sourceChannels = configRepository.getEnabledSourceChannels();
    const filterKeywords = configRepository.getEnabledFilterKeywords();

    return {
      apiId: dbConfig.apiId,
      apiHash: dbConfig.apiHash,
      phoneNumber: dbConfig.phoneNumber,
      telegramPassword: dbConfig.telegramPassword ?? undefined,
      targetChannelId: dbConfig.targetChannelId,
      sourceChannelIds: sourceChannels.map((ch) => ch.channelId),
      adKeywords: filterKeywords.map((kw) => kw.keyword),
      enableQueue: dbConfig.enableQueue,
      publishIntervalMin: dbConfig.publishIntervalMin,
      publishIntervalMax: dbConfig.publishIntervalMax,
      ...systemEnv,
    };
  }

  // Fallback на .env для обратной совместимости
  console.warn("⚠️  Конфигурация не найдена в БД, используется .env");
  console.warn("⚠️  Рекомендуется выполнить миграцию: npm run migrate-config");

  const API_ID = process.env.API_ID;
  const API_HASH = process.env.API_HASH;
  const PHONE_NUMBER = process.env.PHONE_NUMBER;
  const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
  const SOURCE_CHANNEL_IDS = process.env.SOURCE_CHANNEL_IDS;

  if (!API_ID || !API_HASH || !PHONE_NUMBER || !TARGET_CHANNEL_ID || !SOURCE_CHANNEL_IDS) {
    console.error("❌ Не все обязательные параметры заданы в .env");
    console.error("❌ Выполните миграцию: npm run migrate-config");
    process.exit(1);
  }

  return {
    apiId: Number(API_ID),
    apiHash: API_HASH,
    phoneNumber: PHONE_NUMBER,
    telegramPassword:
      process.env.TELEGRAM_PASSWORD && process.env.TELEGRAM_PASSWORD.length > 0
        ? process.env.TELEGRAM_PASSWORD
        : undefined,
    targetChannelId: TARGET_CHANNEL_ID,
    sourceChannelIds: splitEnvList(SOURCE_CHANNEL_IDS),
    adKeywords: splitEnvList(process.env.AD_KEYWORDS),
    enableQueue: process.env.ENABLE_QUEUE === "true" || process.env.ENABLE_QUEUE === "1",
    publishIntervalMin: Number(process.env.PUBLISH_INTERVAL_MIN) || 60,
    publishIntervalMax: Number(process.env.PUBLISH_INTERVAL_MAX) || 300,
    ...systemEnv,
  };
};

// Глобальная конфигурация
let currentConfig: AppConfig = loadConfig();

/**
 * Получить текущую конфигурацию
 */
export const getConfig = (): AppConfig => currentConfig;

/**
 * Перезагрузить конфигурацию из БД
 */
export const reloadConfig = (): AppConfig => {
  currentConfig = loadConfig();
  return currentConfig;
};

/**
 * Для обратной совместимости со старым кодом
 * @deprecated Используйте getConfig() вместо прямого доступа к env
 */
export const env = getConfig();
