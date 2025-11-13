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

    // Фильтруем только опубликованные посты с file_path на уровне SQL
    const posts = statsRepository.getPosts(limit, offset, true);
    const totalCount = statsRepository.getPostsCount(true);

    logger.debug(
      {
        firstPostPath: posts[0]?.filePath,
        count: posts.length,
        page,
      },
      "Gallery posts fetched",
    );

    return NextResponse.json({
      posts,
      hasMore: offset + limit < totalCount,
      page,
      total: totalCount,
    });
  }, "Failed to fetch gallery");
}
