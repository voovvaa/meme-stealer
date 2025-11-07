/**
 * Authentication utilities for API routes
 */

import { NextRequest } from "next/server";

/**
 * Check if Basic Auth credentials are valid
 */
export function validateBasicAuth(request: NextRequest): {
  valid: boolean;
  user?: string;
  error?: string;
} {
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // If auth not configured, deny access (fail-safe)
  if (!basicAuthUser || !basicAuthPassword) {
    return {
      valid: false,
      error: "Authentication not configured",
    };
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      valid: false,
      error: "No authorization header",
    };
  }

  try {
    const auth = authHeader.split(" ")[1];
    if (!auth) {
      return {
        valid: false,
        error: "Invalid authorization format",
      };
    }

    const [user, password] = Buffer.from(auth, "base64").toString().split(":");

    if (user !== basicAuthUser || password !== basicAuthPassword) {
      return {
        valid: false,
        error: "Invalid credentials",
      };
    }

    return {
      valid: true,
      user,
    };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to decode credentials",
    };
  }
}

/**
 * Check if the endpoint is public (doesn't require auth)
 */
export function isPublicEndpoint(pathname: string): boolean {
  const publicEndpoints = [
    "/api/health",
    "/api/auth/submit-code",
  ];

  return publicEndpoints.includes(pathname);
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  request: NextRequest,
  success: boolean,
  reason?: string
) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const path = request.nextUrl.pathname;
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  const status = success ? "SUCCESS" : "FAILED";
  const reasonStr = reason ? ` | Reason: ${reason}` : "";

  console.log(
    `[Auth] [${timestamp}] ${status} | ${method} ${path} | IP: ${ip}${reasonStr} | UA: ${userAgent.slice(0, 50)}`
  );
}
