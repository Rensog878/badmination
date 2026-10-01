import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";

/**
 * Anonymous, faceless female athlete in generic badminton kit (top, skort,
 * ponytail), built from primitives
 * (metres, facing +Z, right-handed so the racket arm is on -X). Deliberately
 * generic: no face, no names or numbers, no likeness of any real player.
 */

export const JOINT_NAMES = [
  "hips",
  "spine",
  "chest",
  "neck",
  "shoulderR",
  "elbowR",
  "shoulderL",
  "elbowL",
  "hipR",
  "kneeR",
  "hipL",
  "kneeL",
] as const;

export type JointName = (typeof JOINT_NAMES)[number];
type Rotation = [number, number, number];

export interface Pose {
  /** Height of the hip joint above the floor. */
  rootY: number;
  /** Forward travel along +Z. */
  rootZ: number;
  joints: Record<JointName, Rotation>;
}

export interface AthleteRig {
  root: Group;
  joints: Record<JointName, Object3D>;
  handAnchor: Object3D;
  dispose: () => void;
}

// Proportions (metres).
const UPPER_ARM = 0.3;
const FOREARM = 0.27;
const THIGH = 0.44;
const SHIN = 0.46;
const SHOULDER_HALF_SPAN = 0.175; // athletic female build: narrower shoulders
const HIP_HALF_SPAN = 0.1;

// Joint sign conventions (X rotations): hip flexion is negative, knee flexion
// positive, elbow flexion negative, raising an arm forward/up is negative, and
// looking up is negative on the neck. Positive spine X leans forward.
// The racket shoulder uses unwrapped angles (> π) so blends swing forward over the top.
export const SMASH_POSES = {
  /** In the dark, reaching up for the incoming racket. */
  reach: {
    rootY: 0.9,
    rootZ: 0,
    joints: {
      hips: [0, 0, 0],
      spine: [0.05, 0, 0],
      chest: [0, 0, 0],
      neck: [-0.35, 0, 0],
      shoulderR: [3.68, 0, -0.25], // = -2.6, unwrapped so the arm rotates over the top
      elbowR: [-0.3, 0, 0],
      shoulderL: [-0.3, 0, 0.15],
      elbowL: [-0.5, 0, 0],
      hipR: [-0.25, 0, 0],
      kneeR: [0.45, 0, 0],
      hipL: [-0.1, 0, 0],
      kneeL: [0.3, 0, 0],
    },
  },
  /** Side-on, racket arm cocked back, knees loaded. */
  load: {
    rootY: 0.8,
    rootZ: 0,
    joints: {
      hips: [0, -0.8, 0],
      spine: [-0.1, -0.3, 0],
      chest: [-0.05, -0.2, 0],
      neck: [-0.4, 0.9, 0],
      shoulderR: [2.4, 0, -0.5],
      elbowR: [-1.9, 0, 0],
      shoulderL: [-2.5, 0, 0.2],
      elbowL: [-0.2, 0, 0],
      hipR: [-0.5, 0, 0],
      kneeR: [1.0, 0, 0],
      hipL: [-0.3, 0, 0],
      kneeL: [0.8, 0, 0],
    },
  },
  /** Top of the jump: arched, scissored legs. */
  peak: {
    rootY: 1.55,
    rootZ: 0.1,
    joints: {
      hips: [-0.1, -0.9, 0],
      spine: [-0.25, -0.25, 0],
      chest: [-0.1, -0.15, 0],
      neck: [-0.4, 0.8, 0],
      shoulderR: [2.7, 0, -0.4],
      elbowR: [-2.3, 0, 0],
      shoulderL: [-2.7, 0, 0.2],
      elbowL: [-0.2, 0, 0],
      hipR: [0.2, 0, 0],
      kneeR: [1.4, 0, 0],
      hipL: [-0.9, 0, 0],
      kneeL: [1.2, 0, 0],
    },
  },
  /** Full extension at the contact point. */
  contact: {
    rootY: 1.6,
    rootZ: 0.2,
    joints: {
      hips: [0, -0.2, 0],
      spine: [0.15, 0.1, 0],
      chest: [0.1, 0.2, 0],
      neck: [-0.3, 0, 0],
      shoulderR: [3.33, 0, -0.15], // straight up, reached over the top from the cocked position
      elbowR: [-0.05, 0, 0],
      shoulderL: [-0.6, 0, 0.4],
      elbowL: [-1.2, 0, 0],
      hipR: [-0.6, 0, 0],
      kneeR: [0.9, 0, 0],
      hipL: [0.2, 0, 0],
      kneeL: [1.2, 0, 0],
    },
  },
  /** Arm sweeps down across the body. */
  follow: {
    rootY: 1.2,
    rootZ: 0.35,
    joints: {
      hips: [0.1, 0.3, 0],
      spine: [0.35, 0.2, 0],
      chest: [0.2, 0.2, 0],
      neck: [-0.1, 0, 0],
      shoulderR: [5.38, 0, 0.7], // forward-down, continuing the swing
      elbowR: [-0.4, 0, 0],
      shoulderL: [0.3, 0, 0.3],
      elbowL: [-1.0, 0, 0],
      hipR: [-0.9, 0, 0],
      kneeR: [1.0, 0, 0],
      hipL: [0.1, 0, 0],
      kneeL: [0.9, 0, 0],
    },
  },
  /** Balanced landing. */
  land: {
    rootY: 0.86,
    rootZ: 0.45,
    joints: {
      hips: [0.15, 0.3, 0],
      spine: [0.25, 0.1, 0],
      chest: [0.1, 0.1, 0],
      neck: [-0.1, 0, 0],
      shoulderR: [5.78, 0, 0.4],
      elbowR: [-0.5, 0, 0],
      shoulderL: [0.1, 0, 0.25],
      elbowL: [-0.6, 0, 0],
      hipR: [-0.8, 0, 0],
      kneeR: [1.1, 0, 0],
      hipL: [-0.2, 0, 0],
      kneeL: [0.7, 0, 0],
    },
  },
} satisfies Record<string, Pose>;

export type SmashPoseName = keyof typeof SMASH_POSES;

// Kit palette (site accent on trims). Skin is a neutral warm tone; the athlete stays faceless.
const KIT = {
  skin: "#8a5a3c",
  shirt: "#eceff3",
  shorts: "#15171b",
  sock: "#f3f4f6",
  shoe: "#f5f6f8",
  accent: "#10b981",
  hair: "#0e0e10",
} as const;

export function buildAthleteRig(detail: "high" | "low"): AthleteRig {
  const radial = detail === "high" ? 20 : 10;
  const geometries: BufferGeometry[] = [];
  const mat = {
    skin: new MeshPhysicalMaterial({ color: KIT.skin, roughness: 0.55, sheen: 0.4, sheenColor: "#d9a184", sheenRoughness: 0.6 }),
    shirt: new MeshPhysicalMaterial({ color: KIT.shirt, roughness: 0.75, sheen: 0.6, sheenColor: "#ffffff", sheenRoughness: 0.8 }),
    shorts: new MeshPhysicalMaterial({ color: KIT.shorts, roughness: 0.7, sheen: 0.5, sheenColor: "#3a3f47" }),
    sock: new MeshPhysicalMaterial({ color: KIT.sock, roughness: 0.85 }),
    shoe: new MeshPhysicalMaterial({ color: KIT.shoe, roughness: 0.35, clearcoat: 0.6 }),
    accent: new MeshPhysicalMaterial({ color: KIT.accent, roughness: 0.4, emissive: KIT.accent, emissiveIntensity: 0.25 }),
    hair: new MeshPhysicalMaterial({ color: KIT.hair, roughness: 0.9, sheen: 0.3, sheenColor: "#333333" }),
  };

  const joint = (parent: Object3D, x: number, y: number, z = 0) => {
    const o = new Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const add = (parent: Object3D, geometry: BufferGeometry, material: MeshPhysicalMaterial, position: [number, number, number] = [0, 0, 0]) => {
    geometries.push(geometry);
    const m = new Mesh(geometry, material);
    m.position.set(...position);
    parent.add(m);
    return m;
  };
  /** Tapered segment hanging down from its joint, from `y0` to `y1` (negative = down). */
  const segment = (parent: Object3D, rTop: number, rBottom: number, y0: number, y1: number, material: MeshPhysicalMaterial) =>
    add(parent, new CylinderGeometry(rTop, rBottom, Math.abs(y1 - y0), radial, 1), material, [0, (y0 + y1) / 2, 0]);
  const ball = (parent: Object3D, r: number, material: MeshPhysicalMaterial, position: [number, number, number] = [0, 0, 0]) =>
    add(parent, new SphereGeometry(r, radial, Math.max(6, radial / 2)), material, position);

  const root = new Group();
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);

  // Hips + skort: fitted waist flaring into a short pleat-free skirt over shorts.
  const pelvis = segment(hips, 0.132, 0.158, 0.1, -0.06, mat.shorts);
  pelvis.scale.z = 0.74;
  const skirt = add(hips, new CylinderGeometry(0.158, 0.205, 0.17, radial, 1, true), mat.shorts, [0, -0.135, 0]);
  skirt.scale.z = 0.8;
  (skirt.material as MeshPhysicalMaterial).side = DoubleSide;
  // Accent hem on the skort.
  const hem = add(hips, new TorusGeometry(0.205, 0.006, 6, radial), mat.accent, [0, -0.22, 0]);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1, 0.8, 1);

  // Torso: waist → chest → shoulders, shirt.
  const spine = joint(hips, 0, 0.08);
  segment(spine, 0.13, 0.135, 0.24, -0.02, mat.shirt).scale.z = 0.7; // waist
  const chest = joint(spine, 0, 0.24);
  segment(chest, 0.165, 0.13, 0.24, 0, mat.shirt).scale.z = 0.64;
  // Shoulder caps round the silhouette.
  ball(chest, 0.062, mat.shirt, [-SHOULDER_HALF_SPAN, 0.2, 0]);
  ball(chest, 0.062, mat.shirt, [SHOULDER_HALF_SPAN, 0.2, 0]);
  // Accent collar.
  const collar = add(chest, new TorusGeometry(0.052, 0.01, 8, radial), mat.accent, [0, 0.245, 0]);
  collar.rotation.x = Math.PI / 2;

  // Neck + faceless head with hair and an accent headband.
  const neck = joint(chest, 0, 0.27);
  segment(neck, 0.04, 0.046, 0.09, -0.01, mat.skin);
  const head = ball(neck, 0.096, mat.skin, [0, 0.17, 0]);
  head.scale.set(0.86, 1.1, 0.95);
  const hair = add(neck, new SphereGeometry(0.104, radial, Math.max(6, radial / 2), 0, Math.PI * 2, 0, Math.PI * 0.55), mat.hair, [0, 0.18, -0.006]);
  hair.scale.set(0.9, 1.08, 0.98);
  const headband = add(neck, new TorusGeometry(0.093, 0.011, 8, radial), mat.accent, [0, 0.2, 0]);
  headband.rotation.x = Math.PI / 2 - 0.12;
  headband.scale.set(0.92, 1, 1);
  // Ponytail: tie + tapered tail from the back of the head.
  ball(neck, 0.026, mat.accent, [0, 0.2, -0.1]);
  const tail = add(neck, new CylinderGeometry(0.03, 0.012, 0.22, radial, 1), mat.hair, [0, 0.1, -0.13]);
  tail.rotation.x = 0.35;

  const arm = (side: 1 | -1, racketArm: boolean) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);
    segment(shoulder, 0.056, 0.052, 0.01, -0.12, mat.shirt); // cap sleeve
    segment(shoulder, 0.044, 0.037, -0.1, -UPPER_ARM, mat.skin);
    const elbow = joint(shoulder, 0, -UPPER_ARM);
    ball(elbow, 0.037, mat.skin);
    segment(elbow, 0.036, 0.028, 0, -FOREARM + 0.02, mat.skin);
    if (racketArm) segment(elbow, 0.033, 0.031, -FOREARM + 0.06, -FOREARM + 0.015, mat.accent); // wristband
    const hand = ball(elbow, 0.037, mat.skin, [0, -FOREARM - 0.025, 0]);
    hand.scale.set(0.82, 1.25, 0.62);
    return { shoulder, elbow };
  };
  const right = arm(-1, true);
  const left = arm(1, false);

  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);
    segment(hip, 0.078, 0.07, 0.02, -0.12, mat.shorts); // under-shorts
    segment(hip, 0.066, 0.05, -0.1, -THIGH, mat.skin);
    const knee = joint(hip, 0, -THIGH);
    ball(knee, 0.05, mat.skin);
    segment(knee, 0.049, 0.037, 0, -0.27, mat.skin);
    segment(knee, 0.04, 0.034, -0.25, -SHIN + 0.02, mat.sock);
    // Court shoe: rounded body + accent sole.
    const shoe = add(knee, new CapsuleGeometry(0.045, 0.16, 4, radial), mat.shoe, [0, -SHIN - 0.005, 0.055]);
    shoe.rotation.x = Math.PI / 2;
    shoe.scale.set(1.05, 1, 0.82);
    add(knee, new BoxGeometry(0.085, 0.016, 0.25), mat.accent, [0, -SHIN - 0.045, 0.055]);
    return { hip, knee };
  };
  const rightLeg = leg(-1);
  const leftLeg = leg(1);

  // Grip point: at the hand, +Y pointing out along the forearm (the racket's long axis).
  const handAnchor = joint(right.elbow, 0, -FOREARM - 0.02);
  handAnchor.rotation.set(Math.PI, 0, 0);

  root.traverse((o) => {
    if (o instanceof Mesh) o.castShadow = true;
  });

  return {
    root,
    handAnchor,
    joints: {
      hips,
      spine,
      chest,
      neck,
      shoulderR: right.shoulder,
      elbowR: right.elbow,
      shoulderL: left.shoulder,
      elbowL: left.elbow,
      hipR: rightLeg.hip,
      kneeR: rightLeg.knee,
      hipL: leftLeg.hip,
      kneeL: leftLeg.knee,
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      Object.values(mat).forEach((m) => m.dispose());
    },
  };
}

/** Writes a blend of two poses (f = 0 → a, 1 → b) onto the rig. */
export function applyPoseBlend(rig: AthleteRig, a: Pose, b: Pose, f: number) {
  const lerp = (x: number, y: number) => x + (y - x) * f;
  rig.joints.hips.position.y = lerp(a.rootY, b.rootY);
  rig.root.position.z = lerp(a.rootZ, b.rootZ);
  for (const name of JOINT_NAMES) {
    const ra = a.joints[name];
    const rb = b.joints[name];
    rig.joints[name].rotation.set(lerp(ra[0], rb[0]), lerp(ra[1], rb[1]), lerp(ra[2], rb[2]));
  }
}
