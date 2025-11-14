import { NextResponse } from "next/server";
import { getBotContainer, isDockerAvailable } from "@/lib/docker";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/docker/status
 * Получение статуса контейнера бота
 */
export async function GET() {
  return withErrorHandling(async () => {
    // Check if Docker is available
    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      return NextResponse.json(
        {
          available: false,
          error: "Docker is not available",
        },
        { status: 503 },
      );
    }

    try {
      const container = await getBotContainer();
      const info = await container.inspect();

      // Extract useful information
      const status = {
        available: true,
        id: info.Id.substring(0, 12),
        name: info.Name.replace(/^\//, ""),
        state: info.State.Status,
        running: info.State.Running,
        startedAt: info.State.StartedAt,
        finishedAt: info.State.FinishedAt,
        restartCount: info.RestartCount,
        platform: info.Platform,
        image: info.Config.Image,
      };

      return NextResponse.json(status);
    } catch (error) {
      return NextResponse.json(
        {
          available: false,
          error: error instanceof Error ? error.message : "Container not found",
        },
        { status: 404 },
      );
    }
  }, "Failed to fetch Docker status");
}
