import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const timelineStats = statsRepository.getTimelineStats(days);
    return NextResponse.json(timelineStats);
  } catch (error) {
    console.error("Error fetching timeline stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline statistics" },
      { status: 500 }
    );
  }
}
