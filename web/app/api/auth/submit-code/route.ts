import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Сохраняем код в файл
    const authFilePath = path.join(process.cwd(), "../sessions/auth_code.txt");
    await writeFile(authFilePath, code.trim(), "utf-8");

    console.log(`[Auth] Code saved to ${authFilePath}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving auth code:", error);
    return NextResponse.json(
      { error: "Failed to save code" },
      { status: 500 }
    );
  }
}
