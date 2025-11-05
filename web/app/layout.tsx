import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Meme Stealer Admin",
  description: "Панель администрирования для Telegram бота",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Nav />
        <main className="container mx-auto p-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
