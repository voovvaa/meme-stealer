/**
 * Database connection for web interface
 * Re-exports from shared package
 */

import { getDatabase, initializeDatabase } from "@meme-stealer/shared";
import path from "path";

// Путь к БД (в Docker это будет shared volume)
const DB_PATH = process.env.MEME_DB_PATH || path.join(process.cwd(), "../sessions/memes.sqlite");

/**
 * Получить подключение к БД (singleton)
 */
export const getDb = () => {
  const db = getDatabase({ path: DB_PATH });
  // Initialize database schema if needed
  initializeDatabase(db);
  return db;
};
