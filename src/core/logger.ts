import pino from "pino";
import dotenv from "dotenv-flow";

// Загружаем переменные окружения
dotenv.config();

// Получаем уровень логирования напрямую из process.env
const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const logLevel = logLevels.includes(LOG_LEVEL as any) ? LOG_LEVEL : "info";

export const logger = pino({
  level: logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
