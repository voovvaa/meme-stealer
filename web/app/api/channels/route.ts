import { NextResponse } from "next/server";
import { sourceChannelsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = sourceChannelsRepository.getAll();
    return NextResponse.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    sourceChannelsRepository.add(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding channel:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add channel" },
      { status: 500 }
    );
  }
}
