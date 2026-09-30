import { Euler, Vector3 } from "three";

/**
 * Non-React, mutable scene state shared by the persistent hero Canvas.
 * Components read it inside useFrame; GSAP (Phase 3) can tween these values
 * directly without triggering React re-renders.
 */
export type CameraMode = "hero" | "external";

export const sceneState = {
  camera: {
    /** "hero": CameraRig computes responsive framing. "external": something else (GSAP) owns position/target. */
    mode: "hero" as CameraMode,
    position: new Vector3(0, 2.5, 8),
    target: new Vector3(0, 1.95, 0),
    /** Screen-space basis of the framing, used for parallax offsets. */
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 1, 0),
    distance: 8,
  },
  racket: {
    /** World position of the racket's balance point. */
    position: new Vector3(0, 1.95, 0),
    /** Base tilt; idle spin is applied on top. */
    rotation: new Euler(-0.1, 0, -0.38),
    scale: 1,
    /** 0..1 weight of the idle float/spin; Phase 3 fades it out. */
    idle: 1,
  },
  scroll: {
    progress: 0,
  },
};

export type SceneState = typeof sceneState;
