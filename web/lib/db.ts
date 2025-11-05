import Database from "better-sqlite3";
import path from "path";

// Путь к БД (в Docker это будет shared volume)
const DB_PATH = process.env.MEME_DB_PATH || path.join(process.cwd(), "../sessions/memes.sqlite");

let db: Database.Database | null = null;

/**
 * Получить подключение к БД (singleton)
 */
export const getDb = (): Database.Database => {
  if (!db) {
    db = new Database(DB_PATH, {
      readonly: false,
      fileMustExist: false,
    });
    db.pragma("journal_mode = WAL;");
  }
  return db;
};

/**
 * Закрыть подключение к БД
 */
export const closeDb = (): void => {
  if (db) {
    db.close();
    db = null;
  }
};
