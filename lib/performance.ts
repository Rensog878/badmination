import { useCallback, useState, useSyncExternalStore } from "react";

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
    dpr: [1, 2],
    fog: true,
    softShadows: true,
    contactShadows: true,
    contactShadowResolution: 1024,
    environmentResolution: 256,
    lights: "full",
    racketDetail: "high",
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
  },
  low: {
    dpr: 1,
    fog: false,
    softShadows: false,
    contactShadows: false,
    contactShadowResolution: 256,
    environmentResolution: 64,
    lights: "minimal",
    racketDetail: "low",
  },
};

const DESKTOP_MIN_WIDTH = 1025;
const MOBILE_MAX_WIDTH = 767;

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/** Data Saver, a slow connection, or an explicit reduced-data preference. */
function wantsLightweight(nav: NavigatorWithHints): boolean {
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && /(^|-)2g|3g/.test(nav.connection.effectiveType)) return true;
  return window.matchMedia?.("(prefers-reduced-data: reduce)").matches ?? false;
}

/**
 * Initial tier from device hints, before any 3D code is downloaded. "low" means
 * the static hero (three.js is never fetched). Runtime step-down is handled by
 * PerformanceMonitor. deviceMemory is Chromium-only and bucketed (0.25–8 GB).
 */
export function detectTier(): PerformanceTier {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as NavigatorWithHints;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory;
  const width = window.innerWidth;

  if (wantsLightweight(nav)) return "low";
  if (cores <= 2 || (memory !== undefined && memory <= 3)) return "low";
  if (width <= MOBILE_MAX_WIDTH && cores <= 4) return "low";
  if (width >= DESKTOP_MIN_WIDTH && cores >= 8 && (memory === undefined || memory >= 8)) {
    return "high";
  }
  return "medium";
}

const TIERS: readonly PerformanceTier[] = ["high", "medium", "low"];

/** QA override: `?tier=high|medium|low` locks the tier and disables runtime step-down. */
export function forcedTier(): PerformanceTier | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("tier");
  return TIERS.find((t) => t === value) ?? null;
}

/** Tier to start from: QA override, else device detection. */
export const startTier = (): PerformanceTier => forcedTier() ?? detectTier();

export function usePerformanceTier(initial?: PerformanceTier) {
  const [forced] = useState(forcedTier);
  const [tier, setTier] = useState<PerformanceTier>(() => forced ?? initial ?? detectTier());
  const stepDown = useCallback(() => {
    setTier((current) => (current === "high" ? "medium" : "low"));
  }, []);
  return { tier, config: TIER_CONFIG[tier], stepDown, locked: forced !== null };
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
