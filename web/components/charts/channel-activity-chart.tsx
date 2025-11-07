"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChannelStat = {
  channelId: string;
  channelName: string | null;
  count: number;
  name?: string;
};

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
];

// Кастомный tooltip для показа человекочитаемых имен
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ChannelStat;
  const displayName = data.channelName || data.channelId;

  return (
    <div className="bg-background border border-border rounded-md p-3 shadow-lg">
      <p className="font-medium text-foreground mb-1">{displayName}</p>
      <p className="text-sm text-muted-foreground">
        Постов: <span className="font-semibold text-foreground">{data.count}</span>
      </p>
    </div>
  );
};

export function ChannelActivityChart() {
  const [data, setData] = useState<ChannelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/channels")
      .then((res) => res.json())
      .then((stats) => {
        // Добавляем читаемое имя для отображения
        const formattedData = stats.map((stat: ChannelStat) => ({
          ...stat,
          name: stat.channelName || stat.channelId.substring(0, 15) + "...",
        }));
        setData(formattedData);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Активность по каналам</CardTitle>
          <CardDescription>Топ-10 каналов по количеству постов</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Активность по каналам</CardTitle>
          <CardDescription>Топ-10 каналов по количеству постов</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Нет данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Активность по каналам</CardTitle>
        <CardDescription>Топ-10 каналов по количеству постов</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
