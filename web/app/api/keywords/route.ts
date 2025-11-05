import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keywords = filterKeywordsRepository.getAll();
    return NextResponse.json(keywords);
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    filterKeywordsRepository.add(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding keyword:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add keyword" },
      { status: 500 }
    );
  }
}
