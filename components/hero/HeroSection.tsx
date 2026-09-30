"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import HeroFallback from "@/components/hero/HeroFallback";
import SceneErrorBoundary from "@/components/3d/SceneErrorBoundary";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { COACH_NAME, HERO } from "@/lib/content";
import { usePageVisible, usePrefersReducedMotion, useWebGLSupport } from "@/lib/performance";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

/** Never trap the page behind the loader, even if the scene stalls. */
const LOADER_TIMEOUT_MS = 10_000;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [inView, setInView] = useState(true);

  const show3D = webgl === true && !sceneFailed;
  const showFallback = webgl === false || sceneFailed;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!show3D) return;
    const timer = window.setTimeout(() => setSceneReady(true), LOADER_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [show3D]);

  const handleReady = useCallback(() => setSceneReady(true), []);
  const handleFailure = useCallback(() => setSceneFailed(true), []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[600px] h-svh flex-col"
    >
      {showFallback && <HeroFallback />}

      {show3D && (
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

      {/* Legibility scrims: left on desktop, bottom on mobile/tablet. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-linear-to-t from-charcoal via-charcoal/75 to-transparent lg:inset-y-0 lg:left-0 lg:right-auto lg:h-full lg:w-[62%] lg:bg-linear-to-r lg:via-charcoal/55"
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-4 pb-14 sm:px-8 md:pb-20 lg:justify-center lg:px-16 lg:pb-0">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="mb-5 flex items-start gap-3 font-display text-[0.7rem] leading-relaxed font-medium tracking-[0.32em] text-court-green uppercase sm:items-center sm:text-xs">
            <span aria-hidden="true" className="mt-[0.6em] h-px w-8 shrink-0 bg-court-green sm:mt-0" />
            <span>
              {HERO.eyebrow}
              <span className="block text-muted sm:inline">
                <span aria-hidden="true" className="hidden sm:inline"> · </span>
                {COACH_NAME}
              </span>
            </span>
          </p>

          <h1
            id="hero-heading"
            className="font-display text-[clamp(3.1rem,11vw,8.75rem)] leading-[0.88] font-bold tracking-[-0.035em] uppercase"
          >
            {HERO.headline}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">{HERO.subline}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href={HERO.primaryCta.href}
              className="group inline-flex items-center justify-center gap-3 bg-court-green px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-black uppercase transition-colors hover:bg-off-white"
            >
              {HERO.primaryCta.label}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </a>
            <a
              href={HERO.secondaryCta.href}
              className="inline-flex items-center justify-center border border-off-white/25 px-7 py-4 font-display text-sm font-semibold tracking-[0.14em] text-off-white uppercase transition-colors hover:border-court-green hover:text-court-green"
            >
              {HERO.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
      >
        <span className="font-display text-[0.65rem] tracking-[0.4em] text-muted uppercase">Scroll</span>
        <span className="h-10 w-px bg-linear-to-b from-court-green to-transparent" />
      </div>

      {show3D && <LoadingScreen sceneReady={sceneReady} reducedMotion={reducedMotion} />}
    </section>
  );
}
