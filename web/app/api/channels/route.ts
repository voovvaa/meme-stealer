import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sourceChannelsRepository } from "@/lib/repositories";
import { SourceChannelInputSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = sourceChannelsRepository.getAll();
    return NextResponse.json(channels);
  } catch (error) {
    logger.error({ err: error }, "Error fetching channels:");
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(SourceChannelInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    sourceChannelsRepository.add(validation.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error adding channel:");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add channel" },
      { status: 500 }
    );
  }
}
