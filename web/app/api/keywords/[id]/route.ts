import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const body = await request.json();
    filterKeywordsRepository.update(id, body);
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
    const id = parseInt(params.id);

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
