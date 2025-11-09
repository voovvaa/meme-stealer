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

/**
 * Интервалы и таймауты (в миллисекундах)
 */
export const INTERVALS = {
  /** Интервал проверки конфигурации (5 секунд) */
  CONFIG_CHECK: 5000,
  /** Интервал проверки очереди постов (5 секунд) */
  QUEUE_CHECK: 5000,
  /** Задержка между проверками файла авторизации (1 секунда) */
  AUTH_FILE_POLL: 1000,
} as const;

/**
 * Таймауты (в миллисекундах)
 */
export const TIMEOUTS = {
  /** Таймаут graceful shutdown (10 секунд) */
  SHUTDOWN: 10000,
  /** Таймаут ожидания файла авторизации (3 минуты) */
  AUTH_FILE_WAIT: 180000,
} as const;

/**
 * Константы конвертации времени
 */
export const TIME = {
  /** Миллисекунд в секунде */
  MS_IN_SECOND: 1000,
} as const;
