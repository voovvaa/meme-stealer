"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Settings, List, Hash, Clock } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Каналы", href: "/channels", icon: List },
  { name: "Ключевые слова", href: "/keywords", icon: Hash },
  { name: "Настройки", href: "/settings", icon: Settings },
  { name: "История", href: "/history", icon: Clock },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-8">
          <Link href="/" className="text-xl font-bold">
            Meme Stealer Admin
          </Link>
          <div className="flex space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
