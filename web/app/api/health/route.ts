import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();

    // Проверяем доступность БД
    const dbStatus = db.prepare("SELECT 1").get();

    // Размер БД
    const dbPath = process.env.MEME_DB_PATH || path.join(process.cwd(), "../sessions/memes.sqlite");
    let dbSizeMB = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
    } catch (err) {
      logger.error({ err }, "Failed to get DB size");
    }

    // Статистика по мемам
    const totalMemes = db.prepare("SELECT COUNT(*) as count FROM memes").get() as { count: number };
    const publishedMemes = db.prepare("SELECT COUNT(*) as count FROM memes WHERE target_message_id IS NOT NULL").get() as { count: number };

    // Первый и последний мем
    const firstMeme = db.prepare("SELECT created_at FROM memes ORDER BY created_at ASC LIMIT 1").get() as { created_at: string } | undefined;
    const lastMeme = db.prepare("SELECT created_at FROM memes ORDER BY created_at DESC LIMIT 1").get() as { created_at: string } | undefined;

    return NextResponse.json({
      database: {
        status: dbStatus ? "healthy" : "error",
        sizeMB: dbSizeMB,
        totalMemes: totalMemes.count,
        publishedMemes: publishedMemes.count,
        pendingMemes: totalMemes.count - publishedMemes.count,
        firstMeme: firstMeme?.created_at,
        lastMeme: lastMeme?.created_at,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching health");
    return NextResponse.json(
      { error: "Failed to fetch health status" },
      { status: 500 }
    );
  }
}
