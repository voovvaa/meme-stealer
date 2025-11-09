import { getDb } from "../db";
import type { FilterKeyword, FilterKeywordInput } from "@bot-types/database";
import type { FilterKeywordRow } from "./types";

const rowToFilterKeyword = (row: FilterKeywordRow): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const filterKeywordsRepository = {
  getAll(): FilterKeyword[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM filter_keywords ORDER BY created_at DESC").all();
    return rows.map((row) => rowToFilterKeyword(row as FilterKeywordRow));
  },

  add(input: FilterKeywordInput): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO filter_keywords (keyword, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `,
    ).run(input.keyword, input.enabled !== false ? 1 : 0, now, now);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  update(id: number, input: Partial<FilterKeywordInput>): void {
    const db = getDb();
    const now = new Date().toISOString();
    const keyword = this.getAll().find((k) => k.id === id);
    if (!keyword) throw new Error("Ключевое слово не найдено");

    db.prepare(
      `
      UPDATE filter_keywords SET keyword = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `,
    ).run(
      input.keyword !== undefined ? input.keyword : keyword.keyword,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : keyword.enabled ? 1 : 0,
      now,
      id,
    );
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  archive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      UPDATE filter_keywords SET archived = 1, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  unarchive(id: number): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
      UPDATE filter_keywords SET archived = 0, updated_at = ?
      WHERE id = ?
    `,
    ).run(now, id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },

  delete(id: number): void {
    const db = getDb();
    db.prepare("DELETE FROM filter_keywords WHERE id = ?").run(id);
    db.prepare("UPDATE config SET needs_reload = 1 WHERE id = 1").run();
  },
};
