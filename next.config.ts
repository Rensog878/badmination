import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build/test run alongside `next dev` (which owns .next).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
