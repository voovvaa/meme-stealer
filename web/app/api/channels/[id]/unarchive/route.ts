import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    sourceChannelsRepository.unarchive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unarchiving channel:", error);
    return NextResponse.json(
      { error: "Failed to unarchive channel" },
      { status: 500 }
    );
  }
}
