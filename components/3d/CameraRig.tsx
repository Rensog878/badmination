"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { RACKET_DIMENSIONS, RACKET_SCALE } from "@/lib/racketGeometry";
import { sceneState } from "@/lib/sceneState";

export const CAMERA_FOV = 35;

const DESKTOP_MIN_WIDTH = 1025;
const TABLET_MIN_WIDTH = 768;
const FIT_MARGIN = 1.12;
const PARALLAX_MAX = 0.05; // rad (~3°)
const DRIFT_AMPLITUDE = 0.025; // rad
const DRIFT_SPEED = 0.18; // rad/s
const FOLLOW_RATE = 3.5; // higher = snappier camera easing

type LayoutKey = "desktop" | "tablet" | "mobile";

interface HeroLayout {
  /** Direction from target to camera (normalised at runtime). */
  viewDirection: [number, number, number];
  /** Fraction of the viewport the racket may occupy. */
  heightFraction: number;
  widthFraction: number;
  /** Racket offset from screen centre, as a fraction of the visible frame. */
  offsetX: number;
  offsetY: number;
  racketTilt: [number, number, number];
}

const LAYOUTS: Record<LayoutKey, HeroLayout> = {
  // Off-axis product shot: text left, racket right.
  desktop: {
    viewDirection: [0.3, 0.2, 1],
    heightFraction: 0.76,
    widthFraction: 0.42,
    offsetX: 0.2,
    offsetY: -0.02,
    racketTilt: [-0.1, 0, -0.4],
  },
  // Racket above the text, leaning more so it fits the upper half.
  tablet: {
    viewDirection: [0.14, 0.18, 1],
    heightFraction: 0.5,
    widthFraction: 0.62,
    offsetX: 0.04,
    offsetY: 0.2,
    racketTilt: [-0.1, 0, -0.62],
  },
  mobile: {
    viewDirection: [0.12, 0.18, 1],
    heightFraction: 0.48,
    widthFraction: 0.8,
    offsetX: 0.02,
    offsetY: 0.22,
    racketTilt: [-0.1, 0, -0.7],
  },
};

const WORLD_UP = new Vector3(0, 1, 0);

function layoutFor(width: number): LayoutKey {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop";
  if (width >= TABLET_MIN_WIDTH) return "tablet";
  return "mobile";
}

/** Computes a framing where the whole racket fits its region, and writes it to sceneState. */
function computeHeroFraming(width: number, height: number) {
  const layout = LAYOUTS[layoutFor(width)];
  const aspect = width / Math.max(height, 1);
  const tanHalf = Math.tan((CAMERA_FOV * Math.PI) / 360);
  const tilt = Math.abs(layout.racketTilt[2]);
  const length = RACKET_DIMENSIONS.length * RACKET_SCALE;
  const headWidth = RACKET_DIMENSIONS.headWidth * RACKET_SCALE;

  const extentH = (length * Math.cos(tilt) + headWidth * Math.sin(tilt)) * FIT_MARGIN;
  const extentW = (length * Math.sin(tilt) + headWidth * Math.cos(tilt)) * FIT_MARGIN;
  const distance = Math.max(
    extentH / (layout.heightFraction * 2 * tanHalf),
    extentW / (layout.widthFraction * 2 * tanHalf * aspect),
  );
  const visibleH = 2 * distance * tanHalf;
  const visibleW = visibleH * aspect;

  const dir = new Vector3(...layout.viewDirection).normalize();
  const forward = dir.clone().negate();
  const right = new Vector3().crossVectors(forward, WORLD_UP).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();

  const { camera, racket } = sceneState;
  camera.target
    .copy(racket.position)
    .addScaledVector(right, -layout.offsetX * visibleW)
    .addScaledVector(up, -layout.offsetY * visibleH);
  camera.position.copy(camera.target).addScaledVector(dir, distance);
  camera.right.copy(right);
  camera.up.copy(up);
  camera.distance = distance;
  racket.rotation.set(...layout.racketTilt);
}

interface CameraRigProps {
  reducedMotion: boolean;
}

export default function CameraRig({ reducedMotion }: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const pointer = useRef({ x: 0, y: 0 });
  const finePointer = useRef(false);
  const lookTarget = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const initialised = useRef(false);

  useEffect(() => {
    if (sceneState.camera.mode !== "hero") return;
    computeHeroFraming(width, height);
    if (!initialised.current) {
      camera.position.copy(sceneState.camera.position);
      lookTarget.current.copy(sceneState.camera.target);
      camera.lookAt(lookTarget.current);
      initialised.current = true;
    }
  }, [camera, width, height]);

  useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!finePointer.current || reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const cam = sceneState.camera;
    let yaw = 0;
    let pitch = 0;
    if (cam.mode === "hero" && !reducedMotion) {
      if (finePointer.current) {
        yaw = Math.max(-1, Math.min(1, pointer.current.x)) * PARALLAX_MAX;
        pitch = Math.max(-1, Math.min(1, pointer.current.y)) * PARALLAX_MAX * 0.6;
      } else {
        const t = state.clock.elapsedTime * DRIFT_SPEED;
        yaw = Math.sin(t) * DRIFT_AMPLITUDE;
        pitch = Math.sin(t * 0.7) * DRIFT_AMPLITUDE * 0.5;
      }
    }

    desired.current
      .copy(cam.position)
      .addScaledVector(cam.right, yaw * cam.distance)
      .addScaledVector(cam.up, pitch * cam.distance);

    const k = reducedMotion ? 1 : 1 - Math.exp(-FOLLOW_RATE * Math.min(delta, 0.1));
    camera.position.lerp(desired.current, k);
    lookTarget.current.lerp(cam.target, k);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
