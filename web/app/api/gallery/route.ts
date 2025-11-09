import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery
 * Получение мемов для галереи с пагинацией
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const posts = statsRepository.getPosts(limit, offset);
    const totalCount = statsRepository.getPostsCount();

    // Фильтруем только опубликованные посты с file_path
    const galleryPosts = posts.filter((post) => post.filePath && post.targetMessageId);

    logger.debug(
      {
        firstPostPath: galleryPosts[0]?.filePath,
        count: galleryPosts.length,
        page,
      },
      "Gallery posts fetched",
    );

    return NextResponse.json({
      posts: galleryPosts,
      hasMore: offset + limit < totalCount,
      page,
      total: totalCount,
    });
  }, "Failed to fetch gallery");
}
