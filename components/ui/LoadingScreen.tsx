"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import CourtLines from "@/components/ui/CourtLines";

const FILL_DURATION_MS = 600; // keep in sync with duration-[600ms] below
const FADE_DURATION_MS = 700;

interface LoadingScreenProps {
  /** True once the scene has rendered its first frames. */
  sceneReady: boolean;
  reducedMotion: boolean;
}

/**
 * Black overlay while the 3D scene prepares. Progress is real: drei's loader
 * progress for network assets, and 100% only once the scene has actually rendered.
 * The procedural racket loads nothing, so it goes straight from waiting to ready.
 */
export default function LoadingScreen({ sceneReady, reducedMotion }: LoadingScreenProps) {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  const percent = sceneReady ? 100 : active ? Math.min(progress, 95) : 0;
  const fillMs = reducedMotion ? 0 : FILL_DURATION_MS;
  const fadeMs = reducedMotion ? 0 : FADE_DURATION_MS;

  useEffect(() => {
    if (!sceneReady) return;
    const hideTimer = window.setTimeout(() => setHidden(true), fillMs);
    const removeTimer = window.setTimeout(() => setRemoved(true), fillMs + fadeMs);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [sceneReady, fillMs, fadeMs]);

  if (removed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!sceneReady}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-black px-4 transition-opacity ease-out"
      style={{ opacity: hidden ? 0 : 1, transitionDuration: `${fadeMs}ms`, pointerEvents: hidden ? "none" : "auto" }}
    >
      <div className="relative w-[min(22rem,80vw)]">
        <CourtLines className="w-full text-off-white/15" strokeWidth={0.5} />
        <CourtLines
          className="absolute inset-0 w-full text-court-green"
          strokeWidth={0.7}
          progress={percent / 100}
          pathClassName={`transition-[stroke-dashoffset] ease-out ${reducedMotion ? "duration-0" : "duration-[600ms]"}`}
        />
      </div>
      <p className="font-display text-xs font-medium tracking-[0.35em] text-muted uppercase">
        {sceneReady ? "Court ready" : "Preparing the court..."}
        <span className="sr-only"> {Math.round(percent)}%</span>
      </p>
    </div>
  );
}
