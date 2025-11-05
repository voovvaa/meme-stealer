import { NextResponse } from "next/server";
import { configRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = configRepository.getConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    configRepository.saveConfig(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}
