import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = statsRepository.getMemeStats();
    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ err: error }, "Error fetching stats:");
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
