"use client";

import { useEffect, useState } from "react";
import CourtLines from "@/components/ui/CourtLines";

const FILL_DURATION_MS = 600; // keep in sync with duration-[600ms] below
const FADE_DURATION_MS = 700;
/** Offer a way past the loader if the scene takes a moment (it keeps loading behind). */
const SKIP_AFTER_MS = 1500;

interface LoadingScreenProps {
  /** True once the scene has rendered its first frames. */
  sceneReady: boolean;
  /** 0–100 network loading progress, reported from inside the 3D chunk (keeps three.js out of the main bundle). */
  progress: number;
  reducedMotion: boolean;
}

/**
 * Black overlay while the 3D scene prepares. Progress is real: drei's loader
 * progress for network assets, and 100% only once the scene has actually rendered.
 * The procedural racket loads nothing, so it goes straight from waiting to ready.
 */
export default function LoadingScreen({ sceneReady, progress, reducedMotion }: LoadingScreenProps) {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  const skip = () => {
    setHidden(true);
    window.setTimeout(() => setRemoved(true), reducedMotion ? 0 : FADE_DURATION_MS);
  };

  const percent = sceneReady ? 100 : Math.min(progress, 95);
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
      <p className="font-display text-xs font-medium tracking-[0.18em] text-muted uppercase">
        {sceneReady ? "Court ready" : "Preparing the court..."}
        <span className="sr-only"> {Math.round(percent)}%</span>
      </p>
      <button
        type="button"
        onClick={skip}
        className={`rounded-full border border-off-white/25 px-6 py-3 font-display text-sm font-semibold tracking-[0.12em] text-off-white uppercase transition-opacity hover:border-court-green hover:text-court-green ${
          canSkip && !sceneReady ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        tabIndex={canSkip && !sceneReady ? 0 : -1}
      >
        Skip
      </button>
    </div>
  );
}
