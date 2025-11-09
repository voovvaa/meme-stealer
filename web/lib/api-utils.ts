/**
 * Utility functions for API routes
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * Handles errors in API routes with consistent logging and response format
 *
 * @param error - The error that occurred
 * @param message - User-friendly error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error details
 *
 * @example
 * ```typescript
 * try {
 *   // ... your code
 * } catch (error) {
 *   return handleApiError(error, "Failed to fetch data");
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  message: string,
  status: number = 500,
): NextResponse {
  // Log the error with structured logging
  logger.error({ error }, message);

  // Return user-friendly error response
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : message,
    },
    { status },
  );
}

/**
 * Wraps an async API handler with automatic error handling
 *
 * @param handler - The async function to execute
 * @param errorMessage - Error message if handler fails
 * @returns NextResponse
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   return withErrorHandling(async () => {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   }, "Failed to fetch data");
 * }
 * ```
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  errorMessage: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error, errorMessage);
  }
}
