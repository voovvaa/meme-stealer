"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код авторизации",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/submit-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        toast({
          title: "Успешно",
          description: "Код отправлен боту. Перенаправление...",
        });

        // Редирект на дашборд через 1 секунду
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        throw new Error("Failed to submit code");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить код",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Авторизация Telegram</CardTitle>
          <CardDescription>
            Бот запрашивает код подтверждения для авторизации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Проверьте логи бота:</p>
              <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">
                docker-compose logs -f meme-stealer-bot
              </code>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Код из Telegram
              </label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="12345"
                maxLength={10}
                required
                className="text-center text-2xl font-mono tracking-wider"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Введите код из SMS или сообщения Telegram
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Отправка..." : "Отправить код"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">После ввода кода:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Бот автоматически продолжит авторизацию</li>
                  <li>Проверьте логи для подтверждения</li>
                  <li>После авторизации перейдите на Dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
