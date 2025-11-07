import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/media/[...path]
 * Отдача медиа файлов
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    // Определяем полный путь к файлу
    // В Docker: /app/media/YYYY/MM/hash.ext
    // В development: ../media/YYYY/MM/hash.ext
    // filePath приходит как: YYYY/MM/hash.ext (без префикса media/)

    // Проверяем разные варианты путей
    const possiblePaths = [
      join(process.cwd(), "..", "media", filePath),  // Docker: /app/media/...
      join("/app", "media", filePath),                // Абсолютный путь в Docker
      join(process.cwd(), "media", filePath),        // Если запущено из корня
      join("/tgcHelper", "media", filePath),         // Production вариант
    ];

    let fileBuffer: Buffer | undefined;
    let successPath = "";

    for (const testPath of possiblePaths) {
      try {
        fileBuffer = await readFile(testPath);
        successPath = testPath;
        break;
      } catch {
        continue;
      }
    }

    if (!fileBuffer) {
      logger.error({ possiblePaths }, "Media file not found");
      throw new Error("File not found in any location");
    }

    logger.info({ successPath }, "Media file loaded successfully");

    // Определяем MIME тип по расширению
    const ext = filePath.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    const mimeType = mimeTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error serving media:");
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
