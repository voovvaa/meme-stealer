/**
 * Application-wide constants
 */

export const PAGINATION = {
  DEFAULT_GALLERY_LIMIT: 20,
  DEFAULT_POSTS_LIMIT: 50,
  DEFAULT_QUEUE_LIMIT: 50,
  MAX_LIMIT: 1000,
  MIN_LIMIT: 1,
} as const;

export const TIMELINE = {
  DEFAULT_DAYS: 30,
  MAX_DAYS: 365,
  MIN_DAYS: 1,
} as const;

export const CONFIG = {
  ID: 1,
  NEEDS_RELOAD_QUERY: "UPDATE config SET needs_reload = 1 WHERE id = 1",
  CLEAR_RELOAD_QUERY: "UPDATE config SET needs_reload = 0 WHERE id = 1",
} as const;

export const QUEUE_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type QueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];
