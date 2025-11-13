import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/queue/[id]
 * Удаляет отложенную запись из очереди
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const queueId = parseInt(id);

    if (isNaN(queueId)) {
      return NextResponse.json({ error: "Invalid queue ID" }, { status: 400 });
    }

    const deleted = statsRepository.deleteQueuedPost(queueId);

    if (!deleted) {
      logger.warn({ queueId }, "Queue item not found or already processed");
      return NextResponse.json(
        { error: "Queue item not found or already processed" },
        { status: 404 }
      );
    }

    logger.info({ queueId }, "Queue item deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Queue item deleted successfully",
    });
  }, "Failed to delete queue item");
}
