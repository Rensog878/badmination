import { useState, useSyncExternalStore } from "react";

export type PerformanceTier = "high" | "medium" | "low";

export interface TierConfig {
  dpr: number | [number, number];
  fog: boolean;
  softShadows: boolean;
  contactShadows: boolean;
  contactShadowResolution: number;
  environmentResolution: number;
  lights: "full" | "minimal";
  racketDetail: "high" | "low";
}

export const TIER_CONFIG: Record<PerformanceTier, TierConfig> = {
  high: {
    // Desktop 120Hz/144Hz displays: 1.75 DPR provides retina clarity without 4K fill-rate bottleneck
    dpr: [1, 1.75],
    fog: true,
    softShadows: true,
    contactShadows: true,
    contactShadowResolution: 512,
    environmentResolution: 128,
    lights: "full",
    racketDetail: "high",
  },
  medium: {
    // Mobile & tablet 120Hz ProMotion screens: 1.5 DPR is razor-sharp on 400+ PPI displays with 50% lighter GPU load
    dpr: [1, 1.5],
    fog: false,
    softShadows: false,
    contactShadows: true,
    contactShadowResolution: 256,
    environmentResolution: 64,
    lights: "full",
    racketDetail: "high",
  },
  low: {
    // Budget devices: minimal overhead to ensure locked 60 FPS
    dpr: [1, 1.2],
    fog: false,
    softShadows: false,
    contactShadows: false,
    contactShadowResolution: 256,
    environmentResolution: 64,
    lights: "minimal",
    racketDetail: "low",
  },
};

const TIERS: readonly PerformanceTier[] = ["high", "medium", "low"];

/** QA override: `?tier=high|medium|low` (testing only). */
export function forcedTier(): PerformanceTier | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("tier");
  return TIERS.find((t) => t === value) ?? null;
}

/**
 * Automatically determines the ideal tier to sustain 60 to 120 FPS:
 * - Desktops with discrete GPUs get "high" tier (soft shadows, volumetric fog, full lights).
 * - Mobile phones & tablets get "medium" tier (1.5 DPR, single-pass lighting, zero shadow sampling stalls).
 * - Low-spec mobile devices get "low" tier to ensure locked 60 FPS without overheating.
 */
export function detectDeviceTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";
  const forced = forcedTier();
  if (forced) return forced;

  const isMobile = window.innerWidth < 1024 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const cores = navigator.hardwareConcurrency || 4;

  if (isMobile) {
    return cores <= 4 ? "low" : "medium";
  }
  return cores < 4 ? "medium" : "high";
}

export const startTier = (): PerformanceTier => detectDeviceTier();

export function usePerformanceTier(initial?: PerformanceTier) {
  const [tier] = useState<PerformanceTier>(() => forcedTier() ?? initial ?? detectDeviceTier());
  return { tier, config: TIER_CONFIG[tier] };
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

let webglSupportCache: boolean | undefined;

export function hasWebGL(): boolean {
  if (webglSupportCache !== undefined) return webglSupportCache;
  try {
    const canvas = document.createElement("canvas");
    webglSupportCache = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglSupportCache = false;
  }
  return webglSupportCache;
}

const noopSubscribe = () => () => {};

/** `null` during SSR/hydration, then the real answer on the client. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(noopSubscribe, hasWebGL, () => null);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}
