import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next-dev',
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    scrollRestoration: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1']
};

export default nextConfig;
