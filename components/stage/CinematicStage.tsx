"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import SceneErrorBoundary from "@/components/3d/SceneErrorBoundary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import CinematicVideoStage from "@/components/stage/CinematicVideoStage";
import { StageContext, type StageMode, type StageView } from "@/components/stage/StageContext";
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
 * Flag to re-enable 3D WebGL scene when desired in the future.
 * Currently set to false to prioritize the 4K Cinematic Video stage.
 */
const ENABLE_3D_WEBGL = false;

/**
 * Owns the fixed background stage behind the hero and smash scroll sequences.
 * Drives the 4K Cinematic Video stage of PV Sindhu's jump smash.
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
  const [stageView, setStageViewState] = useState<StageView>("video");

  const setStageView = useCallback((nextView: StageView) => {
    setStageViewState(nextView);
  }, []);

  const mode: StageMode = webgl === null || tier === null ? "pending" : webgl && !sceneFailed ? "3d" : "fallback";
  const status = useMemo(
    () => ({ mode, reducedMotion, stageView, setStageView }),
    [mode, reducedMotion, stageView, setStageView]
  );
  const idle = useIdle(ENABLE_3D_WEBGL && stageView === "3d" && mode === "3d");
  const showLoader = ENABLE_3D_WEBGL && stageView === "3d" && mode === "3d" && tier === "high" && !sceneReady;

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
    if (!ENABLE_3D_WEBGL || stageView !== "3d" || mode !== "3d") return;
    const timer = window.setTimeout(() => setSceneReady(true), LOADER_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [stageView, mode]);

  const handleReady = useCallback(() => setSceneReady(true), []);
  const handleFailure = useCallback(() => setSceneFailed(true), []);

  return (
    <StageContext.Provider value={status}>
      <div ref={stageRef} className="relative isolate">
        {/* 4K Cinematic Video / Frame-Scrubbed Stage of PV Sindhu */}
        <CinematicVideoStage
          inView={inView}
          active={inView && pageVisible}
          reducedMotion={reducedMotion}
          onReady={handleReady}
        />

        {/* 3D WebGL Three.js Scene (preserved for future reuse) */}
        {ENABLE_3D_WEBGL && stageView === "3d" && mode === "3d" && idle && tier && (
          <div
            className="fixed inset-x-0 top-0 -z-10 h-lvh transition-opacity duration-700 motion-reduce:duration-0"
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
