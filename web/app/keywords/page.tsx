"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useArchivableList } from "@/lib/hooks/useArchivableList";
import { ArchivableTable } from "@/components/archivable-table";
import type { FilterKeyword } from "@/lib/types";

export default function KeywordsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
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
  } = useArchivableList<FilterKeyword>({
    apiEndpoint: "/api/keywords",
    entityName: "Ключевое слово",
    entityNamePlural: "ключевые слова",
  });

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

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
        await loadItems();
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

          <ArchivableTable
            activeItems={activeItems}
            archivedItems={archivedItems}
            columns={[
              {
                header: "Ключевое слово",
                render: (keyword) => (
                  <span className="font-medium">{keyword.keyword}</span>
                ),
              },
              {
                header: "Добавлено",
                render: (keyword) => (
                  <span className="text-sm text-muted-foreground">
                    {new Date(keyword.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                ),
              },
            ]}
            onToggleEnabled={toggleEnabled}
            onArchive={archive}
            onUnarchive={unarchive}
            actionLoading={actionLoading}
            emptyMessage="Нет добавленных ключевых слов"
          />
        </CardContent>
      </Card>
    </div>
  );
}
