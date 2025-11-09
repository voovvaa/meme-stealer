import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const posts = statsRepository.getPosts(limit, offset);
    const total = statsRepository.getPostsCount();

    return NextResponse.json({
      posts,
      total,
      limit,
      offset,
    });
  }, "Failed to fetch posts");
}
