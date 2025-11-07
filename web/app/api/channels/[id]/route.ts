import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";
import { SourceChannelUpdateSchema, IdParamSchema, validate } from "@meme-stealer/shared";

export const dynamic = "force-dynamic";

export async function PUT(
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
    const body = await request.json();

    // Validate update data
    const validation = validate(SourceChannelUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    sourceChannelsRepository.update(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update channel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Архивируем вместо удаления
    sourceChannelsRepository.archive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving channel:", error);
    return NextResponse.json(
      { error: "Failed to archive channel" },
      { status: 500 }
    );
  }
}
