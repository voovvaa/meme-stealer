"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SourceChannel = {
  id: number;
  channelId: string;
  channelName: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<SourceChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannel, setNewChannel] = useState({ channelId: "", channelName: "" });

  const loadChannels = async () => {
    try {
      const res = await fetch("/api/channels");
      const data = await res.json();
      setChannels(data);
    } catch (error) {
      console.error("Failed to load channels:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.channelId.trim()) return;

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: newChannel.channelId.trim(),
          channelName: newChannel.channelName.trim() || undefined,
          enabled: true,
        }),
      });

      if (res.ok) {
        setNewChannel({ channelId: "", channelName: "" });
        setShowAddForm(false);
        loadChannels();
      }
    } catch (error) {
      console.error("Failed to add channel:", error);
    }
  };

  const handleToggleEnabled = async (channel: SourceChannel) => {
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !channel.enabled }),
      });

      if (res.ok) {
        loadChannels();
      }
    } catch (error) {
      console.error("Failed to toggle channel:", error);
    }
  };

  const handleDeleteChannel = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот канал?")) return;

    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadChannels();
      }
    } catch (error) {
      console.error("Failed to delete channel:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Каналы-источники</CardTitle>
              <CardDescription>
                Управление каналами, из которых копируются мемы
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Отмена" : "Добавить канал"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleAddChannel} className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Channel ID *</label>
                  <Input
                    value={newChannel.channelId}
                    onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                    placeholder="-1001234567890"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID канала с минусом и префиксом -100 (например: -1001234567890)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Название (опционально)</label>
                  <Input
                    value={newChannel.channelName}
                    onChange={(e) => setNewChannel({ ...newChannel, channelName: e.target.value })}
                    placeholder="Мой канал"
                  />
                </div>
                <Button type="submit">Добавить</Button>
              </div>
            </form>
          )}

          {channels.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет добавленных каналов
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-mono text-sm">
                      {channel.channelId}
                    </TableCell>
                    <TableCell>
                      {channel.channelName || (
                        <span className="text-muted-foreground italic">Без названия</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={channel.enabled ? "default" : "secondary"}>
                        {channel.enabled ? "Включен" : "Выключен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(channel.createdAt).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleEnabled(channel)}
                      >
                        {channel.enabled ? "Выключить" : "Включить"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
