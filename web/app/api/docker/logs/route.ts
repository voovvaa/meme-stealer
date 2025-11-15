import { NextResponse } from "next/server";
import { getBotContainer, isDockerAvailable } from "@/lib/docker";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/docker/logs
 * Получение логов контейнера бота
 *
 * Query params:
 * - tail: количество строк с конца (по умолчанию 100)
 * - timestamps: добавлять timestamps (по умолчанию true)
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    // Check if Docker is available
    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      return NextResponse.json(
        { error: "Docker is not available. Make sure Docker socket is mounted." },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const tail = parseInt(searchParams.get("tail") || "100");
    const timestamps = searchParams.get("timestamps") !== "false";

    const container = await getBotContainer();

    // Get logs from container
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps,
    });

    // Convert buffer to string
    const logsText = logs.toString("utf-8");

    // Parse logs into structured format
    const logLines = logsText
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string) => {
        // Docker adds 8 bytes header to each log line, remove it
        const cleanLine = line.slice(8);
        return cleanLine;
      });

    return NextResponse.json({
      logs: logLines,
      count: logLines.length,
    });
  }, "Failed to fetch Docker logs");
}
