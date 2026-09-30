import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  SphereGeometry,
  type BufferGeometry,
} from "three";

/**
 * Anonymous, faceless athlete silhouette built from primitives (metres, facing +Z,
 * right-handed so the racket arm is on -X). Deliberately generic: no face, no
 * kit, no likeness of any real player.
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
const SHOULDER_HALF_SPAN = 0.2;
const HIP_HALF_SPAN = 0.095;

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

export function buildAthleteRig(detail: "high" | "low"): AthleteRig {
  const capSeg = detail === "high" ? 6 : 3;
  const radial = detail === "high" ? 12 : 6;
  const geometries: BufferGeometry[] = [];
  const material = new MeshPhysicalMaterial({
    color: "#08080a",
    roughness: 0.6,
    metalness: 0.1,
    sheen: 0.55,
    sheenColor: "#10B981",
    sheenRoughness: 0.35,
  });

  const joint = (parent: Object3D, x: number, y: number, z = 0) => {
    const o = new Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const limb = (parent: Object3D, radius: number, length: number, centreY: number) => {
    const g = new CapsuleGeometry(radius, length, capSeg, radial);
    geometries.push(g);
    const m = new Mesh(g, material);
    m.position.y = centreY;
    parent.add(m);
    return m;
  };

  const root = new Group();
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);
  const pelvis = limb(hips, 0.1, 0.1, 0);
  pelvis.rotation.z = Math.PI / 2;

  const spine = joint(hips, 0, 0.08);
  limb(spine, 0.12, 0.12, 0.1);
  const chest = joint(spine, 0, 0.24);
  const torso = limb(chest, 0.14, 0.12, 0.06);
  torso.scale.set(1.15, 1, 0.8);
  const shoulders = limb(chest, 0.065, 0.3, 0.2);
  shoulders.rotation.z = Math.PI / 2;

  const neck = joint(chest, 0, 0.27);
  limb(neck, 0.045, 0.05, 0.03);
  const headGeo = new SphereGeometry(0.105, radial * 2, radial);
  geometries.push(headGeo);
  const head = new Mesh(headGeo, material);
  head.position.y = 0.16;
  head.scale.set(0.92, 1.12, 1);
  neck.add(head);

  const arm = (side: 1 | -1) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);
    limb(shoulder, 0.048, UPPER_ARM - 0.08, -UPPER_ARM / 2);
    const elbow = joint(shoulder, 0, -UPPER_ARM);
    limb(elbow, 0.04, FOREARM - 0.07, -FOREARM / 2);
    const handGeo = new SphereGeometry(0.045, radial, radial / 2);
    geometries.push(handGeo);
    const hand = new Mesh(handGeo, material);
    hand.position.y = -FOREARM - 0.02;
    elbow.add(hand);
    return { shoulder, elbow };
  };
  const right = arm(-1);
  const left = arm(1);

  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);
    limb(hip, 0.068, THIGH - 0.12, -THIGH / 2);
    const knee = joint(hip, 0, -THIGH);
    limb(knee, 0.052, SHIN - 0.1, -SHIN / 2);
    const footGeo = new BoxGeometry(0.09, 0.06, 0.25);
    geometries.push(footGeo);
    const foot = new Mesh(footGeo, material);
    foot.position.set(0, -SHIN, 0.06);
    knee.add(foot);
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
      material.dispose();
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
