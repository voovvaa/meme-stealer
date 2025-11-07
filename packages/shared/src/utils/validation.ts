import type { ZodSchema, ZodError } from "zod";

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> };

/**
 * Validate data against a Zod schema
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      const zodError = error as ZodError;
      const details: Record<string, string[]> = {};

      for (const issue of zodError.issues) {
        const path = issue.path.join(".");
        if (!details[path]) {
          details[path] = [];
        }
        details[path]!.push(issue.message);
      }

      return {
        success: false,
        error: "Validation failed",
        details,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Validate data and throw error if invalid
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
