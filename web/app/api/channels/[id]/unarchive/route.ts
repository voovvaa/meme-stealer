import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const params = await props.params;
    const id = parseInt(params.id);
    sourceChannelsRepository.unarchive(id);
    return NextResponse.json({ success: true });
  }, "Failed to unarchive channel");
}
