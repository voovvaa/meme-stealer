import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { PaginationSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryParams = {
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    };

    const validation = validate(PaginationSchema as any, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    const { limit, offset } = validation.data as { limit: number; offset: number; };

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
