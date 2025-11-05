"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type FilterKeyword = {
  id: number;
  keyword: string;
  enabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<FilterKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      if (!res.ok) throw new Error("Ошибка загрузки ключевых слов");
      const data = await res.json();
      setKeywords(data);
    } catch (error) {
      console.error("Failed to load keywords:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список ключевых слов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          enabled: true,
        }),
      });

      if (res.ok) {
        setNewKeyword("");
        setShowAddForm(false);
        await loadKeywords();
        toast({
          title: "Успешно",
          description: "Ключевое слово добавлено",
        });
      } else {
        throw new Error("Failed to add keyword");
      }
    } catch (error) {
      console.error("Failed to add keyword:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить ключевое слово",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEnabled = async (keyword: FilterKeyword) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/keywords/${keyword.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !keyword.enabled }),
      });

      if (res.ok) {
        await loadKeywords();
        toast({
          title: "Успешно",
          description: `Ключевое слово ${!keyword.enabled ? "включено" : "выключено"}`,
        });
      } else {
        throw new Error("Failed to toggle keyword");
      }
    } catch (error) {
      console.error("Failed to toggle keyword:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус ключевого слова",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveKeyword = async (id: number) => {
    if (!confirm("Вы уверены, что хотите архивировать это ключевое слово?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadKeywords();
        toast({
          title: "Успешно",
          description: "Ключевое слово архивировано",
        });
      } else {
        throw new Error("Failed to archive keyword");
      }
    } catch (error) {
      console.error("Failed to archive keyword:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать ключевое слово",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchiveKeyword = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/keywords/${id}/unarchive`, {
        method: "POST",
      });

      if (res.ok) {
        await loadKeywords();
        toast({
          title: "Успешно",
          description: "Ключевое слово восстановлено",
        });
      } else {
        throw new Error("Failed to unarchive keyword");
      }
    } catch (error) {
      console.error("Failed to unarchive keyword:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить ключевое слово",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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
              <CardTitle>Фильтры ключевых слов</CardTitle>
              <CardDescription>
                Управление ключевыми словами для фильтрации рекламы
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Отмена" : "Добавить слово"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleAddKeyword} className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ключевое слово *</label>
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="реклама"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Посты, содержащие это слово, будут отфильтрованы
                  </p>
                </div>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Добавление..." : "Добавить"}
                </Button>
              </div>
            </form>
          )}

          {/* Активные ключевые слова */}
          {(() => {
            const activeKeywords = keywords.filter((k) => !k.archived);
            const archivedKeywords = keywords.filter((k) => k.archived);

            return (
              <>
                {activeKeywords.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Нет добавленных ключевых слов
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ключевое слово</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Добавлено</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeKeywords.map((keyword) => (
                        <TableRow key={keyword.id}>
                          <TableCell className="font-medium">
                            {keyword.keyword}
                          </TableCell>
                          <TableCell>
                            <Badge variant={keyword.enabled ? "default" : "secondary"}>
                              {keyword.enabled ? "Включен" : "Выключен"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(keyword.createdAt).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleEnabled(keyword)}
                              disabled={actionLoading}
                            >
                              {keyword.enabled ? "Выключить" : "Включить"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleArchiveKeyword(keyword.id)}
                              disabled={actionLoading}
                            >
                              Архивировать
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Архив */}
                {archivedKeywords.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Архив</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ключевое слово</TableHead>
                          <TableHead>Архивировано</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedKeywords.map((keyword) => (
                          <TableRow key={keyword.id} className="opacity-60">
                            <TableCell className="font-medium">
                              {keyword.keyword}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(keyword.updatedAt).toLocaleDateString("ru-RU")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnarchiveKeyword(keyword.id)}
                                disabled={actionLoading}
                              >
                                Восстановить
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
