"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { clientLogger } from "@/lib/client-logger";
import { PAGINATION } from "@/lib/constants";
import { Trash2 } from "lucide-react";

type QueueItem = {
  id: number;
  sourceChannelId: string;
  sourceMessageId: number;
  status: string;
  scheduledAt: string;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
};

type QueueResponse = {
  queuedPosts: QueueItem[];
  total: number;
  limit: number;
  offset: number;
};

export default function QueuePage() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const loadQueuedPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * limit;
      const res = await fetch(`/api/queue?limit=${limit}&offset=${offset}`);
      const data = await res.json();
      setData(data);
    } catch (error) {
      clientLogger.error({ component: "QueuePage", action: "loadQueuedPosts" }, error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQueueItem = async (id: number) => {
    if (!confirm("Удалить эту отложенную запись? Она не будет опубликована.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete queue item");
      }

      // Перезагружаем текущую страницу
      await loadQueuedPosts(page);
    } catch (error) {
      clientLogger.error({ component: "QueuePage", action: "deleteQueueItem" }, error);
      alert("Ошибка при удалении записи");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadQueuedPosts(page);
  }, [page]);

  if (loading && !data) {
    return <div className="p-8">Загрузка...</div>;
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const queuedPosts = data?.queuedPosts || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU");
  };

  const getTimeUntil = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) {
      return "Готов к публикации";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `через ${days} д ${hours % 24} ч`;
    }

    if (hours > 0) {
      return `через ${hours} ч ${minutes} мин`;
    }

    return `через ${minutes} мин`;
  };

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Отложенные записи</CardTitle>
          <CardDescription>Всего в очереди: {data?.total || 0}</CardDescription>
        </CardHeader>
        <CardContent>
          {queuedPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет отложенных записей</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Превью</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Канал-источник</TableHead>
                    <TableHead>ID сообщения</TableHead>
                    <TableHead>Время публикации</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queuedPosts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={`/api/queue/${item.id}/preview`}
                          alt={`Preview ${item.id}`}
                          className="w-16 h-16 object-cover rounded"
                          loading="lazy"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.id}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sourceChannelId}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sourceMessageId}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">
                            {formatDate(item.scheduledAt)}
                          </span>
                          <Badge variant="outline" className="w-fit">
                            {getTimeUntil(item.scheduledAt)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQueueItem(item.id)}
                          disabled={deletingId === item.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Страница {page} из {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1 || loading}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages || loading}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
