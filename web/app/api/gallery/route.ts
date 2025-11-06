import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery
 * Получение мемов для галереи с пагинацией
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const posts = statsRepository.getPosts(limit, offset);
    const totalCount = statsRepository.getPostsCount();

    // Фильтруем только опубликованные посты с file_path
    const galleryPosts = posts.filter(
      (post) => post.filePath && post.targetMessageId
    );

    console.log("[Gallery API] First post filePath:", galleryPosts[0]?.filePath);
    console.log("[Gallery API] Total gallery posts:", galleryPosts.length);

    return NextResponse.json({
      posts: galleryPosts,
      hasMore: offset + limit < totalCount,
      page,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}
