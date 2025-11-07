import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "./lib/logger";

/**
 * Public endpoints that don't require Basic Auth
 */
const PUBLIC_ENDPOINTS = [
  "/api/health",           // Health check for monitoring
  "/api/auth/submit-code", // Telegram auth code submission
];

/**
 * Log request information
 */
function logRequest(request: NextRequest, authenticated: boolean) {
  const method = request.method;
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  logger.info({
    method,
    path,
    authenticated,
    ip,
    userAgent: userAgent.slice(0, 50)
  }, "Request");
}

export function middleware(request: NextRequest) {
  // Пропускаем статические файлы и _next
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/static") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Пропускаем /auth (страница авторизации не требует Basic Auth)
  if (request.nextUrl.pathname.startsWith("/auth")) {
    logRequest(request, false);
    return NextResponse.next();
  }

  // Пропускаем публичные API endpoints
  if (PUBLIC_ENDPOINTS.some(endpoint => request.nextUrl.pathname === endpoint)) {
    logRequest(request, false);
    return NextResponse.next();
  }

  // Получаем переменные окружения для Basic Auth
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // Если не настроен Basic Auth, пропускаем (только для dev)
  if (!basicAuthUser || !basicAuthPassword) {
    logger.warn("Basic Auth is not configured! Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD");
    logRequest(request, false);
    return NextResponse.next();
  }

  // Проверяем заголовок Authorization
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    logRequest(request, false);
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // Декодируем Basic Auth
  try {
    const auth = authHeader.split(" ")[1];
    if (!auth) {
      throw new Error("Invalid auth header format");
    }

    const [user, password] = Buffer.from(auth, "base64").toString().split(":");

    // Проверяем credentials
    if (user !== basicAuthUser || password !== basicAuthPassword) {
      logRequest(request, false);
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    logRequest(request, true);
    return NextResponse.next();
  } catch (error) {
    logger.error({ err: error }, "Error decoding credentials");
    logRequest(request, false);
    return new NextResponse("Invalid authentication format", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
