"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
            Meme Stealer Admin
          </Link>
          {!isHome && (
            <Link
              href="/"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                "text-muted-foreground"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
