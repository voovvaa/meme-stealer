"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useArchivableList } from "@/lib/hooks/useArchivableList";
import { ArchivableTable } from "@/components/archivable-table";
import type { SourceChannel } from "@/lib/types";
import { clientLogger } from "@/lib/client-logger";

export default function ChannelsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannel, setNewChannel] = useState({ channelId: "", channelName: "" });
  const { toast } = useToast();

  const {
    activeItems,
    archivedItems,
    loading,
    actionLoading,
    loadItems,
    toggleEnabled,
    archive,
    unarchive,
  } = useArchivableList<SourceChannel>({
    apiEndpoint: "/api/channels",
    entityName: "Канал",
    entityNamePlural: "каналы",
  });

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
        await loadItems();
        toast({
          title: "Успешно",
          description: "Канал добавлен",
        });
      } else {
        throw new Error("Failed to add channel");
      }
    } catch (error) {
      clientLogger.error({ component: "ChannelsPage", action: "addChannel" }, error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить канал",
        variant: "destructive",
      });
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
              <CardDescription>Управление каналами, из которых копируются мемы</CardDescription>
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
                  <label className="text-sm font-medium">Channel ID или Username *</label>
                  <Input
                    value={newChannel.channelId}
                    onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                    placeholder="-1001234567890 или @channel_username"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Numeric ID (например: -1001234567890) или username (например: @mishbekich)
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
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Добавление..." : "Добавить"}
                </Button>
              </div>
            </form>
          )}

          <ArchivableTable
            activeItems={activeItems}
            archivedItems={archivedItems}
            columns={[
              {
                header: "ID / Username",
                render: (channel) => <span className="font-mono text-sm">{channel.channelId}</span>,
              },
              {
                header: "Название",
                render: (channel) =>
                  channel.channelName || (
                    <span className="text-muted-foreground italic">Без названия</span>
                  ),
              },
              {
                header: "Добавлен",
                render: (channel) => (
                  <span className="text-sm text-muted-foreground">
                    {new Date(channel.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                ),
              },
            ]}
            onToggleEnabled={toggleEnabled}
            onArchive={archive}
            onUnarchive={unarchive}
            actionLoading={actionLoading}
            emptyMessage="Нет добавленных каналов"
          />
        </CardContent>
      </Card>
    </div>
  );
}
