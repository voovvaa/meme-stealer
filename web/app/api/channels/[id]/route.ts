import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    const body = await request.json();
    sourceChannelsRepository.update(id, body);
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
    const id = parseInt(params.id);
    sourceChannelsRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    );
  }
}
