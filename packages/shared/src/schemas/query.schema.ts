import { z } from "zod";

import { PAGINATION, TIMELINE } from "../constants/index.js";

/**
 * Pagination query parameters validation schema
 */
export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_POSTS_LIMIT))
    .pipe(
      z
        .number()
        .int()
        .min(PAGINATION.MIN_LIMIT, `Limit must be at least ${PAGINATION.MIN_LIMIT}`)
        .max(PAGINATION.MAX_LIMIT, `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`)
    ),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0, "Offset must be non-negative")),
});

/**
 * Gallery pagination schema
 */
export const GalleryPaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : PAGINATION.DEFAULT_GALLERY_LIMIT))
    .pipe(
      z
        .number()
        .int()
        .min(PAGINATION.MIN_LIMIT, `Limit must be at least ${PAGINATION.MIN_LIMIT}`)
        .max(PAGINATION.MAX_LIMIT, `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`)
    ),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0, "Offset must be non-negative")),
  hash: z.string().optional(),
});

/**
 * Timeline days validation schema
 */
export const TimelineDaysSchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : TIMELINE.DEFAULT_DAYS))
    .pipe(
      z
        .number()
        .int()
        .min(TIMELINE.MIN_DAYS, `Days must be at least ${TIMELINE.MIN_DAYS}`)
        .max(TIMELINE.MAX_DAYS, `Days cannot exceed ${TIMELINE.MAX_DAYS}`)
    ),
});

/**
 * ID parameter validation schema
 */
export const IdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("ID must be a positive integer")),
});

export type ValidatedPagination = z.infer<typeof PaginationSchema>;
export type ValidatedGalleryPagination = z.infer<typeof GalleryPaginationSchema>;
export type ValidatedTimelineDays = z.infer<typeof TimelineDaysSchema>;
export type ValidatedIdParam = z.infer<typeof IdParamSchema>;
