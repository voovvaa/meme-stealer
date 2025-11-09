import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const queuedPosts = statsRepository.getQueuedPosts(limit, offset);
    const total = statsRepository.getQueuedPostsCount();

    return NextResponse.json({
      queuedPosts,
      total,
      limit,
      offset,
    });
  }, "Failed to fetch queued posts");
}
