import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'dockerode'],
  output: 'standalone',
};

export default nextConfig;
