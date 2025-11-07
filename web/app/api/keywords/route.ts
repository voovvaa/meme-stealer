import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { filterKeywordsRepository } from "@/lib/repositories";
import { FilterKeywordInputSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keywords = filterKeywordsRepository.getAll();
    return NextResponse.json(keywords);
  } catch (error) {
    logger.error({ err: error }, "Error fetching keywords:");
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(FilterKeywordInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    filterKeywordsRepository.add(validation.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error adding keyword:");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add keyword" },
      { status: 500 }
    );
  }
}
