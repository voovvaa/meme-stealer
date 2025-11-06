import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
  } catch (error) {
    console.error("Error fetching queued posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch queued posts" },
      { status: 500 }
    );
  }
}
