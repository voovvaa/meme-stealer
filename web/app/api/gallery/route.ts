import { NextResponse } from "next/server";
import { statsRepository } from "@/lib/repositories";
import { GalleryPaginationSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/gallery
 * Получение мемов для галереи с пагинацией
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    const validation = validate(GalleryPaginationSchema as any, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    const { page, limit } = validation.data as { page: number; limit: number; };
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
