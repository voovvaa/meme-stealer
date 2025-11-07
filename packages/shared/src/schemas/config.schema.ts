import { z } from "zod";

/**
 * Configuration input validation schema
 */
export const ConfigInputSchema = z.object({
  apiId: z.number().int().positive("API ID must be a positive integer"),
  apiHash: z
    .string()
    .min(1, "API Hash is required")
    .max(255, "API Hash is too long"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
  telegramPassword: z
    .string()
    .max(255, "Password is too long")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
  targetChannelId: z
    .string()
    .min(1, "Target channel ID is required")
    .max(255, "Target channel ID is too long"),
  enableQueue: z.boolean().default(true),
  publishIntervalMin: z
    .number()
    .int()
    .min(10, "Publish interval min must be at least 10 seconds")
    .max(3600, "Publish interval min cannot exceed 1 hour"),
  publishIntervalMax: z
    .number()
    .int()
    .min(60, "Publish interval max must be at least 60 seconds")
    .max(86400, "Publish interval max cannot exceed 24 hours"),
});

export type ValidatedConfigInput = z.infer<typeof ConfigInputSchema>;
