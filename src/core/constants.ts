/**
 * Конфигурация Telegram клиента
 */
export const TELEGRAM_CLIENT_CONFIG = {
  CONNECTION_RETRIES: 10,
  REQUEST_RETRIES: 5,
  RETRY_DELAY: 2000,
  TIMEOUT: 30,
} as const;

/**
 * Настройки обработки контента
 */
export const CONTENT_PREVIEW_LENGTH = 120;

/**
 * Настройки загрузки файлов
 */
export const UPLOAD_WORKERS = 1;
