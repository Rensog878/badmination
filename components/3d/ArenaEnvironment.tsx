"use client";

import { useEffect, useMemo } from "react";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { CanvasTexture, Object3D, SRGBColorSpace } from "three";
import type { TierConfig } from "@/lib/performance";
import { sceneState } from "@/lib/sceneState";

// Badminton court (metres). Length runs along Z, into the screen.
const COURT_WIDTH = 6.1;
const COURT_LENGTH = 13.4;
const COURT_Z = -3.2;
const LINE_WIDTH = 0.04;
const COURT_PX_PER_METRE = 168;

const FLOOR_COLOR = "#050505";
const FLOOR_SIZE = 40;
const FLOOR_FADE_START = 0.12; // fraction of the texture where the radial fade begins
const COURT_FADE_END = 0.55; // far portion of the court that fades out
const COURT_COLOR = "#0e0f0f";
const LINE_COLOR = "rgba(243, 244, 246, 0.3)";

const KEY_LIGHT_POSITION: [number, number, number] = [-3.5, 8, 4.5];
const KEY_LIGHT_INTENSITY = 260;
const RIM_LIGHT_POSITION: [number, number, number] = [4, 3.2, -4.5];
const RIM_LIGHT_INTENSITY = 90;
const FILL_LIGHT_INTENSITY = 6;
const AMBIENT_INTENSITY = 0.12;

function createCourtTexture(): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(COURT_WIDTH * COURT_PX_PER_METRE);
  canvas.height = Math.round(COURT_LENGTH * COURT_PX_PER_METRE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const m = COURT_PX_PER_METRE;
  const lw = LINE_WIDTH * m;

  ctx.fillStyle = COURT_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = LINE_COLOR;

  const hLine = (z: number, x0 = 0, x1 = COURT_WIDTH) =>
    ctx.fillRect(x0 * m, z * m - lw / 2, (x1 - x0) * m, lw);
  const vLine = (x: number, z0 = 0, z1 = COURT_LENGTH) =>
    ctx.fillRect(x * m - lw / 2, z0 * m, lw, (z1 - z0) * m);

  const half = COURT_LENGTH / 2;
  const edge = LINE_WIDTH / 2;
  // Boundary (doubles) and singles sidelines.
  hLine(edge);
  hLine(COURT_LENGTH - edge);
  vLine(edge);
  vLine(COURT_WIDTH - edge);
  vLine(0.46);
  vLine(COURT_WIDTH - 0.46);
  // Doubles long service lines.
  hLine(0.76);
  hLine(COURT_LENGTH - 0.76);
  // Short service lines.
  hLine(half - 1.98);
  hLine(half + 1.98);
  // Centre lines.
  vLine(COURT_WIDTH / 2, 0, half - 1.98);
  vLine(COURT_WIDTH / 2, half + 1.98, COURT_LENGTH);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Greyscale alpha mask so the floor dissolves into the background on every tier
 * (fog is only enabled on high). `radial` fades from the centre outward; otherwise
 * it fades toward the top of the texture, which is the far end of the court.
 */
function createFadeTexture(kind: "radial" | "far"): CanvasTexture | null {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad =
    kind === "radial"
      ? ctx.createRadialGradient(size / 2, size / 2, size * FLOOR_FADE_START, size / 2, size / 2, size / 2)
      : ctx.createLinearGradient(0, 0, 0, size);
  if (kind === "radial") {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#6b6b6b");
    grad.addColorStop(1, "#000000");
  } else {
    grad.addColorStop(0, "#000000");
    grad.addColorStop(COURT_FADE_END, "#ffffff");
    grad.addColorStop(1, "#ffffff");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

interface ArenaEnvironmentProps {
  config: TierConfig;
}

export default function ArenaEnvironment({ config }: ArenaEnvironmentProps) {
  const courtTexture = useMemo(() => createCourtTexture(), []);
  const floorFade = useMemo(() => createFadeTexture("radial"), []);
  const courtFade = useMemo(() => createFadeTexture("far"), []);
  const lightTarget = useMemo(() => new Object3D(), []);
  const full = config.lights === "full";
  const racketPos = sceneState.racket.position;

  useEffect(
    () => () => {
      courtTexture?.dispose();
      floorFade?.dispose();
      courtFade?.dispose();
    },
    [courtTexture, floorFade, courtFade],
  );

  return (
    <>
      <ambientLight intensity={AMBIENT_INTENSITY} />
      <primitive object={lightTarget} position={[racketPos.x, racketPos.y * 0.6, racketPos.z]} />

      <spotLight
        position={KEY_LIGHT_POSITION}
        target={lightTarget}
        angle={0.36}
        penumbra={0.9}
        intensity={KEY_LIGHT_INTENSITY}
        decay={2}
        color="#F3F4F6"
        castShadow={config.softShadows}
        shadow-mapSize={config.softShadows ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0002}
        shadow-radius={3}
      />

      {full && (
        <>
          <spotLight
            position={RIM_LIGHT_POSITION}
            target={lightTarget}
            angle={0.5}
            penumbra={1}
            intensity={RIM_LIGHT_INTENSITY}
            decay={2}
            color="#10B981"
          />
          <pointLight position={[3, 2.5, 3]} intensity={FILL_LIGHT_INTENSITY} decay={2} color="#F3F4F6" />
        </>
      )}

      <mesh rotation-x={-Math.PI / 2} renderOrder={0} receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial
          color={FLOOR_COLOR}
          roughness={0.95}
          envMapIntensity={0}
          alphaMap={floorFade}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, COURT_Z]} renderOrder={1} receiveShadow>
        <planeGeometry args={[COURT_WIDTH, COURT_LENGTH]} />
        <meshStandardMaterial
          map={courtTexture}
          roughness={0.8}
          metalness={0}
          envMapIntensity={0.15}
          alphaMap={courtFade}
          transparent
          depthWrite={false}
        />
      </mesh>

      {config.contactShadows && (
        <ContactShadows
          position={[racketPos.x, 0.004, racketPos.z]}
          scale={6}
          far={3.2}
          blur={2.4}
          opacity={0.65}
          resolution={config.contactShadowResolution}
          color="#000000"
          renderOrder={2}
          frames={1}
        />
      )}

      {/* Local studio lighting for reflections. Rendered once, no network HDRI. */}
      <Environment resolution={config.environmentResolution} environmentIntensity={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[10, 0.7, 1]} />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#10B981"
          position={[6, 1.6, -1]}
          rotation-y={-Math.PI / 2}
          scale={[10, 0.5, 1]}
        />
      </Environment>
    </>
  );
}
