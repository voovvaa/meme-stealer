import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { configRepository } from "@/lib/repositories";
import type { ConfigInput } from "@/lib/repositories";
import { ConfigInputSchema, validate } from "@meme-stealer/shared";

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
    logger.error({ err: error }, "Error fetching config:");
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(ConfigInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    configRepository.saveConfig(validation.data as ConfigInput);
    const savedConfig = configRepository.getConfig();
    return NextResponse.json(savedConfig);
  } catch (error) {
    logger.error({ err: error }, "Error saving config:");
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(ConfigInputSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          details: validation.details
        },
        { status: 400 }
      );
    }

    configRepository.saveConfig(validation.data as ConfigInput);
    const savedConfig = configRepository.getConfig();
    return NextResponse.json(savedConfig);
  } catch (error) {
    logger.error({ err: error }, "Error creating config:");
    return NextResponse.json(
      { error: "Failed to create config" },
      { status: 500 }
    );
  }
}
