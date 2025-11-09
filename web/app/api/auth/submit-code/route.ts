import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // В Docker контейнере sessions монтирован в /app/sessions
    const sessionsDir = path.join(process.cwd(), "sessions");
    const authFilePath = path.join(sessionsDir, "auth_code.txt");

    logger.info({ path: authFilePath, cwd: process.cwd() }, "Saving auth code");

    // Убеждаемся что директория существует
    try {
      await mkdir(sessionsDir, { recursive: true });
    } catch (err) {
      // Игнорируем если директория уже существует
    }

    // Сохраняем код
    await writeFile(authFilePath, code.trim(), "utf-8");

    logger.info({ length: code.length }, "Auth code saved successfully");

    return NextResponse.json({ success: true });
  }, "Failed to save auth code");
}
