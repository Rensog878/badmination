"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import ArenaEnvironment from "@/components/3d/ArenaEnvironment";
import CameraRig, { CAMERA_FOV } from "@/components/3d/CameraRig";
import RacketModel from "@/components/3d/RacketModel";
import SmashScene from "@/components/3d/SmashScene";
import { usePerformanceTier, type PerformanceTier } from "@/lib/performance";

const BACKGROUND = "#0A0A0A";
const FOG_NEAR = 12;
const FOG_FAR = 34;
const READY_AFTER_FRAMES = 2;
/** Step down only below 24 fps sustained (drei's default, 40, downgraded phones running a smooth 30 fps). */
const PERFORMANCE_BOUNDS = (): [number, number] => [24, 50];

interface HeroSceneProps {
  active: boolean;
  reducedMotion: boolean;
  initialTier: PerformanceTier;
  onReady: () => void;
  onProgress: (percent: number) => void;
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

/** Reports drei's loader progress (network assets, e.g. a GLTF racket) to the DOM loader. */
function ProgressBridge({ onProgress }: { onProgress: (percent: number) => void }) {
  const { active, progress } = useProgress();
  useEffect(() => {
    onProgress(active ? progress : 0);
  }, [active, progress, onProgress]);
  return null;
}

/** The single persistent Canvas: hero + smash sequence. Later scenes are added here, never as new Canvases. */
export default function HeroScene({ active, reducedMotion, initialTier, onReady, onProgress }: HeroSceneProps) {
  const { config, stepDown, locked } = usePerformanceTier(initialTier);


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
      <ProgressBridge onProgress={onProgress} />
      {config.fog && <fog attach="fog" args={[BACKGROUND, FOG_NEAR, FOG_FAR]} />}
      {/*
        Runtime quality step-down. Mounted only while rendering, so a paused canvas
        (scrolled past / hidden tab) starts a fresh measurement instead of counting
        the pause as one very slow frame. Never swaps 3D for the static hero mid-visit:
        the worst case is the low tier (weak devices are filtered out before 3D loads).
      */}
      {!locked && active && <PerformanceMonitor bounds={PERFORMANCE_BOUNDS} onDecline={stepDown} />}
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
