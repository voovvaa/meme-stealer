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
 */
const EnvSchema = z
  .object({
    API_ID: z.string().min(1, "API_ID не задан"),
    API_HASH: z.string().min(1, "API_HASH не задан"),
    PHONE_NUMBER: z.string().min(1, "PHONE_NUMBER не задан"),
    TELEGRAM_PASSWORD: z.string().optional(),
    TARGET_CHANNEL_ID: z.string().min(1, "TARGET_CHANNEL_ID не задан"),
    SOURCE_CHANNEL_IDS: z.string().optional(),
    AD_KEYWORDS: z.string().optional(),
    LOG_LEVEL: z.string().optional(),
    SESSION_STORAGE_PATH: z.string().optional(),
    MEME_DB_PATH: z.string().optional(),
    ENABLE_QUEUE: z.string().optional(),
    PUBLISH_INTERVAL_MIN: z.string().optional(),
    PUBLISH_INTERVAL_MAX: z.string().optional(),
  })
  .transform((raw) => ({
    apiId: Number(raw.API_ID),
    apiHash: raw.API_HASH,
    phoneNumber: raw.PHONE_NUMBER,
    telegramPassword:
      raw.TELEGRAM_PASSWORD && raw.TELEGRAM_PASSWORD.length > 0 ? raw.TELEGRAM_PASSWORD : undefined,
    targetChannelId: raw.TARGET_CHANNEL_ID,
    sourceChannelIds: splitEnvList(raw.SOURCE_CHANNEL_IDS),
    adKeywords: splitEnvList(raw.AD_KEYWORDS),
    logLevel:
      raw.LOG_LEVEL && logLevels.includes(raw.LOG_LEVEL as (typeof logLevels)[number])
        ? (raw.LOG_LEVEL as (typeof logLevels)[number])
        : "info",
    sessionStoragePath: raw.SESSION_STORAGE_PATH ?? "./sessions/client.session",
    memeDbPath: raw.MEME_DB_PATH ?? "./sessions/memes.sqlite",
    enableQueue: raw.ENABLE_QUEUE === "true" || raw.ENABLE_QUEUE === "1",
    publishIntervalMin: raw.PUBLISH_INTERVAL_MIN ? Number(raw.PUBLISH_INTERVAL_MIN) : 60,
    publishIntervalMax: raw.PUBLISH_INTERVAL_MAX ? Number(raw.PUBLISH_INTERVAL_MAX) : 300,
  }))
  .refine((data) => data.sourceChannelIds.length > 0, {
    message: "Не заданы SOURCE_CHANNEL_IDS",
    path: ["sourceChannelIds"],
  })
  .refine((data) => Number.isInteger(data.apiId) && data.apiId > 0, {
    message: "API_ID должен быть положительным целым числом",
    path: ["apiId"],
  })
  .refine(
    (data) => data.publishIntervalMin > 0 && data.publishIntervalMax > 0,
    {
      message: "Интервалы публикации должны быть положительными числами",
      path: ["publishIntervalMin", "publishIntervalMax"],
    },
  )
  .refine(
    (data) => data.publishIntervalMin <= data.publishIntervalMax,
    {
      message: "PUBLISH_INTERVAL_MIN должен быть меньше или равен PUBLISH_INTERVAL_MAX",
      path: ["publishIntervalMin", "publishIntervalMax"],
    },
  );

/**
 * Парсит и валидирует переменные окружения
 */
const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.error("Переменные окружения не проходят валидацию:");
    console.error(error);
    process.exit(1);
  }
};

export const env = parseEnv();
