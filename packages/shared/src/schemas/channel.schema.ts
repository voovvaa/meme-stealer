import { z } from "zod";

/**
 * Source channel input validation schema
 */
export const SourceChannelInputSchema = z.object({
  channelId: z
    .string()
    .min(1, "Channel ID is required")
    .max(255, "Channel ID is too long")
    .regex(/^-?\d+$/, "Channel ID must be a valid Telegram channel ID"),
  channelName: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(255, "Channel name is too long")
    .optional(),
  enabled: z.boolean().optional().default(true),
});

/**
 * Partial update schema for channels
 */
export const SourceChannelUpdateSchema = z.object({
  channelName: z
    .string()
    .min(1, "Channel name cannot be empty")
    .max(255, "Channel name is too long")
    .optional(),
  enabled: z.boolean().optional(),
});

export type ValidatedSourceChannelInput = z.infer<typeof SourceChannelInputSchema>;
export type ValidatedSourceChannelUpdate = z.infer<typeof SourceChannelUpdateSchema>;
