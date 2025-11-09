import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const timelineStats = statsRepository.getTimelineStats(days);
    return NextResponse.json(timelineStats);
  }, "Failed to fetch timeline statistics");
}
