import { Euler, Vector3, type Object3D } from "three";

/**
 * Non-React, mutable scene state shared by the persistent Canvas.
 * Components read it inside useFrame; GSAP writes `smash.progress` directly,
 * so scrolling never triggers React re-renders.
 */
export const sceneState = {
  camera: {
    /** Responsive hero framing, computed by CameraRig on resize. */
    position: new Vector3(0, 2.5, 8),
    target: new Vector3(0, 1.95, 0),
    /** Screen-space basis of the hero framing, used for parallax offsets. */
    right: new Vector3(1, 0, 0),
    up: new Vector3(0, 1, 0),
    distance: 8,
    /** Cinematic shot blended over the hero framing (weight 0 = hero, 1 = override). */
    override: {
      position: new Vector3(),
      target: new Vector3(),
      weight: 0,
    },
  },
  racket: {
    /** World position of the racket's balance point in the hero shot. */
    position: new Vector3(0, 1.95, 0),
    /** Base tilt; idle spin is applied on top. */
    rotation: new Euler(-0.1, 0, -0.38),
    scale: 1,
    /** 0..1 weight of the idle float/spin. */
    idle: 1,
    /** 0 = hero pose, 1 = held in the athlete's hand. */
    attach: 0,
  },
  /** Set by the athlete rig: the grip point of the racket hand. */
  handAnchor: null as Object3D | null,
  smash: {
    /** 0..1 scroll progress through THE SMASH sequence (written by GSAP). */
    progress: 0,
  },
};

export type SceneState = typeof sceneState;
