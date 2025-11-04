import dotenvFlow from "dotenv-flow";
import { z } from "zod";

dotenvFlow.config();

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;

const RawEnvSchema = z.object({
  API_ID: z.string().min(1, "API_ID не задан"),
  API_HASH: z.string().min(1, "API_HASH не задан"),
  PHONE_NUMBER: z.string().min(1, "PHONE_NUMBER не задан"),
  TELEGRAM_PASSWORD: z.string().optional(),
  TARGET_CHANNEL_ID: z.string().min(1, "TARGET_CHANNEL_ID не задан"),
  SOURCE_CHANNEL_IDS: z.string().optional(),
  AD_KEYWORDS: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  SESSION_STORAGE_PATH: z.string().optional(),
  MEME_DB_PATH: z.string().optional()
});

const splitEnvList = (value?: string): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

const parseEnv = () => {
  try {
    return RawEnvSchema.parse(process.env);
  } catch (error) {
    console.error("Не удалось считать переменные окружения:");
    console.error(error);
    process.exit(1);
  }
};

const raw = parseEnv();

const EnvSchema = z.object({
  apiId: z.number().int().positive(),
  apiHash: z.string(),
  phoneNumber: z.string(),
  telegramPassword: z.string().optional(),
  targetChannelId: z.string(),
  sourceChannelIds: z.array(z.string()).min(1, "Не заданы SOURCE_CHANNEL_IDS"),
  adKeywords: z.array(z.string()).default([]),
  logLevel: z.enum(logLevels).default("info"),
  sessionStoragePath: z.string(),
  memeDbPath: z.string()
});

const parseStructuredEnv = () => {
  try {
    return EnvSchema.parse({
      apiId: Number(raw.API_ID),
      apiHash: raw.API_HASH,
      phoneNumber: raw.PHONE_NUMBER,
      telegramPassword: raw.TELEGRAM_PASSWORD && raw.TELEGRAM_PASSWORD.length > 0
        ? raw.TELEGRAM_PASSWORD
        : undefined,
      targetChannelId: raw.TARGET_CHANNEL_ID,
      sourceChannelIds: splitEnvList(raw.SOURCE_CHANNEL_IDS),
      adKeywords: splitEnvList(raw.AD_KEYWORDS),
      logLevel:
        (raw.LOG_LEVEL && logLevels.includes(raw.LOG_LEVEL as (typeof logLevels)[number])
          ? raw.LOG_LEVEL
          : undefined) ?? "info",
      sessionStoragePath: raw.SESSION_STORAGE_PATH ?? "./sessions/client.session",
      memeDbPath: raw.MEME_DB_PATH ?? "./sessions/memes.sqlite"
    });
  } catch (error) {
    console.error("Переменные окружения не проходят валидацию:");
    console.error(error);
    process.exit(1);
  }
};

const parsed = parseStructuredEnv();

export const env = parsed;

export type AppEnv = typeof env;
