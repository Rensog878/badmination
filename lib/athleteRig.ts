import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
  type Material,
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
  const radial = detail === "high" ? 14 : 8;
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];

  // Athlete body: sleek graphite with iridescent electric green rim sheen
  const skinMat = new MeshPhysicalMaterial({
    color: "#121316",
    roughness: 0.45,
    metalness: 0.15,
    sheen: 0.85,
    sheenColor: "#10B981",
    sheenRoughness: 0.3,
  });
  materials.push(skinMat);

  // Performance athletic kit / jersey
  const kitMat = new MeshStandardMaterial({
    color: "#08090b",
    roughness: 0.75,
    metalness: 0.05,
  });
  materials.push(kitMat);

  // Compression shorts
  const shortsMat = new MeshStandardMaterial({
    color: "#14151a",
    roughness: 0.65,
    metalness: 0.1,
  });
  materials.push(shortsMat);

  // Tournament court shoes body
  const shoeMat = new MeshStandardMaterial({
    color: "#F3F4F6",
    roughness: 0.35,
    metalness: 0.15,
  });
  materials.push(shoeMat);

  // Performance socks
  const sockMat = new MeshStandardMaterial({
    color: "#E5E7EB",
    roughness: 0.7,
  });
  materials.push(sockMat);

  // Electric court-green accent trim (headband, wristband, sole, kit accents)
  const accentMat = new MeshStandardMaterial({
    color: "#10B981",
    emissive: "#10B981",
    emissiveIntensity: 0.4,
    roughness: 0.25,
    metalness: 0.2,
  });
  materials.push(accentMat);

  const joint = (parent: Object3D, x: number, y: number, z = 0) => {
    const o = new Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const addMesh = <G extends BufferGeometry, M extends Material>(
    parent: Object3D,
    geo: G,
    mat: M,
    pos: [number, number, number] = [0, 0, 0],
    rot: [number, number, number] = [0, 0, 0],
  ) => {
    geometries.push(geo);
    const m = new Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    parent.add(m);
    return m;
  };

  const root = new Group();

  // Hips & Pelvis
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);
  addMesh(hips, new CapsuleGeometry(0.105, 0.11, capSeg, radial), shortsMat, [0, 0, 0], [0, 0, Math.PI / 2]);
  // Compression shorts accent trim
  addMesh(hips, new TorusGeometry(0.106, 0.008, 6, radial), accentMat, [0, -0.06, 0], [Math.PI / 2, 0, 0]);

  // Spine & Waist
  const spine = joint(hips, 0, 0.08);
  addMesh(spine, new CapsuleGeometry(0.12, 0.12, capSeg, radial), kitMat, [0, 0.1, 0]);

  // Chest & Upper Torso
  const chest = joint(spine, 0, 0.24);
  const torso = addMesh(chest, new CapsuleGeometry(0.142, 0.12, capSeg, radial), kitMat, [0, 0.06, 0]);
  torso.scale.set(1.16, 1, 0.82);
  addMesh(chest, new CapsuleGeometry(0.065, 0.32, capSeg, radial), kitMat, [0, 0.2, 0], [0, 0, Math.PI / 2]);

  // Neck & Head
  const neck = joint(chest, 0, 0.27);
  addMesh(neck, new CapsuleGeometry(0.045, 0.05, capSeg, radial), skinMat, [0, 0.03, 0]);
  const head = addMesh(neck, new SphereGeometry(0.105, radial * 2, radial), skinMat, [0, 0.16, 0]);
  head.scale.set(0.92, 1.12, 1);
  // Aerodynamic athletic headband
  const headband = addMesh(neck, new TorusGeometry(0.096, 0.012, 8, radial), accentMat, [0, 0.2, 0]);
  headband.rotation.x = Math.PI / 2 - 0.12;

  // Arms
  const arm = (side: 1 | -1, isRacketArm: boolean) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);
    // Shoulder cap / armhole trim
    addMesh(shoulder, new CapsuleGeometry(0.056, 0.06, capSeg, radial), kitMat, [0, -0.04, 0]);
    // Bicep / tricep
    addMesh(shoulder, new CapsuleGeometry(0.046, UPPER_ARM - 0.1, capSeg, radial), skinMat, [0, -UPPER_ARM / 2, 0]);

    const elbow = joint(shoulder, 0, -UPPER_ARM);
    // Forearm
    addMesh(elbow, new CapsuleGeometry(0.038, FOREARM - 0.08, capSeg, radial), skinMat, [0, -FOREARM / 2, 0]);

    // Racket wristband on right arm
    if (isRacketArm) {
      addMesh(elbow, new CylinderGeometry(0.042, 0.04, 0.045, radial), accentMat, [0, -FOREARM + 0.025, 0]);
    }

    // Hand
    const hand = addMesh(elbow, new SphereGeometry(0.045, radial, radial / 2), skinMat, [0, -FOREARM - 0.02, 0]);
    hand.scale.set(0.85, 1.2, 0.7);

    return { shoulder, elbow };
  };
  const right = arm(-1, true);
  const left = arm(1, false);

  // Legs & Court Shoes
  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);
    // Upper thigh (compression shorts sleeve)
    addMesh(hip, new CapsuleGeometry(0.075, 0.09, capSeg, radial), shortsMat, [0, -0.06, 0]);
    // Lower thigh
    addMesh(hip, new CapsuleGeometry(0.062, THIGH - 0.16, capSeg, radial), skinMat, [0, -THIGH / 2 - 0.02, 0]);

    const knee = joint(hip, 0, -THIGH);
    // Calf / upper shin
    addMesh(knee, new CapsuleGeometry(0.049, SHIN - 0.22, capSeg, radial), skinMat, [0, -0.15, 0]);
    // Court sock
    addMesh(knee, new CylinderGeometry(0.044, 0.038, 0.14, radial), sockMat, [0, -SHIN + 0.07, 0]);

    // Badminton court shoe
    addMesh(knee, new BoxGeometry(0.092, 0.062, 0.24), shoeMat, [0, -SHIN, 0.06]);
    // Shoe sole plate with gum rubber accent
    addMesh(knee, new BoxGeometry(0.096, 0.016, 0.25), accentMat, [0, -SHIN - 0.035, 0.06]);
    // Heel accent trim
    addMesh(knee, new BoxGeometry(0.088, 0.03, 0.05), accentMat, [0, -SHIN + 0.01, -0.04]);

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
      materials.forEach((m) => m.dispose());
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
