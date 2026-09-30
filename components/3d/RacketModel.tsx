"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group } from "three";
import ProceduralRacket from "@/components/3d/ProceduralRacket";
import { DRACO_DECODER_PATH, RACKET_MODEL_URL } from "@/lib/assets";
import { RACKET_DIMENSIONS, RACKET_SCALE, type RacketDetail } from "@/lib/racketGeometry";
import { sceneState } from "@/lib/sceneState";

const SPIN_SPEED = 0.32; // rad/s around the racket's long axis
const SPIN_SPEED_REDUCED = 0.04;
const BOB_AMPLITUDE = 0.06; // world units
const BOB_SPEED = 0.9; // rad/s
const SWAY_AMPLITUDE = 0.035; // rad
const MAX_DELTA = 0.1;

interface RacketModelProps {
  detail: RacketDetail;
  castShadow: boolean;
  reducedMotion: boolean;
}

/**
 * Loads RACKET_MODEL_URL when set, else the procedural racket. Either way the
 * racket is in metres with its butt at y = 0, then pivoted at the balance point
 * and scaled to world units. Transforms come from sceneState so GSAP can drive them.
 */
export default function RacketModel({ detail, castShadow, reducedMotion }: RacketModelProps) {
  const anchor = useRef<Group>(null);
  const spin = useRef<Group>(null);

  useFrame((state, rawDelta) => {
    const a = anchor.current;
    const s = spin.current;
    if (!a || !s) return;
    const delta = Math.min(rawDelta, MAX_DELTA);
    const { racket } = sceneState;
    const t = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : racket.idle;

    a.position.copy(racket.position);
    a.position.y += Math.sin(t * BOB_SPEED) * BOB_AMPLITUDE * idle;
    a.rotation.copy(racket.rotation);
    a.rotation.z += Math.sin(t * BOB_SPEED * 0.6) * SWAY_AMPLITUDE * idle;
    a.scale.setScalar(racket.scale);

    const speed = reducedMotion ? SPIN_SPEED_REDUCED : SPIN_SPEED;
    s.rotation.y += delta * speed * racket.idle;
  });

  return (
    <group ref={anchor}>
      <group ref={spin}>
        <group scale={RACKET_SCALE}>
          <group position={[0, -RACKET_DIMENSIONS.balancePoint, 0]}>
            {RACKET_MODEL_URL ? (
              <GltfRacket url={RACKET_MODEL_URL} castShadow={castShadow} />
            ) : (
              <ProceduralRacket detail={detail} castShadow={castShadow} />
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

/** Normalises any GLTF racket to the procedural convention: metres, long axis +Y, butt at y = 0. */
function GltfRacket({ url, castShadow }: { url: string; castShadow: boolean }) {
  const { scene } = useGLTF(url, DRACO_DECODER_PATH);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const scale = RACKET_DIMENSIONS.length / Math.max(size.y, 1e-6);
    clone.scale.setScalar(scale);
    const centre = box.getCenter(new Vector3());
    clone.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale);
    clone.traverse((obj) => {
      obj.castShadow = castShadow;
    });
    return clone;
  }, [scene, castShadow]);

  return <primitive object={model} />;
}
