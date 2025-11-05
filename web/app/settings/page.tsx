"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type Config = {
  id: 1;
  apiId: number;
  apiHash: string;
  phoneNumber: string;
  telegramPassword: string | null;
  targetChannelId: string;
  enableQueue: boolean;
  publishIntervalMin: number;
  publishIntervalMax: number;
  needsReload: boolean;
  updatedAt: string;
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Ошибка загрузки конфигурации");
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load config:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить конфигурацию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId: config.apiId,
          apiHash: config.apiHash,
          phoneNumber: config.phoneNumber,
          telegramPassword: config.telegramPassword || null,
          targetChannelId: config.targetChannelId,
          enableQueue: config.enableQueue,
          publishIntervalMin: config.publishIntervalMin,
          publishIntervalMax: config.publishIntervalMax,
        }),
      });

      if (res.ok) {
        toast({
          title: "Успешно",
          description: "Настройки сохранены! Конфигурация будет перезагружена автоматически.",
        });
      } else {
        throw new Error("Failed to save config");
      }
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Загрузка...</div>;
  }

  if (!config) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Конфигурация не найдена. Выполните миграцию: npm run migrate-config
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Настройки бота</CardTitle>
            <CardDescription>
              Конфигурация Telegram бота и параметров публикации
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Telegram API Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Telegram API</h3>
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                ⚠️ Изменение API_ID, API_HASH или PHONE_NUMBER требует перезапуска контейнера
              </p>

              <div>
                <label className="text-sm font-medium">API ID *</label>
                <Input
                  type="number"
                  value={config.apiId}
                  onChange={(e) => setConfig({ ...config, apiId: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">API Hash *</label>
                <Input
                  type="text"
                  value={config.apiHash}
                  onChange={(e) => setConfig({ ...config, apiHash: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Номер телефона *</label>
                <Input
                  type="text"
                  value={config.phoneNumber}
                  onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                  placeholder="+79991234567"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Пароль 2FA (опционально)</label>
                <Input
                  type="password"
                  value={config.telegramPassword || ""}
                  onChange={(e) => setConfig({ ...config, telegramPassword: e.target.value || null })}
                  placeholder="Если включена двухфакторная аутентификация"
                />
              </div>
            </div>

            {/* Target Channel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Целевой канал</h3>

              <div>
                <label className="text-sm font-medium">ID или Username целевого канала *</label>
                <Input
                  type="text"
                  value={config.targetChannelId}
                  onChange={(e) => setConfig({ ...config, targetChannelId: e.target.value })}
                  placeholder="-1001234567890 или @my_channel"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Канал, куда будут публиковаться мемы (numeric ID или username)
                </p>
              </div>
            </div>

            {/* Publishing Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Параметры публикации</h3>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableQueue"
                  checked={config.enableQueue}
                  onChange={(e) => setConfig({ ...config, enableQueue: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enableQueue" className="text-sm font-medium cursor-pointer">
                  Включить очередь публикаций
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Если выключено, посты будут публиковаться сразу
              </p>

              <div>
                <label className="text-sm font-medium">Минимальный интервал (секунды) *</label>
                <Input
                  type="number"
                  value={config.publishIntervalMin}
                  onChange={(e) => setConfig({ ...config, publishIntervalMin: parseInt(e.target.value) || 60 })}
                  min="10"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Максимальный интервал (секунды) *</label>
                <Input
                  type="number"
                  value={config.publishIntervalMax}
                  onChange={(e) => setConfig({ ...config, publishIntervalMax: parseInt(e.target.value) || 300 })}
                  min="10"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить настройки"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
