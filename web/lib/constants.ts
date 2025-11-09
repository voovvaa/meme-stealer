/**
 * Интервалы обновления (в миллисекундах)
 */
export const REFRESH_INTERVALS = {
  /** Интервал проверки статуса бота (10 секунд) */
  BOT_STATUS: 10000,
  /** Интервал обновления статистики БД (30 секунд) */
  DATABASE_STATS: 30000,
} as const;

/**
 * Лимиты пагинации
 */
export const PAGINATION = {
  /** Лимит по умолчанию для списков (очередь, история) */
  DEFAULT_LIMIT: 50,
  /** Лимит для галереи */
  GALLERY_LIMIT: 20,
} as const;

/**
 * Параметры графиков и статистики
 */
export const CHARTS = {
  /** Количество дней для графика публикаций */
  TIMELINE_DAYS: 30,
} as const;
