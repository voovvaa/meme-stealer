import { getDatabase } from "./database.js";

/**
 * Устанавливает флаг needs_reload в конфигурации
 * Используется когда изменяются настройки, каналы или ключевые слова
 */
export const setNeedsReload = (): void => {
  const db = getDatabase();
  db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
};

/**
 * Возвращает текущую timestamp в формате ISO 8601
 * Используется для created_at и updated_at полей
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};
