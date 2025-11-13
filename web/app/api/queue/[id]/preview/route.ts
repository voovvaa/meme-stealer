import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { handleApiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/queue/[id]/preview
 * Возвращает превью изображения из очереди
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queueId = parseInt(id);

    if (isNaN(queueId)) {
      return NextResponse.json({ error: "Invalid queue ID" }, { status: 400 });
    }

    const mediaDataString = statsRepository.getQueuedPostMediaData(queueId);

    if (!mediaDataString) {
      logger.error({ queueId }, "Queue item not found");
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    // Парсим media_data JSON
    const mediaData = JSON.parse(mediaDataString);

    // Конвертируем buffer из массива обратно в Buffer
    let buffer: Buffer;
    if (mediaData.buffer && Array.isArray(mediaData.buffer)) {
      buffer = Buffer.from(mediaData.buffer);
    } else {
      logger.error({ queueId }, "Invalid media data format");
      return NextResponse.json({ error: "Invalid media data" }, { status: 500 });
    }

    // Определяем MIME тип
    const mimeType = mediaData.mimeType || "image/jpeg";

    logger.debug({ queueId, mimeType }, "Serving queue preview");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to serve queue preview");
  }
}
