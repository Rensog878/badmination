import type { SmashPoseName } from "@/lib/athleteRig";

/**
 * THE SMASH, as a pure function of scroll progress p ∈ [0, 1].
 * GSAP only scrubs p; the 3D scene derives everything from it, so the sequence
 * is deterministic in both scroll directions. DOM beats (flash, COMPETE) use the same marks.
 */
export const SMASH_MARKS = {
  /** Camera fully on the cinematic path. */
  cameraIn: 0.12,
  /** Idle float/spin has faded out. */
  idleOut: 0.08,
  /** Athlete emerges from the dark. */
  athleteLightStart: 0.02,
  athleteLightFull: 0.16,
  /** Racket flight into the hand. */
  flightStart: 0.12,
  flightEnd: 0.34,
  /** Incoming shuttle drops toward the contact point. */
  incomingStart: 0.42,
  contact: 0.7,
  /** Smash flight from contact to the floor. */
  landing: 0.84,
  /** COMPETE lands just after impact. */
  compete: 0.72,
  /** Trail fades away at the end. */
  trailFadeStart: 0.92,
} as const;

/** Static frame shown under prefers-reduced-motion: shuttle landed, trail drawn. */
export const REDUCED_MOTION_PROGRESS = 0.86;

export const POSE_KEYS: ReadonlyArray<{ at: number; pose: SmashPoseName }> = [
  { at: 0.1, pose: "reach" },
  { at: 0.36, pose: "load" },
  { at: 0.55, pose: "peak" },
  { at: SMASH_MARKS.contact, pose: "contact" },
  { at: 0.8, pose: "follow" },
  { at: 1, pose: "land" },
];

/** Where the athlete stands: far half of the court, facing the net and camera. */
export const ATHLETE_POSITION: readonly [number, number, number] = [0.8, 0, -7.2];
/** Where the smash lands: near half, crosscourt. */
export const SHUTTLE_LANDING: readonly [number, number, number] = [-1.4, 0.03, 1.6];

interface CameraKey {
  at: number;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_KEYS: ReadonlyArray<CameraKey> = [
  // Pull back and rise: the racket and the dark court ahead.
  { at: SMASH_MARKS.cameraIn, position: [0.6, 5.6, 8.5], target: [0.4, 1.4, -4.5] },
  // Broadcast side angle as the racket reaches the hand.
  { at: 0.34, position: [5.2, 3, -2.2], target: [0.7, 1.5, -7] },
  // Low, close: the jump.
  { at: 0.55, position: [4.8, 2.1, -4.6], target: [0.6, 2.4, -7] },
  // Contact.
  { at: SMASH_MARKS.contact, position: [3.3, 2.9, -4.4], target: [0.5, 2.9, -6.9] },
  // Turn with the shuttle as it rips crosscourt.
  { at: SMASH_MARKS.landing, position: [2.6, 3.2, -1.2], target: [-1.2, 0.4, 1.4] },
  // Settle wide on the whole trail.
  { at: 1, position: [3.4, 6.2, 6.8], target: [-0.3, 0.6, -2.6] },
];

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** Smoothstep of p between a and b. */
export function ramp(p: number, a: number, b: number) {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Linear 0..1 of p between a and b. */
export function linear(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

/** Index of the segment containing p and the local fraction within it (eased by default). */
export function segmentAt(
  keys: ReadonlyArray<{ at: number }>,
  p: number,
  eased = true,
): [number, number] {
  if (p <= keys[0].at) return [0, 0];
  for (let i = 0; i < keys.length - 1; i++) {
    if (p <= keys[i + 1].at) {
      const f = eased ? ramp(p, keys[i].at, keys[i + 1].at) : linear(p, keys[i].at, keys[i + 1].at);
      return [i, f];
    }
  }
  return [keys.length - 2, 1];
}
