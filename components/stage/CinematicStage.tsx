"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import SceneErrorBoundary from "@/components/3d/SceneErrorBoundary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { StageContext, type StageMode } from "@/components/stage/StageContext";
import { usePageVisible, usePrefersReducedMotion, useWebGLSupport } from "@/lib/performance";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

/** Never trap the page behind the loader, even if the scene stalls. */
const LOADER_TIMEOUT_MS = 10_000;

/**
 * Owns the one persistent Canvas (fixed behind the content) for every cinematic
 * section inside it, plus WebGL detection, error fallback and the loader.
 */
export default function CinematicStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [inView, setInView] = useState(true);

  const mode: StageMode = webgl === null ? "pending" : webgl && !sceneFailed ? "3d" : "fallback";
  const status = useMemo(() => ({ mode, reducedMotion }), [mode, reducedMotion]);

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
        {mode === "3d" && (
          <div
            className="fixed inset-0 -z-10 transition-opacity duration-700 motion-reduce:duration-0"
            style={{ opacity: inView ? 1 : 0 }}
          >
            <SceneErrorBoundary fallback={null} onError={handleFailure}>
              <Suspense fallback={null}>
                <HeroScene
                  active={inView && pageVisible}
                  reducedMotion={reducedMotion}
                  onReady={handleReady}
                  onTooSlow={handleFailure}
                />
              </Suspense>
            </SceneErrorBoundary>
          </div>
        )}
        {children}
        {mode === "3d" && <LoadingScreen sceneReady={sceneReady} reducedMotion={reducedMotion} />}
      </div>
    </StageContext.Provider>
  );
}
