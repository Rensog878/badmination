// Central asset registry. Swap procedural placeholders for real files by setting these paths.

/** Path to a GLB/GLTF racket (Draco supported). `null` renders the procedural racket. */
export const RACKET_MODEL_URL: string | null = null;

/** Self-hosted Draco decoder (copied from three by scripts/copy-draco.mjs). */
export const DRACO_DECODER_PATH = "/draco/";

/** How the Phase 3 athlete is rendered. Unused in Phase 2. */
export type AthleteSource = "procedural" | "image-sequence" | "gltf";
export const ATHLETE_SOURCE: AthleteSource = "procedural";

/** Placeholder paths for later phases (files do not exist yet). */
export const ATHLETE_ASSETS = {
  gltf: "/models/athlete.glb",
  imageSequence: {
    basePath: "/sequences/smash/",
    frameCount: 0,
    extension: "webp",
  },
} as const;
