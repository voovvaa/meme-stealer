"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";
import { REFRESH_INTERVALS } from "@/lib/constants";

type BotStatus = "running" | "error" | "checking";

export function BotStatus() {
  const [status, setStatus] = useState<BotStatus>("checking");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setStatus(data.database.status === "healthy" ? "running" : "error");
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, REFRESH_INTERVALS.BOT_STATUS);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case "running":
        return {
          icon: Activity,
          text: "Бот работает",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Бот недоступен",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-500",
        };
      case "checking":
        return {
          icon: RefreshCw,
          text: "Проверка статуса...",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-500 animate-spin",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      <Icon className={`h-4 w-4 ${config.iconColor}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
}
