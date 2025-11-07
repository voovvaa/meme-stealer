/**
 * Filter keyword types
 */

export type FilterKeyword = {
  id: number;
  keyword: string;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FilterKeywordInput = {
  keyword: string;
  enabled?: boolean;
};

/**
 * Raw database row type for filter keywords
 */
export type FilterKeywordRow = {
  id: number;
  keyword: string;
  enabled: number;
  archived: number;
  created_at: string;
  updated_at: string;
};
