import { getDb } from "../db";
import { setNeedsReload, getCurrentTimestamp } from "./helpers";

/**
 * Базовый тип для archivable entity
 */
type ArchivableEntity = {
  id: number;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Базовый тип для archivable entity input
 */
type ArchivableInput = {
  enabled?: boolean;
};

/**
 * Конфигурация для создания archivable repository
 */
type ArchivableRepositoryConfig<
  T extends ArchivableEntity,
  TInput extends ArchivableInput,
  TRow,
> = {
  tableName: string;
  rowMapper: (row: TRow) => T;
  notFoundError: string;

  // SQL для insert
  insertFields: string; // "channel_id, channel_name, enabled, created_at, updated_at"
  insertPlaceholders: string; // "?, ?, ?, ?, ?"
  buildInsertParams: (input: TInput, now: string) => unknown[];

  // SQL для update
  updateFields: string; // "channel_name = ?, enabled = ?, updated_at = ?"
  buildUpdateParams: (input: Partial<TInput>, existing: T, now: string) => unknown[];
};

/**
 * Generic repository для archivable entities
 */
export type ArchivableRepository<T extends ArchivableEntity, TInput extends ArchivableInput> = {
  getAll(): T[];
  getById(id: number): T | null;
  add(input: TInput): void;
  update(id: number, input: Partial<TInput>): void;
  archive(id: number): void;
  unarchive(id: number): void;
  delete(id: number): void;
};

/**
 * Создаёт generic repository для archivable entity
 */
export function createArchivableRepository<
  T extends ArchivableEntity,
  TInput extends ArchivableInput,
  TRow,
>(config: ArchivableRepositoryConfig<T, TInput, TRow>): ArchivableRepository<T, TInput> {
  const {
    tableName,
    rowMapper,
    notFoundError,
    insertFields,
    insertPlaceholders,
    buildInsertParams,
    updateFields,
    buildUpdateParams,
  } = config;

  return {
    getAll(): T[] {
      const db = getDb();
      const rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY created_at DESC`).all();
      return rows.map((row) => rowMapper(row as TRow));
    },

    getById(id: number): T | null {
      const db = getDb();
      const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      return row ? rowMapper(row as TRow) : null;
    },

    add(input: TInput): void {
      const db = getDb();
      const now = getCurrentTimestamp();
      db.prepare(
        `
        INSERT INTO ${tableName} (${insertFields})
        VALUES (${insertPlaceholders})
      `,
      ).run(...buildInsertParams(input, now));
      setNeedsReload();
    },

    update(id: number, input: Partial<TInput>): void {
      const db = getDb();
      const now = getCurrentTimestamp();
      const existing = this.getById(id);
      if (!existing) throw new Error(notFoundError);

      const params = buildUpdateParams(input, existing, now);
      db.prepare(
        `
        UPDATE ${tableName} SET ${updateFields}
        WHERE id = ?
      `,
      ).run(...params, id);
      setNeedsReload();
    },

    archive(id: number): void {
      const db = getDb();
      const now = getCurrentTimestamp();
      db.prepare(
        `
        UPDATE ${tableName} SET archived = 1, updated_at = ?
        WHERE id = ?
      `,
      ).run(now, id);
      setNeedsReload();
    },

    unarchive(id: number): void {
      const db = getDb();
      const now = getCurrentTimestamp();
      db.prepare(
        `
        UPDATE ${tableName} SET archived = 0, updated_at = ?
        WHERE id = ?
      `,
      ).run(now, id);
      setNeedsReload();
    },

    delete(id: number): void {
      const db = getDb();
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
      setNeedsReload();
    },
  };
}
