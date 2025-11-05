import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channelStats = statsRepository.getChannelStats();
    return NextResponse.json(channelStats);
  } catch (error) {
    console.error("Error fetching channel stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel statistics" },
      { status: 500 }
    );
  }
}
