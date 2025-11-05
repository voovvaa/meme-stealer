import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);
    filterKeywordsRepository.unarchive(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unarchiving keyword:", error);
    return NextResponse.json(
      { error: "Failed to unarchive keyword" },
      { status: 500 }
    );
  }
}
