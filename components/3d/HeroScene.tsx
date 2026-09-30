"use client";

import { Suspense, useCallback, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import ArenaEnvironment from "@/components/3d/ArenaEnvironment";
import CameraRig, { CAMERA_FOV } from "@/components/3d/CameraRig";
import RacketModel from "@/components/3d/RacketModel";
import SmashScene from "@/components/3d/SmashScene";
import { usePerformanceTier } from "@/lib/performance";

const BACKGROUND = "#0A0A0A";
const FOG_NEAR = 12;
const FOG_FAR = 34;
const READY_AFTER_FRAMES = 2;

interface HeroSceneProps {
  active: boolean;
  reducedMotion: boolean;
  onReady: () => void;
  /** Called when even the low tier cannot hold frame rate: switch to the static hero. */
  onTooSlow: () => void;
}

/** Signals once the scene (including suspended models) has actually rendered. */
function SceneReady({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= READY_AFTER_FRAMES) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

/** The single persistent Canvas: hero + smash sequence. Later scenes are added here, never as new Canvases. */
export default function HeroScene({ active, reducedMotion, onReady, onTooSlow }: HeroSceneProps) {
  const { tier, config, stepDown, locked } = usePerformanceTier();

  const handleDecline = useCallback(() => {
    if (tier === "low") onTooSlow();
    else stepDown();
  }, [tier, stepDown, onTooSlow]);

  return (
    <Canvas
      aria-hidden="true"
      dpr={config.dpr}
      frameloop={active ? "always" : "never"}
      shadows={config.softShadows ? "percentage" : false}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 80, position: [0, 2.5, 8] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[BACKGROUND]} />
      {config.fog && <fog attach="fog" args={[BACKGROUND, FOG_NEAR, FOG_FAR]} />}
      {!locked && <PerformanceMonitor onDecline={handleDecline} flipflops={3} onFallback={onTooSlow} />}
      <CameraRig reducedMotion={reducedMotion} />
      <ArenaEnvironment config={config} />
      {/* Before RacketModel so the hand pose is updated before the racket reads it each frame. */}
      <SmashScene detail={config.racketDetail} />
      <Suspense fallback={null}>
        <RacketModel
          detail={config.racketDetail}
          castShadow={config.softShadows}
          reducedMotion={reducedMotion}
        />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
