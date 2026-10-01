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
  /** Bloom, vignette and grain. */
  postprocessing: boolean;
}

export const TIER_CONFIG: Record<PerformanceTier, TierConfig> = {
  high: {
    dpr: [1, 2],
    fog: true,
    softShadows: true,
    contactShadows: true,
    contactShadowResolution: 1024,
    environmentResolution: 256,
    lights: "full",
    racketDetail: "high",
    postprocessing: true,
  },
  medium: {
    // Mid-range phones: fill-rate is the bottleneck, so cap pixel density hard.
    dpr: [1, 1.25],
    fog: false,
    softShadows: false,
    contactShadows: true,
    contactShadowResolution: 256, // re-rendered every frame: keep it cheap
    environmentResolution: 128,
    lights: "full",
    racketDetail: "high",
    postprocessing: true,
  },
  low: {
    // Weak phones still get the full 3D story: render below native resolution
    // (fill-rate is their bottleneck), simplest geometry and lighting, no shadows.
    dpr: 0.85,
    fog: false,
    softShadows: false,
    contactShadows: false,
    contactShadowResolution: 256,
    environmentResolution: 64,
    lights: "minimal",
    racketDetail: "low",
    postprocessing: false,
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
 * Product decision: every device segment (low-end, mid-range, high-end) gets the
 * full-quality 3D. No device detection and no automatic downgrade; the lower
 * tiers exist only for the `?tier=` testing override.
 */
export const startTier = (): PerformanceTier => forcedTier() ?? "high";

export function usePerformanceTier(initial: PerformanceTier = "high") {
  const [tier] = useState<PerformanceTier>(() => forcedTier() ?? initial);
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
