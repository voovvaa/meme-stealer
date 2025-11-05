import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Разрешаем серверные компоненты использовать внешние пакеты
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  output: 'standalone',
};

export default nextConfig;
