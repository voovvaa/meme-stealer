import type Database from "better-sqlite3";

import { CONFIG } from "../constants/index.js";
import type { FilterKeyword, FilterKeywordInput, FilterKeywordRow } from "../types/index.js";
import { rowToFilterKeyword } from "../utils/index.js";

/**
 * Filter keywords repository
 */
export class KeywordRepository {
  private getAllStmt: ReturnType<Database.Database["prepare"]>;
  private getEnabledStmt: ReturnType<Database.Database["prepare"]>;
  private insertStmt: ReturnType<Database.Database["prepare"]>;
  private updateStmt: ReturnType<Database.Database["prepare"]>;
  private archiveStmt: ReturnType<Database.Database["prepare"]>;
  private unarchiveStmt: ReturnType<Database.Database["prepare"]>;
  private deleteStmt: ReturnType<Database.Database["prepare"]>;
  private setNeedsReloadStmt: ReturnType<Database.Database["prepare"]>;

  constructor(db: ReturnType<typeof Database>) {
    this.getAllStmt = db.prepare(`
      SELECT * FROM filter_keywords ORDER BY created_at DESC
    `);

    this.getEnabledStmt = db.prepare(`
      SELECT * FROM filter_keywords
      WHERE enabled = 1 AND archived = 0
      ORDER BY created_at DESC
    `);

    this.insertStmt = db.prepare(`
      INSERT INTO filter_keywords (keyword, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);

    this.updateStmt = db.prepare(`
      UPDATE filter_keywords
      SET keyword = ?, enabled = ?, updated_at = ?
      WHERE id = ?
    `);

    this.archiveStmt = db.prepare(`
      UPDATE filter_keywords
      SET archived = 1, updated_at = ?
      WHERE id = ?
    `);

    this.unarchiveStmt = db.prepare(`
      UPDATE filter_keywords
      SET archived = 0, updated_at = ?
      WHERE id = ?
    `);

    this.deleteStmt = db.prepare(`
      DELETE FROM filter_keywords WHERE id = ?
    `);

    this.setNeedsReloadStmt = db.prepare(CONFIG.NEEDS_RELOAD_QUERY);
  }

  /**
   * Get all keywords (including archived)
   */
  getAll(): FilterKeyword[] {
    const rows = this.getAllStmt.all([]) as FilterKeywordRow[];
    return rows.map(rowToFilterKeyword);
  }

  /**
   * Get only enabled and non-archived keywords
   */
  getEnabled(): FilterKeyword[] {
    const rows = this.getEnabledStmt.all([]) as FilterKeywordRow[];
    return rows.map(rowToFilterKeyword);
  }

  /**
   * Add new keyword
   */
  add(input: FilterKeywordInput): void {
    const now = new Date().toISOString();
    this.insertStmt.run([input.keyword,
      input.enabled !== false ? 1 : 0,
      now,
      now]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Update keyword
   */
  update(id: number, input: Partial<FilterKeywordInput>): void {
    const now = new Date().toISOString();
    const keyword = this.getAll().find((k) => k.id === id);

    if (!keyword) {
      throw new Error("Keyword not found");
    }

    this.updateStmt.run([
      input.keyword !== undefined ? input.keyword : keyword.keyword,
      input.enabled !== undefined ? (input.enabled ? 1 : 0) : (keyword.enabled ? 1 : 0),
      now,
      id
    ]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Archive keyword (soft delete)
   */
  archive(id: number): void {
    const now = new Date().toISOString();
    this.archiveStmt.run([now, id]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Unarchive keyword
   */
  unarchive(id: number): void {
    const now = new Date().toISOString();
    this.unarchiveStmt.run([now, id]);
    this.setNeedsReloadStmt.run([]);
  }

  /**
   * Delete keyword permanently
   */
  delete(id: number): void {
    this.deleteStmt.run([id]);
    this.setNeedsReloadStmt.run([]);
  }
}
