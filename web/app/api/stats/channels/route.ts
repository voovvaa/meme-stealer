import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const channelStats = statsRepository.getChannelStats();
    return NextResponse.json(channelStats);
  }, "Failed to fetch channel statistics");
}
