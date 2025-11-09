import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const channels = sourceChannelsRepository.getAll();
    return NextResponse.json(channels);
  }, "Failed to fetch channels");
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    sourceChannelsRepository.add(body);
    return NextResponse.json({ success: true }, { status: 201 });
  }, "Failed to add channel");
}
