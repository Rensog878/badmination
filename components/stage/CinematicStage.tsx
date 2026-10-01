"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import SceneErrorBoundary from "@/components/3d/SceneErrorBoundary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { StageContext, type StageMode } from "@/components/stage/StageContext";
import {
  startTier,
  usePageVisible,
  usePrefersReducedMotion,
  useWebGLSupport,
  type PerformanceTier,
} from "@/lib/performance";

// The 3D chunk (three.js, drei, scene) is only requested once we've decided to use it.
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

/** Never trap the page behind the loader, even if the scene stalls. */
const LOADER_TIMEOUT_MS = 10_000;
/** Start fetching 3D once the main thread is idle (or after this long at most). */
const IDLE_TIMEOUT_MS = 2000;

const noopSubscribe = () => () => {};

/** Tier is decided once on the client, before any 3D code is downloaded. */
function useStartTier(): PerformanceTier | null {
  return useSyncExternalStore<PerformanceTier | null>(noopSubscribe, startTier, () => null);
}

/** True once the browser is idle after first paint, so text and CTAs win the main thread. */
function useIdle(enabled: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 300);
    return () => clearTimeout(id);
  }, [enabled]);
  return idle;
}

/**
 * Owns the one persistent Canvas (fixed behind the content) for every cinematic
 * section inside it, plus device tiering, WebGL detection, error fallback and the loader.
 * Low-end devices (and Data Saver / slow networks) get the static hero and never fetch three.js.
 */
export default function CinematicStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const webgl = useWebGLSupport();
  const tier = useStartTier();
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(true);

  const mode: StageMode =
    webgl === null || tier === null ? "pending" : webgl && tier !== "low" && !sceneFailed ? "3d" : "fallback";
  const status = useMemo(() => ({ mode, reducedMotion }), [mode, reducedMotion]);
  const idle = useIdle(mode === "3d");
  // Full-screen loader only where it reads as cinematic (capable desktops); elsewhere the scene fades in behind live text.
  const showLoader = mode === "3d" && tier === "high";

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "3d") return;
    const timer = window.setTimeout(() => setSceneReady(true), LOADER_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const handleReady = useCallback(() => setSceneReady(true), []);
  const handleFailure = useCallback(() => setSceneFailed(true), []);

  return (
    <StageContext.Provider value={status}>
      <div ref={stageRef} className="relative isolate">
        {mode === "3d" && idle && tier && (
          <div
            className="fixed inset-0 -z-10 transition-opacity duration-700 motion-reduce:duration-0"
            style={{ opacity: inView && sceneReady ? 1 : 0 }}
          >
            <SceneErrorBoundary fallback={null} onError={handleFailure}>
              <Suspense fallback={null}>
                <HeroScene
                  active={inView && pageVisible}
                  reducedMotion={reducedMotion}
                  initialTier={tier}
                  onReady={handleReady}
                  onProgress={setProgress}
                />
              </Suspense>
            </SceneErrorBoundary>
          </div>
        )}
        {children}
        {showLoader && <LoadingScreen sceneReady={sceneReady} progress={progress} reducedMotion={reducedMotion} />}
      </div>
    </StageContext.Provider>
  );
}
