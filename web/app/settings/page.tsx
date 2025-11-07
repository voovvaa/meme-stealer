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

    setSaving(true);

    try {
      // Используем POST для создания и PUT для обновления
      const method = config ? "PUT" : "POST";
      const res = await fetch("/api/config", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiId: currentConfig.apiId,
          apiHash: currentConfig.apiHash,
          phoneNumber: currentConfig.phoneNumber,
          telegramPassword: currentConfig.telegramPassword || null,
          targetChannelId: currentConfig.targetChannelId,
          enableQueue: currentConfig.enableQueue,
          publishIntervalMin: currentConfig.publishIntervalMin,
          publishIntervalMax: currentConfig.publishIntervalMax,
        }),
      });

      if (res.ok) {
        const savedConfig = await res.json();
        setConfig(savedConfig);
        toast({
          title: "Успешно",
          description: config
            ? "Настройки сохранены! Конфигурация будет перезагружена автоматически."
            : "Конфигурация создана! Перезапустите бота для применения изменений.",
        });
      } else {
        throw new Error("Failed to save config");
      }
    } catch (error) {
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

  // Если конфига нет, создаем пустой объект для первоначальной настройки
  const currentConfig = config || {
    id: 1,
    apiId: 0,
    apiHash: "",
    phoneNumber: "",
    telegramPassword: null,
    targetChannelId: "",
    enableQueue: true,
    publishIntervalMin: 60,
    publishIntervalMax: 300,
    needsReload: false,
    updatedAt: new Date().toISOString(),
  };

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
                  value={currentConfig.apiId}
                  onChange={(e) => setConfig({ ...currentConfig, apiId: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">API Hash *</label>
                <Input
                  type="text"
                  value={currentConfig.apiHash}
                  onChange={(e) => setConfig({ ...currentConfig, apiHash: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Номер телефона *</label>
                <Input
                  type="text"
                  value={currentConfig.phoneNumber}
                  onChange={(e) => setConfig({ ...currentConfig, phoneNumber: e.target.value })}
                  placeholder="+79991234567"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Пароль 2FA (опционально)</label>
                <Input
                  type="password"
                  value={currentConfig.telegramPassword || ""}
                  onChange={(e) => setConfig({ ...currentConfig, telegramPassword: e.target.value || null })}
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
                  value={currentConfig.targetChannelId}
                  onChange={(e) => setConfig({ ...currentConfig, targetChannelId: e.target.value })}
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
                  checked={currentConfig.enableQueue}
                  onChange={(e) => setConfig({ ...currentConfig, enableQueue: e.target.checked })}
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
                  value={currentConfig.publishIntervalMin}
                  onChange={(e) => setConfig({ ...currentConfig, publishIntervalMin: parseInt(e.target.value) || 60 })}
                  min="10"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Максимальный интервал (секунды) *</label>
                <Input
                  type="number"
                  value={currentConfig.publishIntervalMax}
                  onChange={(e) => setConfig({ ...currentConfig, publishIntervalMax: parseInt(e.target.value) || 300 })}
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
