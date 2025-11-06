import { NextResponse } from "next/server";
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
    // filePath из БД: "media/YYYY/MM/hash.ext"
    // Нужно подняться на уровень выше от web/
    const fullPath = join(process.cwd(), "..", filePath);

    console.log("[Media API] Requested path array:", path);
    console.log("[Media API] Joined filePath:", filePath);
    console.log("[Media API] Full path:", fullPath);
    console.log("[Media API] CWD:", process.cwd());

    const fileBuffer = await readFile(fullPath);

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

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving media:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
