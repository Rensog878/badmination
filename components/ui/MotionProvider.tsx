"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("@/lib/motionFeatures").then((mod) => mod.default);

/**
 * Wrap a client island that uses `m.*` components. Features load lazily (until then
 * elements render statically), and the OS reduced-motion setting is honoured.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 420, damping: 36 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
