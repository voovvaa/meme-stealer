import { NextResponse } from "next/server";
import { configRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const config = configRepository.getConfig();
    if (!config) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }
    return NextResponse.json(config);
  }, "Failed to fetch config");
}

export async function PUT(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    configRepository.saveConfig(body);
    const savedConfig = configRepository.getConfig();
    return NextResponse.json(savedConfig);
  }, "Failed to save config");
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    configRepository.saveConfig(body);
    const savedConfig = configRepository.getConfig();
    return NextResponse.json(savedConfig);
  }, "Failed to create config");
}
