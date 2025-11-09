import { getDatabase } from "./database.js";
import type { FilterKeyword, FilterKeywordInput } from "../../types/database.js";
import { logger } from "../logger.js";
import { setNeedsReload, getCurrentTimestamp } from "./helpers.js";

const db = getDatabase();

// Prepared statements для filter_keywords
const getAllFilterKeywordsStmt = db.prepare(`
  SELECT * FROM filter_keywords ORDER BY created_at DESC
`);

const getFilterKeywordByIdStmt = db.prepare(`
  SELECT * FROM filter_keywords WHERE id = ?
`);

const getEnabledFilterKeywordsStmt = db.prepare(`
  SELECT * FROM filter_keywords WHERE enabled = 1 ORDER BY created_at DESC
`);

const insertFilterKeywordStmt = db.prepare(`
  INSERT INTO filter_keywords (keyword, enabled, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`);

const updateFilterKeywordStmt = db.prepare(`
  UPDATE filter_keywords SET keyword = ?, enabled = ?, updated_at = ?
  WHERE id = ?
`);

const deleteFilterKeywordStmt = db.prepare(`
  DELETE FROM filter_keywords WHERE id = ?
`);

// Helper types and functions
type FilterKeywordRow = {
  id: number;
  keyword: string;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};

const rowToFilterKeyword = (row: FilterKeywordRow): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const filterKeywordsRepository = {
  getAllFilterKeywords(): FilterKeyword[] {
    const rows = getAllFilterKeywordsStmt.all() as FilterKeywordRow[];
    return rows.map((row) => rowToFilterKeyword(row));
  },

  getFilterKeywordById(id: number): FilterKeyword | null {
    const row = getFilterKeywordByIdStmt.get(id) as FilterKeywordRow | undefined;
    return row ? rowToFilterKeyword(row) : null;
  },

  getEnabledFilterKeywords(): FilterKeyword[] {
    const rows = getEnabledFilterKeywordsStmt.all() as FilterKeywordRow[];
    return rows.map((row) => rowToFilterKeyword(row));
  },

  addFilterKeyword(input: FilterKeywordInput): void {
    const now = getCurrentTimestamp();
    try {
      insertFilterKeywordStmt.run(input.keyword, input.enabled !== false ? 1 : 0, now, now);
      setNeedsReload();
      logger.info({ keyword: input.keyword }, "Добавлено ключевое слово");
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        logger.warn({ keyword: input.keyword }, "Ключевое слово уже существует");
        throw new Error("Ключевое слово уже существует");
      }
      throw error;
    }
  },

  updateFilterKeyword(id: number, input: Partial<FilterKeywordInput>): void {
    const now = getCurrentTimestamp();
    // FIXED: Use getById instead of loading all keywords (N+1 query fix)
    const keyword = this.getFilterKeywordById(id);
    if (!keyword) {
      throw new Error("Ключевое слово не найдено");
    }

    updateFilterKeywordStmt.run(
      input.keyword !== undefined ? input.keyword : keyword.keyword,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : keyword.enabled ? 1 : 0,
      now,
      id,
    );
    setNeedsReload();
    logger.info({ id, keyword: keyword.keyword }, "Ключевое слово обновлено");
  },

  deleteFilterKeyword(id: number): void {
    deleteFilterKeywordStmt.run(id);
    setNeedsReload();
    logger.info({ id }, "Ключевое слово удалено");
  },
};
