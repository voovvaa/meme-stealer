import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
