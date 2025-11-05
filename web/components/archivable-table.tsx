import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ArchivableEntity } from "@/lib/types";

interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface ArchivableTableProps<T extends ArchivableEntity> {
  activeItems: T[];
  archivedItems: T[];
  columns: Column<T>[];
  onToggleEnabled: (item: T) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  actionLoading: boolean;
  emptyMessage: string;
}

export function ArchivableTable<T extends ArchivableEntity>({
  activeItems,
  archivedItems,
  columns,
  onToggleEnabled,
  onArchive,
  onUnarchive,
  actionLoading,
  emptyMessage,
}: ArchivableTableProps<T>) {
  if (activeItems.length === 0 && archivedItems.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Активные элементы */}
      {activeItems.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeItems.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col, idx) => (
                  <TableCell key={idx} className={col.className}>
                    {col.render(item)}
                  </TableCell>
                ))}
                <TableCell>
                  <Badge variant={item.enabled ? "default" : "secondary"}>
                    {item.enabled ? "Включен" : "Выключен"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleEnabled(item)}
                    disabled={actionLoading}
                  >
                    {item.enabled ? "Выключить" : "Включить"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onArchive(item.id)}
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
      {archivedItems.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Архив</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableHead key={idx} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                <TableHead>Архивирован</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedItems.map((item) => (
                <TableRow key={item.id} className="opacity-60">
                  {columns.map((col, idx) => (
                    <TableCell key={idx} className={col.className}>
                      {col.render(item)}
                    </TableCell>
                  ))}
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnarchive(item.id)}
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
}
