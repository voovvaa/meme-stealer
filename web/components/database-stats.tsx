"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Calendar, TrendingUp } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";
import { REFRESH_INTERVALS } from "@/lib/constants";

type DatabaseStats = {
  status: string;
  sizeMB: number;
  totalMemes: number;
  publishedMemes: number;
  pendingMemes: number;
  firstMeme?: string;
  lastMeme?: string;
};

export function DatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setStats(data.database);
      } catch (error) {
        clientLogger.error({ component: "DatabaseStats", action: "loadStats" }, error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, REFRESH_INTERVALS.DATABASE_STATS);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Статистика базы данных</CardTitle>
        <CardDescription className="text-sm">Информация о хранилище мемов</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Размер БД</p>
              <p className="text-xl sm:text-2xl font-bold truncate">{stats.sizeMB} MB</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalMemes.toLocaleString()} записей
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Публикация</p>
              <p className="text-xl sm:text-2xl font-bold">
                {stats.totalMemes > 0
                  ? ((stats.publishedMemes / stats.totalMemes) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.publishedMemes} из {stats.totalMemes}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Период работы</p>
              <p className="text-sm font-semibold truncate">{formatDate(stats.firstMeme)}</p>
              <p className="text-xs text-muted-foreground truncate">до {formatDate(stats.lastMeme)}</p>
            </div>
          </div>
        </div>

        <div
          className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            stats.status === "healthy"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              stats.status === "healthy" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              stats.status === "healthy" ? "text-green-800" : "text-red-800"
            }`}
          >
            База данных {stats.status === "healthy" ? "работает нормально" : "недоступна"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
