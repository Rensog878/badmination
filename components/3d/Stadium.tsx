"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { SpotLight } from "@react-three/drei";
import { CanvasTexture, Color, DoubleSide, InstancedMesh, Object3D, RepeatWrapping } from "three";

/**
 * Indoor stadium dressing around the court: regulation net + posts, overhead
 * light rigs (emissive, picked up by bloom), volumetric beams, tiered stands
 * with scattered crowd lights. Court: 6.1 × 13.4 m centred at z = COURT_Z.
 */

const COURT_Z = -3.2;
const COURT_HALF_WIDTH = 3.05;
const COURT_HALF_LENGTH = 6.7;

// Net (BWF): posts 1.55 m on the doubles sidelines, net 1.524 m at centre, ~0.76 m deep.
const POST_HEIGHT = 1.55;
const NET_TOP = 1.524;
const NET_DEPTH = 0.76;

// Light rigs above the court.
const RIG_HEIGHT = 11;
const RIG_ROWS = [-3.6, 3.6];
const RIG_FIXTURES_PER_ROW = 5;

// Stands along both long sides.
const STAND_TIERS = 9;
const STAND_TIER_RISE = 0.55;
const STAND_TIER_DEPTH = 0.95;
const STAND_GAP = 4.2; // distance from sideline to first tier
const STAND_LENGTH = 26;
const CROWD_LIGHTS = 420;

function createNetTexture(): CanvasTexture | null {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(235,238,242,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  const t = new CanvasTexture(canvas);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(6.1 / 0.02 / 4, NET_DEPTH / 0.02 / 4); // ~2 cm mesh, drawn at 4-cell tiles
  t.anisotropy = 8;
  return t;
}

function Net() {
  const texture = useMemo(() => createNetTexture(), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group position={[0, 0, COURT_Z]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (COURT_HALF_WIDTH + 0.02), POST_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, POST_HEIGHT, 12]} />
          <meshStandardMaterial color="#d7dbe0" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, NET_TOP - NET_DEPTH / 2, 0]}>
        <planeGeometry args={[COURT_HALF_WIDTH * 2, NET_DEPTH]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.25} side={DoubleSide} color="#dfe3e8" roughness={0.9} />
      </mesh>
      {/* White top tape */}
      <mesh position={[0, NET_TOP - 0.035, 0]}>
        <boxGeometry args={[COURT_HALF_WIDTH * 2, 0.075, 0.012]} />
        <meshStandardMaterial color="#f3f4f6" roughness={0.6} />
      </mesh>
    </group>
  );
}

function LightRigs({ beams }: { beams: boolean }) {
  const fixtures = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const x of RIG_ROWS) {
      for (let i = 0; i < RIG_FIXTURES_PER_ROW; i++) {
        list.push([x, RIG_HEIGHT, COURT_Z - COURT_HALF_LENGTH + (i + 0.5) * ((COURT_HALF_LENGTH * 2) / RIG_FIXTURES_PER_ROW)]);
      }
    }
    return list;
  }, []);
  const beamTargets = useMemo(() => [new Object3D(), new Object3D(), new Object3D(), new Object3D()], []);

  return (
    <group>
      {/* Truss + fixtures (bright emissive: bloom turns them into stadium lights). */}
      {RIG_ROWS.map((x) => (
        <mesh key={x} position={[x, RIG_HEIGHT + 0.18, COURT_Z]}>
          <boxGeometry args={[0.12, 0.12, COURT_HALF_LENGTH * 2 + 2]} />
          <meshStandardMaterial color="#1a1d22" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {fixtures.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[1.1, 0.12, 0.55]} />
          <meshStandardMaterial color="#ffffff" emissive="#f6f8ff" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      ))}

      {beams &&
        [
          { from: [-3.6, RIG_HEIGHT, COURT_Z - 4], to: [-0.6, 0, COURT_Z - 3.6] },
          { from: [3.6, RIG_HEIGHT, COURT_Z - 4], to: [0.9, 0, COURT_Z - 4.4] },
          { from: [-3.6, RIG_HEIGHT, COURT_Z + 3], to: [-1, 0, COURT_Z + 2.8] },
          { from: [3.6, RIG_HEIGHT, COURT_Z + 3], to: [1.2, 0, COURT_Z + 3.4] },
        ].map((b, i) => (
          <group key={i}>
            <primitive object={beamTargets[i]} position={b.to} />
            <SpotLight
              position={b.from as [number, number, number]}
              target={beamTargets[i]}
              angle={0.33}
              penumbra={0.6}
              distance={18}
              intensity={35}
              decay={1.6}
              attenuation={7}
              anglePower={6}
              opacity={0.09}
              radiusTop={0.25}
              radiusBottom={3.2}
              color="#eef3ff"
              volumetric
            />
          </group>
        ))}
    </group>
  );
}

function Stands({ crowd }: { crowd: boolean }) {
  const lights = useRef<InstancedMesh>(null);
  const tiers = useMemo(() => Array.from({ length: STAND_TIERS }, (_, i) => i), []);

  useLayoutEffect(() => {
    const mesh = lights.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const color = new Color();
    // Deterministic pseudo-random so server/client and reloads look the same.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < CROWD_LIGHTS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const tier = Math.floor(rand() * STAND_TIERS);
      const x = side * (COURT_HALF_WIDTH + STAND_GAP + tier * STAND_TIER_DEPTH + 0.3 + rand() * 0.4);
      const y = tier * STAND_TIER_RISE + STAND_TIER_RISE + 0.35;
      const z = COURT_Z + (rand() - 0.5) * STAND_LENGTH;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.5 + rand() * 0.8);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Mostly warm phone/seat lights, a few in the site accent.
      mesh.setColorAt(i, color.set(rand() < 0.12 ? "#10b981" : rand() < 0.5 ? "#ffd9a8" : "#eaf0ff"));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  return (
    <group>
      {[-1, 1].map((side) =>
        tiers.map((t) => (
          <mesh
            key={`${side}-${t}`}
            position={[
              side * (COURT_HALF_WIDTH + STAND_GAP + t * STAND_TIER_DEPTH + STAND_TIER_DEPTH / 2),
              (t + 1) * STAND_TIER_RISE * 0.5,
              COURT_Z,
            ]}
            receiveShadow
          >
            <boxGeometry args={[STAND_TIER_DEPTH, (t + 1) * STAND_TIER_RISE, STAND_LENGTH]} />
            <meshStandardMaterial color="#111318" roughness={0.95} />
          </mesh>
        )),
      )}
      {crowd && (
        <instancedMesh ref={lights} args={[undefined, undefined, CROWD_LIGHTS]}>
          <sphereGeometry args={[0.035, 6, 4]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}

export default function Stadium({ rich }: { rich: boolean }) {
  return (
    <group>
      <Net />
      <LightRigs beams={rich} />
      <Stands crowd={rich} />
    </group>
  );
}
