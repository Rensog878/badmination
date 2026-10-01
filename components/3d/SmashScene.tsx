"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type PointLight,
  type SpotLight,
} from "three";
import { applyPoseBlend, buildAthleteRig, SMASH_POSES, type AthleteRig } from "@/lib/athleteRig";
import { sceneState } from "@/lib/sceneState";
import {
  ATHLETE_POSITION as ATHLETE_POSITION_TUPLE,
  CAMERA_KEYS,
  POSE_KEYS,
  SHUTTLE_LANDING as SHUTTLE_LANDING_TUPLE,
  SMASH_MARKS as M,
  linear,
  ramp,
  segmentAt,
} from "@/lib/smashTimeline";

const ATHLETE_POSITION = new Vector3(...ATHLETE_POSITION_TUPLE);
const SHUTTLE_LANDING = new Vector3(...SHUTTLE_LANDING_TUPLE);

const ATHLETE_KEY_INTENSITY = 220;
const ATHLETE_RIM_INTENSITY = 120;
const IMPACT_INTENSITY = 180;
const IMPACT_GLOW_SIZE = 0.28; // metres, peak radius of the flash sprite
const IMPACT_WIDTH = 0.012; // progress units (gaussian width of the impact light)
const GRIP_TO_HEAD_CENTRE = 0.5; // metres from the hand to the racket head centre
const SHUTTLE_SCALE = 1.8; // slightly oversized so it reads at broadcast distance
const TRAIL_SEGMENTS = 160;
const TRAIL_RADIUS = 0.016;
const TRAIL_CORE_RADIUS = 0.005;
const TRAIL_RADIAL = 8;
const TRAIL_CORE_RADIAL = 5;
const TRAIL_MIN_OPACITY = 0.35;
const NARROW_ASPECT = 1.2; // below this, pull the cinematic camera back
const MAX_NARROW_PULLBACK = 2.2;

interface SmashSceneProps {
  detail: "high" | "low";
}

function gradientTexture(kind: "trail" | "blob"): CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "trail" ? 256 : 128;
  canvas.height = kind === "trail" ? 4 : 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (kind === "trail") {
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, "#000000");
    g.addColorStop(0.55, "#2a2a2a");
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g;
  } else {
    const c = canvas.width / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#000000");
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new CanvasTexture(canvas);
}

/** Contact point (world) derived from the rig itself, so racket, shuttle and trail agree. */
function computeContactPoint(rig: AthleteRig): Vector3 {
  applyPoseBlend(rig, SMASH_POSES.contact, SMASH_POSES.contact, 1);
  rig.root.updateMatrixWorld(true);
  const grip = rig.handAnchor.getWorldPosition(new Vector3());
  const axis = new Vector3(0, 1, 0).transformDirection(rig.handAnchor.matrixWorld);
  return grip.addScaledVector(axis, GRIP_TO_HEAD_CENTRE).add(ATHLETE_POSITION);
}

function buildShuttle() {
  const group = new Group();
  const skirtGeo = new CylinderGeometry(0.033, 0.012, 0.07, 18, 1, true);
  skirtGeo.rotateX(-Math.PI / 2);
  skirtGeo.translate(0, 0, -0.04);
  const corkGeo = new SphereGeometry(0.014, 16, 12);
  const skirtMat = new MeshStandardMaterial({
    color: "#F3F4F6",
    roughness: 0.6,
    side: DoubleSide,
    emissive: "#F3F4F6",
    emissiveIntensity: 0.15,
  });
  const corkMat = new MeshStandardMaterial({ color: "#F3F4F6", roughness: 0.4 });
  group.add(new Mesh(skirtGeo, skirtMat), new Mesh(corkGeo, corkMat));
  group.scale.setScalar(SHUTTLE_SCALE);
  return {
    group,
    dispose: () => {
      skirtGeo.dispose();
      corkGeo.dispose();
      skirtMat.dispose();
      corkMat.dispose();
    },
  };
}

export default function SmashScene({ detail }: SmashSceneProps) {
  const aspect = useThree((s) => s.size.width / Math.max(s.size.height, 1));
  const athleteGroup = useRef<Group>(null);
  const keyLight = useRef<SpotLight>(null);
  const rimLight = useRef<SpotLight>(null);
  const impactLight = useRef<PointLight>(null);
  const impactGlow = useRef<Mesh>(null);
  const blob = useRef<Mesh>(null);

  const rig = useMemo(() => buildAthleteRig(detail), [detail]);
  const contact = useMemo(() => computeContactPoint(rig), [rig]);
  const shuttle = useMemo(() => buildShuttle(), []);
  const lightTarget = useMemo(() => {
    const o = new Object3D();
    o.position.copy(ATHLETE_POSITION).setY(1.3);
    return o;
  }, []);

  const paths = useMemo(() => {
    const incoming = new QuadraticBezierCurve3(
      contact.clone().add(new Vector3(-1.5, 5, 7)),
      contact.clone().add(new Vector3(-0.8, 5.5, 3)),
      contact.clone(),
    );
    const mid = contact.clone().lerp(SHUTTLE_LANDING, 0.5).add(new Vector3(0, 0.6, 0));
    const smash = new QuadraticBezierCurve3(contact.clone(), mid, SHUTTLE_LANDING.clone());
    return { incoming, smash };
  }, [contact]);

  const trail = useMemo(() => {
    const alpha = gradientTexture("trail");
    const glow = new MeshBasicMaterial({
      color: "#10B981",
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      alphaMap: alpha,
    });
    const core = new MeshBasicMaterial({
      color: "#F3F4F6",
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      alphaMap: alpha,
    });
    const glowGeo = new TubeGeometry(paths.smash, TRAIL_SEGMENTS, TRAIL_RADIUS, TRAIL_RADIAL, false);
    const coreGeo = new TubeGeometry(paths.smash, TRAIL_SEGMENTS, TRAIL_CORE_RADIUS, TRAIL_CORE_RADIAL, false);
    return { alpha, glow, core, glowGeo, coreGeo };
  }, [paths]);

  const blobTexture = useMemo(() => gradientTexture("blob"), []);

  const cameraPath = useMemo(
    () => ({
      position: new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.position))),
      target: new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.target))),
    }),
    [],
  );

  const tmp = useMemo(() => ({ a: new Vector3(), b: new Vector3() }), []);

  useEffect(() => {
    sceneState.handAnchor = rig.handAnchor;
    return () => {
      if (sceneState.handAnchor === rig.handAnchor) sceneState.handAnchor = null;
      rig.dispose();
    };
  }, [rig]);

  useEffect(() => () => shuttle.dispose(), [shuttle]);
  useEffect(
    () => () => {
      trail.alpha?.dispose();
      trail.glow.dispose();
      trail.core.dispose();
      trail.glowGeo.dispose();
      trail.coreGeo.dispose();
    },
    [trail],
  );
  useEffect(() => () => blobTexture?.dispose(), [blobTexture]);

  useFrame(() => {
    const p = sceneState.smash.progress;
    const { racket, camera } = sceneState;

    // Racket: idle fades, then it flies into the hand.
    racket.idle = 1 - ramp(p, 0, M.idleOut);
    racket.attach = ramp(p, M.flightStart, M.flightEnd);

    // Athlete pose.
    const [pi, pf] = segmentAt(POSE_KEYS, p);
    applyPoseBlend(rig, SMASH_POSES[POSE_KEYS[pi].pose], SMASH_POSES[POSE_KEYS[pi + 1].pose], pf);
    if (athleteGroup.current) athleteGroup.current.visible = p > 0.001;

    // Lights.
    const lit = ramp(p, M.athleteLightStart, M.athleteLightFull);
    if (keyLight.current) keyLight.current.intensity = ATHLETE_KEY_INTENSITY * lit;
    if (rimLight.current) rimLight.current.intensity = ATHLETE_RIM_INTENSITY * lit;
    const impactD = (p - M.contact) / IMPACT_WIDTH;
    const impact = Math.exp(-impactD * impactD);
    if (impactLight.current) impactLight.current.intensity = IMPACT_INTENSITY * impact;
    if (impactGlow.current) {
      impactGlow.current.visible = impact > 0.02;
      impactGlow.current.scale.setScalar(0.05 + impact * IMPACT_GLOW_SIZE);
      (impactGlow.current.material as MeshBasicMaterial).opacity = impact * impact;
    }

    // Ground shadow shrinks and fades as the athlete leaves the floor.
    if (blob.current) {
      const air = Math.max(0, rig.joints.hips.position.y - SMASH_POSES.reach.rootY);
      blob.current.position.set(ATHLETE_POSITION.x, 0.006, ATHLETE_POSITION.z + rig.root.position.z);
      blob.current.scale.setScalar(1.3 - air * 0.5);
      (blob.current.material as MeshBasicMaterial).opacity = 0.75 * lit * (1 - air * 0.6);
    }

    // Shuttle: drops in, then rips crosscourt after contact.
    const s = shuttle.group;
    s.visible = p >= M.incomingStart;
    if (p < M.contact) {
      const t = linear(p, M.incomingStart, M.contact);
      paths.incoming.getPoint(t, s.position);
      paths.incoming.getPoint(Math.min(1, t + 0.01), tmp.a);
      if (t < 1) s.lookAt(tmp.a);
    } else {
      const l = linear(p, M.contact, M.landing);
      const t = 1 - (1 - l) * (1 - l); // fast off the racket, drag bleeds speed
      paths.smash.getPoint(t, s.position);
      paths.smash.getPoint(Math.min(1, t + 0.01), tmp.a);
      if (t < 0.99) s.lookAt(tmp.a);
    }

    // Speed trail: drawn up to the shuttle, brightest at its head.
    const trailT = p <= M.contact ? 0 : 1 - (1 - linear(p, M.contact, M.landing)) ** 2;
    const segs = Math.floor(trailT * TRAIL_SEGMENTS);
    trail.glowGeo.setDrawRange(0, segs * TRAIL_RADIAL * 6);
    trail.coreGeo.setDrawRange(0, segs * TRAIL_CORE_RADIAL * 6);
    if (trail.alpha) trail.alpha.offset.x = 1 - trailT;
    const fade = 1 - ramp(p, M.trailFadeStart, 1) * (1 - TRAIL_MIN_OPACITY);
    trail.glow.opacity = 0.9 * fade;
    trail.core.opacity = 0.8 * fade;

    // Camera: blend from the hero framing onto the cinematic path.
    camera.override.weight = ramp(p, 0, M.cameraIn);
    const [ci, cf] = segmentAt(CAMERA_KEYS, p, false);
    const u = (ci + cf) / (CAMERA_KEYS.length - 1);
    cameraPath.position.getPoint(u, camera.override.position);
    cameraPath.target.getPoint(u, camera.override.target);
    if (aspect < NARROW_ASPECT) {
      const pull = Math.min(MAX_NARROW_PULLBACK, (NARROW_ASPECT / aspect) ** 0.75);
      tmp.b.subVectors(camera.override.position, camera.override.target).multiplyScalar(pull);
      camera.override.position.copy(camera.override.target).add(tmp.b);
    }
  });

  return (
    <>
      <group ref={athleteGroup} position={ATHLETE_POSITION} visible={false}>
        <primitive object={rig.root} />
      </group>

      <primitive object={lightTarget} />
      <spotLight
        ref={keyLight}
        position={[ATHLETE_POSITION.x - 2.5, 7.5, ATHLETE_POSITION.z + 3.5]}
        target={lightTarget}
        angle={0.42}
        penumbra={0.8}
        intensity={0}
        decay={2}
        color="#F3F4F6"
      />
      <spotLight
        ref={rimLight}
        position={[ATHLETE_POSITION.x + 1.5, 3.2, ATHLETE_POSITION.z - 4]}
        target={lightTarget}
        angle={0.6}
        penumbra={1}
        intensity={0}
        decay={2}
        color="#10B981"
      />
      <pointLight ref={impactLight} position={contact} intensity={0} decay={2} distance={8} color="#10B981" />
      {/* Impact flash: over-bright additive sprite that the bloom pass turns into a burst. */}
      <mesh ref={impactGlow} position={contact} visible={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color={[4, 6, 5]} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh ref={blob} rotation-x={-Math.PI / 2} renderOrder={3}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#000000" alphaMap={blobTexture} transparent depthWrite={false} opacity={0} />
      </mesh>

      <primitive object={shuttle.group} visible={false} />
      <mesh geometry={trail.glowGeo} material={trail.glow} renderOrder={4} frustumCulled={false} />
      <mesh geometry={trail.coreGeo} material={trail.core} renderOrder={5} frustumCulled={false} />
    </>
  );
}
