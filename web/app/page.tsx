"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, CheckCircle2, Clock } from "lucide-react";
import { ChannelActivityChart } from "@/components/charts/channel-activity-chart";
import { PublicationsTimelineChart } from "@/components/charts/publications-timeline-chart";
import { BotStatus } from "@/components/bot-status";
import { DatabaseStats } from "@/components/database-stats";
import { clientLogger } from "@/lib/client-logger";

type Stats = {
  total: number;
  totalPublished: number;
  pending: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        clientLogger.error({ component: "Dashboard", action: "fetchStats" }, err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Обзор статистики работы бота</p>
        </div>
        <BotStatus />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего постов</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Обработано с начала работы</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Опубликовано</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPublished || 0}</div>
            <p className="text-xs text-muted-foreground">Отправлено в целевой канал</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В очереди</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Ожидают публикации</p>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <div className="grid gap-4 md:grid-cols-2">
        <PublicationsTimelineChart />
        <ChannelActivityChart />
      </div>

      {/* Статистика БД */}
      <DatabaseStats />

      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>Управление конфигурацией бота</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/channels">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Управление каналами</CardTitle>
                  <CardDescription>Добавление и настройка отслеживаемых каналов</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/keywords">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Фильтры</CardTitle>
                  <CardDescription>Настройка ключевых слов для фильтрации</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Настройки времени</CardTitle>
                  <CardDescription>Интервалы публикации постов</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/history">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">История</CardTitle>
                  <CardDescription>Просмотр опубликованных постов</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
