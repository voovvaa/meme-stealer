import { NextResponse } from "next/server";
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

    console.log(`[Auth] Saving code to: ${authFilePath}`);
    console.log(`[Auth] Current working directory: ${process.cwd()}`);

    // Убеждаемся что директория существует
    try {
      await mkdir(sessionsDir, { recursive: true });
    } catch (err) {
      // Игнорируем если директория уже существует
    }

    // Сохраняем код
    await writeFile(authFilePath, code.trim(), "utf-8");

    console.log(`[Auth] Code saved successfully: ${code.length} characters`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth] Error saving auth code:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save code" },
      { status: 500 }
    );
  }
}
