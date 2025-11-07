import { logger } from "./logger.js";

/**
 * Check if error is a Telegram timeout error
 */
function isTelegramTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message === "TIMEOUT" ||
      error.message.includes("timeout") ||
      error.message.includes("TIMEOUT")
    );
  }
  return false;
}

/**
 * Check if error is a Telegram connection error
 */
function isTelegramConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("CONNECTION") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ETIMEDOUT")
    );
  }
  return false;
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtException(error: Error, origin: string): void {
  // Telegram timeout errors are expected and handled by auto-reconnect
  if (isTelegramTimeoutError(error)) {
    logger.warn(
      { err: error, origin },
      "Telegram timeout error - auto-reconnect will handle this"
    );
    return;
  }

  // Connection errors are also handled by auto-reconnect
  if (isTelegramConnectionError(error)) {
    logger.warn(
      { err: error, origin },
      "Telegram connection error - auto-reconnect will handle this"
    );
    return;
  }

  // For other errors, log and exit
  logger.fatal(
    { err: error, origin },
    "Uncaught exception - application will exit"
  );
  process.exit(1);
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection(
  reason: unknown,
  promise: Promise<unknown>
): void {
  // Telegram timeout errors are expected and handled by auto-reconnect
  if (isTelegramTimeoutError(reason)) {
    logger.warn(
      { reason, promise: promise.toString() },
      "Unhandled Telegram timeout rejection - auto-reconnect will handle this"
    );
    return;
  }

  // Connection errors are also handled by auto-reconnect
  if (isTelegramConnectionError(reason)) {
    logger.warn(
      { reason, promise: promise.toString() },
      "Unhandled Telegram connection rejection - auto-reconnect will handle this"
    );
    return;
  }

  // For other rejections, log and exit
  logger.fatal(
    { reason, promise: promise.toString() },
    "Unhandled promise rejection - application will exit"
  );
  process.exit(1);
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  process.on("uncaughtException", handleUncaughtException);
  process.on("unhandledRejection", handleUnhandledRejection);

  logger.info("Global error handlers registered");
}
