import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sourceChannelsRepository } from "@/lib/repositories";
import { IdParamSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;

    // Validate ID parameter
    const idValidation = validate(IdParamSchema as any, { id: params.id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: idValidation.error,
          details: idValidation.details
        },
        { status: 400 }
      );
    }

    const id = (idValidation.data as { id: number }).id;
    sourceChannelsRepository.unarchive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error unarchiving channel:");
    return NextResponse.json(
      { error: "Failed to unarchive channel" },
      { status: 500 }
    );
  }
}
