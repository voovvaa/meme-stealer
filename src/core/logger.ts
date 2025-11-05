import pino from "pino";
import dotenv from "dotenv-flow";

// Загружаем .env только в dev режиме (в Docker переменные передаются через docker-compose)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Получаем уровень логирования напрямую из process.env
const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const logLevel = logLevels.includes(LOG_LEVEL as any) ? LOG_LEVEL : "info";

export const logger = pino({
  level: logLevel,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});
