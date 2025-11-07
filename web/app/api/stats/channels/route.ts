import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channelStats = statsRepository.getChannelStats();
    return NextResponse.json(channelStats);
  } catch (error) {
    logger.error({ err: error }, "Error fetching channel stats:");
    return NextResponse.json(
      { error: "Failed to fetch channel statistics" },
      { status: 500 }
    );
  }
}
