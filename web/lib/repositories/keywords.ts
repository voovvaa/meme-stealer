import type { FilterKeyword, FilterKeywordInput } from "@bot-types/database";
import type { FilterKeywordRow } from "./types";
import { createArchivableRepository } from "./createArchivableRepository";

const rowToFilterKeyword = (row: FilterKeywordRow): FilterKeyword => ({
  id: row.id,
  keyword: row.keyword,
  enabled: Boolean(row.enabled),
  archived: Boolean(row.archived),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const filterKeywordsRepository = createArchivableRepository<
  FilterKeyword,
  FilterKeywordInput,
  FilterKeywordRow
>({
  tableName: "filter_keywords",
  rowMapper: rowToFilterKeyword,
  notFoundError: "Ключевое слово не найдено",

  insertFields: "keyword, enabled, created_at, updated_at",
  insertPlaceholders: "?, ?, ?, ?",
  buildInsertParams: (input, now) => [input.keyword, input.enabled !== false ? 1 : 0, now, now],

  updateFields: "keyword = ?, enabled = ?, updated_at = ?",
  buildUpdateParams: (input, existing, now) => [
    input.keyword !== undefined ? input.keyword : existing.keyword,
    input.enabled !== undefined ? (input.enabled ? 1 : 0) : existing.enabled ? 1 : 0,
    now,
  ],
});
