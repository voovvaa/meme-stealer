import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // В Docker контейнере sessions монтирован в /app/sessions
    const sessionsDir = path.join(process.cwd(), "sessions");
    const authFilePath = path.join(sessionsDir, "auth_code.txt");

    logger.info({ authFilePath, cwd: process.cwd() }, "Saving auth code");

    // Убеждаемся что директория существует
    try {
      await mkdir(sessionsDir, { recursive: true });
    } catch (err) {
      // Игнорируем если директория уже существует
    }

    // Сохраняем код
    await writeFile(authFilePath, code.trim(), "utf-8");

    logger.info({ codeLength: code.length }, "Auth code saved successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error saving auth code");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save code" },
      { status: 500 }
    );
  }
}
