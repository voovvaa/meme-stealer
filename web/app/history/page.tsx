"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Post = {
  id: number;
  hash: string;
  sourceChannelId: string;
  sourceMessageId: number;
  targetMessageId: number | null;
  createdAt: string;
};

type PostsResponse = {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
};

export default function HistoryPage() {
  const [data, setData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  const loadPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * limit;
      const res = await fetch(`/api/posts?limit=${limit}&offset=${offset}`);
      const data = await res.json();
      setData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(page);
  }, [page]);

  if (loading && !data) {
    return <div className="p-8">Загрузка...</div>;
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const posts = data?.posts || [];

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>История постов</CardTitle>
          <CardDescription>
            Всего обработано постов: {data?.total || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет обработанных постов
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Канал-источник</TableHead>
                    <TableHead>ID сообщения</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата обработки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-mono text-sm">
                        {post.id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {post.sourceChannelId}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {post.sourceMessageId}
                      </TableCell>
                      <TableCell>
                        {post.targetMessageId ? (
                          <Badge variant="default">Опубликован #{post.targetMessageId}</Badge>
                        ) : (
                          <Badge variant="secondary">В очереди</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString("ru-RU")}
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
