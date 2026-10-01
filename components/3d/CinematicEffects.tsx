"use client";

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/**
 * Broadcast-camera finish: bloom on genuinely bright things only (stadium
 * fixtures, impact flash, speed trail; threshold keeps the rest crisp), a soft
 * vignette to pull the eye to the action, and faint film grain.
 */
const BLOOM_THRESHOLD = 0.9;
const BLOOM_INTENSITY = 1.15;

export default function CinematicEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={BLOOM_THRESHOLD} luminanceSmoothing={0.15} intensity={BLOOM_INTENSITY} radius={0.72} />
      <Vignette offset={0.28} darkness={0.72} />
      <Noise opacity={0.035} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  );
}
