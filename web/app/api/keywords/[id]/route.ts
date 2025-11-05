import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    filterKeywordsRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
