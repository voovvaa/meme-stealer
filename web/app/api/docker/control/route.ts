import { NextResponse } from "next/server";
import { getBotContainer, isDockerAvailable } from "@/lib/docker";
import { withErrorHandling } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type ControlAction = "start" | "stop" | "restart";

/**
 * POST /api/docker/control
 * Управление контейнером бота
 *
 * Body:
 * - action: "start" | "stop" | "restart"
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    // Check if Docker is available
    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      return NextResponse.json(
        { error: "Docker is not available. Make sure Docker socket is mounted." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const action = body.action as ControlAction;

    if (!action || !["start", "stop", "restart"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start', 'stop', or 'restart'" },
        { status: 400 },
      );
    }

    const container = await getBotContainer();
    const containerInfo = await container.inspect();

    logger.info({ action, containerName: containerInfo.Name }, "Docker control action");

    switch (action) {
      case "start":
        if (containerInfo.State.Running) {
          return NextResponse.json({
            success: false,
            message: "Container is already running",
          });
        }
        await container.start();
        return NextResponse.json({
          success: true,
          message: "Container started successfully",
        });

      case "stop":
        if (!containerInfo.State.Running) {
          return NextResponse.json({
            success: false,
            message: "Container is already stopped",
          });
        }
        await container.stop();
        return NextResponse.json({
          success: true,
          message: "Container stopped successfully",
        });

      case "restart":
        await container.restart();
        return NextResponse.json({
          success: true,
          message: "Container restarted successfully",
        });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  }, "Failed to control Docker container");
}
