import { z } from "zod";

/**
 * Filter keyword input validation schema
 */
export const FilterKeywordInputSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword is required")
    .max(255, "Keyword is too long")
    .transform((val) => val.toLowerCase().trim()),
  enabled: z.boolean().optional().default(true),
});

/**
 * Partial update schema for keywords
 */
export const FilterKeywordUpdateSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword cannot be empty")
    .max(255, "Keyword is too long")
    .transform((val) => val.toLowerCase().trim())
    .optional(),
  enabled: z.boolean().optional(),
});

export type ValidatedFilterKeywordInput = z.infer<typeof FilterKeywordInputSchema>;
export type ValidatedFilterKeywordUpdate = z.infer<typeof FilterKeywordUpdateSchema>;
