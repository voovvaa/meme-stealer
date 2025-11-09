import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const params = await props.params;
    const id = parseInt(params.id);
    const body = await request.json();
    sourceChannelsRepository.update(id, body);
    return NextResponse.json({ success: true });
  }, "Failed to update channel");
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const params = await props.params;
    const id = parseInt(params.id);

    // Архивируем вместо удаления
    sourceChannelsRepository.archive(id);
    return NextResponse.json({ success: true });
  }, "Failed to archive channel");
}
