"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Euler, Matrix4, Quaternion, Vector3, type Group } from "three";
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
const GRIP_FROM_BUTT = 0.07; // metres: where the hand holds the handle
const FLIGHT_ARC_HEIGHT = 1.4; // world units the racket lifts mid-flight

const Y_AXIS = new Vector3(0, 1, 0);
/** Racket anchor relative to the hand: pivot sits above the grip, scaled back to real metres. */
const HAND_OFFSET = new Matrix4()
  .makeTranslation(0, RACKET_DIMENSIONS.balancePoint - GRIP_FROM_BUTT, 0)
  .multiply(new Matrix4().makeScale(1 / RACKET_SCALE, 1 / RACKET_SCALE, 1 / RACKET_SCALE));

interface RacketModelProps {
  detail: RacketDetail;
  castShadow: boolean;
  reducedMotion: boolean;
}

/**
 * Loads RACKET_MODEL_URL when set, else the procedural racket. Either way the
 * racket is in metres with its butt at y = 0, then pivoted at the balance point
 * and scaled to world units. The hero pose comes from sceneState; as
 * `racket.attach` goes 0 → 1 it flies along an arc into the athlete's hand.
 */
export default function RacketModel({ detail, castShadow, reducedMotion }: RacketModelProps) {
  const anchor = useRef<Group>(null);
  const spinAngle = useRef(0);
  const tmp = useMemo(
    () => ({
      euler: new Euler(),
      heroQuat: new Quaternion(),
      spinQuat: new Quaternion(),
      heroPos: new Vector3(),
      heroScale: new Vector3(),
      hand: new Matrix4(),
      handPos: new Vector3(),
      handQuat: new Quaternion(),
      handScale: new Vector3(),
    }),
    [],
  );

  useFrame((state, rawDelta) => {
    const a = anchor.current;
    if (!a) return;
    const delta = Math.min(rawDelta, MAX_DELTA);
    const { racket, handAnchor } = sceneState;
    const t = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : racket.idle;

    spinAngle.current += delta * (reducedMotion ? SPIN_SPEED_REDUCED : SPIN_SPEED) * racket.idle;

    tmp.heroPos.copy(racket.position);
    tmp.heroPos.y += Math.sin(t * BOB_SPEED) * BOB_AMPLITUDE * idle;
    tmp.euler.copy(racket.rotation);
    tmp.euler.z += Math.sin(t * BOB_SPEED * 0.6) * SWAY_AMPLITUDE * idle;
    tmp.heroQuat.setFromEuler(tmp.euler).multiply(tmp.spinQuat.setFromAxisAngle(Y_AXIS, spinAngle.current));
    tmp.heroScale.setScalar(racket.scale);

    const attach = handAnchor ? racket.attach : 0;
    if (attach <= 0 || !handAnchor) {
      a.position.copy(tmp.heroPos);
      a.quaternion.copy(tmp.heroQuat);
      a.scale.copy(tmp.heroScale);
      return;
    }

    handAnchor.updateWorldMatrix(true, false);
    tmp.hand.multiplyMatrices(handAnchor.matrixWorld, HAND_OFFSET).decompose(tmp.handPos, tmp.handQuat, tmp.handScale);
    a.position.lerpVectors(tmp.heroPos, tmp.handPos, attach);
    a.position.y += Math.sin(Math.PI * attach) * FLIGHT_ARC_HEIGHT;
    a.quaternion.slerpQuaternions(tmp.heroQuat, tmp.handQuat, attach);
    a.scale.lerpVectors(tmp.heroScale, tmp.handScale, attach);
  });

  return (
    <group ref={anchor}>
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
