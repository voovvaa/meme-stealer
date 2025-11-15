import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'dockerode'],
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        dockerode: false,
        'better-sqlite3': false,
      };
    }
    return config;
  },
};

export default nextConfig;
