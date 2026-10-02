"use client";

import { AnimatePresence, m } from "motion/react";
import MotionProvider from "@/components/ui/MotionProvider";

interface RollingScoreProps {
  value: number;
  /** Changes when the game changes, so a reset to 0 rolls instead of reading as a lost point. */
  game: number;
  className?: string;
}

/**
 * Broadcast-style score digit: the old value rolls up and out, the new one rolls in
 * with a court-green flash. Reduced motion: swaps instantly (MotionConfig).
 */
export default function RollingScore({ value, game, className = "" }: RollingScoreProps) {
  return (
    <MotionProvider>
      <span className={`relative inline-grid overflow-hidden ${className}`}>
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={`${game}-${value}`}
            className="col-start-1 row-start-1"
            initial={{ y: "70%", opacity: 0, color: "var(--color-court-green)" }}
            animate={{ y: "0%", opacity: 1, color: "var(--color-off-white)", transition: { y: { type: "spring", stiffness: 300, damping: 26 }, color: { duration: 0.9, delay: 0.15 } } }}
            exit={{ y: "-70%", opacity: 0, transition: { duration: 0.2 } }}
          >
            {value}
          </m.span>
        </AnimatePresence>
      </span>
    </MotionProvider>
  );
}
