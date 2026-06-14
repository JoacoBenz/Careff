import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Turbopack only watches/compiles
  // these files — without it, a stray lockfile in a parent folder can make it
  // treat the parent directory as root and watch far more than it should
  // (runaway dev CPU/RAM on Windows).
  turbopack: {
    root: path.resolve('.'),
  },
  // output: 'standalone', // uncomment for slimmer Docker images
};

export default nextConfig;
