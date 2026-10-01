/**
 * Scroll progress of THE SMASH (0..1), written by GSAP in SmashSection and read
 * by the 3D scene. Kept free of three.js so DOM-only code (and low-end devices
 * that never load 3D) don't pull the 3D engine into the first download.
 */
export const smashProgress = { progress: 0 };
