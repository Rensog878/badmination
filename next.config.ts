import type { NextConfig } from "next";

export default function (phase: string): NextConfig {
  process.env.NEXT_PHASE = phase;
  return {
    // Lets a production build/test run alongside `next dev` (which owns .next).
    distDir: process.env.NEXT_DIST_DIR ?? ".next",
    // Dev only: allow testing on phones over the local network (e.g. http://10.49.70.79:3000).
    allowedDevOrigins: ["10.49.70.79", "192.168.*.*", "10.*.*.*"],
  };
}
