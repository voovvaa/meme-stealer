import { NextResponse } from "next/server";
import { filterKeywordsRepository } from "@/lib/repositories";
import { withErrorHandling } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const keywords = filterKeywordsRepository.getAll();
    return NextResponse.json(keywords);
  }, "Failed to fetch keywords");
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = await request.json();
    filterKeywordsRepository.add(body);
    return NextResponse.json({ success: true }, { status: 201 });
  }, "Failed to add keyword");
}
