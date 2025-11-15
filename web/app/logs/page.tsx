"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { clientLogger } from "@/lib/client-logger";
import { Play, Square, RotateCw, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

type DockerStatus = {
  available: boolean;
  id?: string;
  name?: string;
  state?: string;
  running?: boolean;
  startedAt?: string;
  restartCount?: number;
  error?: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<DockerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/docker/status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      clientLogger.error({ component: "LogsPage", action: "fetchStatus" }, error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/docker/logs?tail=200");
      if (res.ok) {
        const data = await res.json();
        // Logs are in natural order (oldest first, newest last)
        setLogs(data.logs || []);
      }
    } catch (error) {
      clientLogger.error({ component: "LogsPage", action: "fetchLogs" }, error);
    } finally {
      setLoading(false);
    }
  };

  const handleControl = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    try {
      const res = await fetch("/api/docker/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "Успешно",
          description: data.message,
        });
        // Refresh status and logs after action
        setTimeout(() => {
          fetchStatus();
          fetchLogs();
        }, 1000);
      } else {
        toast({
          title: "Ошибка",
          description: data.message || data.error || "Не удалось выполнить действие",
          variant: "destructive",
        });
      }
    } catch (error) {
      clientLogger.error({ component: "LogsPage", action: "handleControl", controlAction: action }, error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Логи бота</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Просмотр логов и управление Docker контейнером
          </p>
        </div>
      </div>

      {/* Container Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Статус контейнера
            {status?.running ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>Информация о Docker контейнере бота</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.available ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                ⚠️ Docker недоступен. Убедитесь, что Docker socket примонтирован к веб-контейнеру.
              </p>
              {status?.error && <p className="text-xs text-red-500 mt-2">{status.error}</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Состояние</p>
                  <p className="font-medium">{status.state || "unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Container ID</p>
                  <p className="font-mono text-sm">{status.id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Перезапуски</p>
                  <p className="font-medium">{status.restartCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Запущен</p>
                  <p className="text-sm">
                    {status.startedAt
                      ? new Date(status.startedAt).toLocaleString("ru-RU")
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => handleControl("start")}
                  disabled={status.running || actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {actionLoading === "start" ? "Запуск..." : "Start"}
                </Button>
                <Button
                  onClick={() => handleControl("stop")}
                  disabled={!status.running || actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {actionLoading === "stop" ? "Остановка..." : "Stop"}
                </Button>
                <Button
                  onClick={() => handleControl("restart")}
                  disabled={actionLoading !== null}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {actionLoading === "restart" ? "Перезапуск..." : "Restart"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Логи контейнера</CardTitle>
              <CardDescription>Последние 200 строк логов (обновление каждые 5 секунд)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
                variant={autoRefresh ? "default" : "outline"}
                className="min-h-[44px]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Авто-обновление" : "Обновление выкл"}
              </Button>
              <Button
                onClick={() => {
                  fetchLogs();
                  fetchStatus();
                }}
                size="sm"
                variant="outline"
                className="min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono text-xs sm:text-sm p-4 rounded-lg h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Логи отсутствуют или контейнер не запущен</p>
            ) : (
              logs.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
