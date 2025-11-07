import pino from "pino";

/**
 * Centralized logger for the web application
 * Uses Pino for structured logging
 */

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof logLevels)[number];

// Get log level from environment variable, default to "info"
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const logLevel = logLevels.includes(LOG_LEVEL as LogLevel) ? (LOG_LEVEL as LogLevel) : "info";

// Determine if we should use pretty printing (development mode)
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: logLevel,
  base: undefined, // Remove pid, hostname from logs for cleaner output
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

/**
 * Create a child logger with specific context
 * Useful for adding consistent context to all logs in a module
 *
 * @example
 * const log = createLogger({ module: 'api/config' });
 * log.info('Config updated');
 */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

/**
 * Log API error with consistent formatting
 */
export function logApiError(error: unknown, context: string) {
  logger.error({ err: error }, `API Error: ${context}`);
}
