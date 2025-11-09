import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { ArchivableEntity } from "../types";
import { clientLogger } from "../client-logger";

interface UseArchivableListOptions<T extends ArchivableEntity> {
  apiEndpoint: string;
  entityName: string; // "канал" или "ключевое слово"
  entityNamePlural: string; // "каналы" или "ключевые слова"
}

interface UseArchivableListResult<T> {
  items: T[];
  activeItems: T[];
  archivedItems: T[];
  loading: boolean;
  actionLoading: boolean;
  loadItems: () => Promise<void>;
  toggleEnabled: (item: T) => Promise<void>;
  archive: (id: number) => Promise<void>;
  unarchive: (id: number) => Promise<void>;
}

export function useArchivableList<T extends ArchivableEntity>({
  apiEndpoint,
  entityName,
  entityNamePlural,
}: UseArchivableListOptions<T>): UseArchivableListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadItems = async () => {
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error(`Ошибка загрузки ${entityNamePlural}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      clientLogger.error(
        { component: "useArchivableList", action: "loadItems", entityNamePlural },
        error,
      );
      toast({
        title: "Ошибка",
        description: `Не удалось загрузить список ${entityNamePlural}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleEnabled = async (item: T) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled }),
      });

      if (res.ok) {
        await loadItems();
        toast({
          title: "Успешно",
          description: `${entityName} ${!item.enabled ? "включен" : "выключен"}`,
        });
      } else {
        throw new Error("Failed to toggle");
      }
    } catch (error) {
      clientLogger.error({ component: "useArchivableList", action: "toggleEnabled" }, error);
      toast({
        title: "Ошибка",
        description: `Не удалось изменить статус ${entityNamePlural}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const archive = async (id: number) => {
    if (!confirm(`Вы уверены, что хотите архивировать ${entityName}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadItems();
        toast({
          title: "Успешно",
          description: `${entityName} архивирован`,
        });
      } else {
        throw new Error("Failed to archive");
      }
    } catch (error) {
      clientLogger.error({ component: "useArchivableList", action: "archive" }, error);
      toast({
        title: "Ошибка",
        description: `Не удалось архивировать ${entityName}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const unarchive = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiEndpoint}/${id}/unarchive`, {
        method: "POST",
      });

      if (res.ok) {
        await loadItems();
        toast({
          title: "Успешно",
          description: `${entityName} восстановлен`,
        });
      } else {
        throw new Error("Failed to unarchive");
      }
    } catch (error) {
      clientLogger.error({ component: "useArchivableList", action: "unarchive" }, error);
      toast({
        title: "Ошибка",
        description: `Не удалось восстановить ${entityName}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const activeItems = items.filter((item) => !item.archived);
  const archivedItems = items.filter((item) => item.archived);

  return {
    items,
    activeItems,
    archivedItems,
    loading,
    actionLoading,
    loadItems,
    toggleEnabled,
    archive,
    unarchive,
  };
}
