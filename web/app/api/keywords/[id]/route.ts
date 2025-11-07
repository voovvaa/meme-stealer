import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";
import { FilterKeywordUpdateSchema, IdParamSchema, validate } from "@meme-stealer/shared";

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
    const validation = validate(FilterKeywordUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    filterKeywordsRepository.update(id, validation.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating keyword:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update keyword" },
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
    filterKeywordsRepository.archive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error archiving keyword:", error);
    return NextResponse.json(
      { error: "Failed to archive keyword" },
      { status: 500 }
    );
  }
}
