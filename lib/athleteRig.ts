import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
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
 * Pro-class human badminton athlete rig.
 * Modelled in metres facing +Z, right-handed (racket arm on -X).
 * Features realistic human anatomy, professional tournament t-shirt with
 * aerodynamic chest graphics, match competition shorts, and tournament court shoes.
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

  // 1. Natural Human Skin Material (warm athletic skin with subtle subsurface sheen)
  const skinMat = new MeshPhysicalMaterial({
    color: "#c68d6f",
    roughness: 0.52,
    metalness: 0.04,
    sheen: 0.45,
    sheenColor: "#ffcfb5",
    sheenRoughness: 0.35,
  });
  materials.push(skinMat);

  // 2. Pro Athletic Hair (dark espresso athletic fade haircut)
  const hairMat = new MeshStandardMaterial({
    color: "#181513",
    roughness: 0.72,
    metalness: 0.08,
  });
  materials.push(hairMat);

  // 3. Pro Tournament Jersey T-Shirt Body (technical performance obsidian fabric)
  const tshirtMat = new MeshStandardMaterial({
    color: "#0f131a",
    roughness: 0.65,
    metalness: 0.06,
  });
  materials.push(tshirtMat);

  // 4. Jersey Breathable Side Mesh Panels
  const tshirtMeshMat = new MeshStandardMaterial({
    color: "#1a212d",
    roughness: 0.85,
    metalness: 0.04,
  });
  materials.push(tshirtMeshMat);

  // 5. Electric Court Emerald Accent Trim (chevron graphics, collar, cuffs)
  const accentMat = new MeshStandardMaterial({
    color: "#10B981",
    emissive: "#10B981",
    emissiveIntensity: 0.3,
    roughness: 0.35,
    metalness: 0.15,
  });
  materials.push(accentMat);

  // 6. Tournament Crest White Trim (secondary racing stripe, crest badge)
  const whiteMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.4,
    metalness: 0.05,
  });
  materials.push(whiteMat);

  // 7. Pro Competition Match Shorts
  const shortsMat = new MeshStandardMaterial({
    color: "#151821",
    roughness: 0.68,
    metalness: 0.06,
  });
  materials.push(shortsMat);

  // 8. Elastic Ribbed Waistband
  const waistMat = new MeshStandardMaterial({
    color: "#222735",
    roughness: 0.8,
    metalness: 0.05,
  });
  materials.push(waistMat);

  // 9. Technical Crew Socks
  const sockMat = new MeshStandardMaterial({
    color: "#f1f5f9",
    roughness: 0.75,
    metalness: 0.02,
  });
  materials.push(sockMat);

  // 10. Tournament Court Shoes - Synthetic White Leather Upper
  const shoeUpperMat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.32,
    metalness: 0.1,
  });
  materials.push(shoeUpperMat);

  // 11. Shoes - Dark Graphite Carbon Quarter & Shank Plate
  const shoeGraphiteMat = new MeshStandardMaterial({
    color: "#1e2430",
    roughness: 0.45,
    metalness: 0.25,
  });
  materials.push(shoeGraphiteMat);

  // 12. Shoes - Sculpted EVA Cushion Midsole
  const shoeMidsoleMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.5,
  });
  materials.push(shoeMidsoleMat);

  // 13. Shoes - Authentic Non-Marking Gum Rubber Outsole
  const shoeGumSoleMat = new MeshStandardMaterial({
    color: "#d97706",
    roughness: 0.6,
    metalness: 0.04,
  });
  materials.push(shoeGumSoleMat);

  // 14. Shoes - Tournament Laces
  const shoeLacesMat = new MeshStandardMaterial({
    color: "#e2e8f0",
    roughness: 0.7,
  });
  materials.push(shoeLacesMat);

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
    scale: [number, number, number] = [1, 1, 1],
  ) => {
    geometries.push(geo);
    const m = new Mesh(geo, mat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
      m.scale.set(...scale);
    }
    parent.add(m);
    return m;
  };

  const root = new Group();

  // ==========================================
  // HIPS & PELVIS (Shorts Waistband & Crotch)
  // ==========================================
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);

  // Pelvis bridge / shorts seat
  addMesh(hips, new CapsuleGeometry(0.108, 0.12, capSeg, radial), shortsMat, [0, 0, 0], [0, 0, Math.PI / 2]);

  // Ribbed elastic waistband
  addMesh(hips, new CylinderGeometry(0.122, 0.122, 0.04, radial), waistMat, [0, 0.045, 0]);
  // Waistband emerald accent rim
  addMesh(hips, new TorusGeometry(0.123, 0.006, 6, radial), accentMat, [0, 0.045, 0], [Math.PI / 2, 0, 0]);
  // Drawcord aglets at center front
  addMesh(hips, new CylinderGeometry(0.003, 0.003, 0.035, 6), accentMat, [0.008, 0.02, 0.12], [0.15, 0, -0.1]);
  addMesh(hips, new CylinderGeometry(0.003, 0.003, 0.035, 6), accentMat, [-0.008, 0.02, 0.12], [0.15, 0, 0.1]);

  // ==========================================
  // SPINE & LOWER T-SHIRT TORSO
  // ==========================================
  const spine = joint(hips, 0, 0.08);

  // T-Shirt lower body (tapered athletic waist)
  addMesh(spine, new CapsuleGeometry(0.126, 0.13, capSeg, radial), tshirtMat, [0, 0.1, 0]);

  // T-Shirt lower hem (drapes naturally over the shorts waistband)
  addMesh(spine, new CylinderGeometry(0.132, 0.136, 0.035, radial), tshirtMat, [0, 0.015, 0]);
  // T-Shirt hem piping line
  addMesh(spine, new TorusGeometry(0.136, 0.005, 6, radial), accentMat, [0, -0.002, 0], [Math.PI / 2, 0, 0]);

  // Breathable side ventilation mesh panels along rib flanks
  addMesh(spine, new BoxGeometry(0.012, 0.16, 0.14), tshirtMeshMat, [-0.126, 0.1, 0]);
  addMesh(spine, new BoxGeometry(0.012, 0.16, 0.14), tshirtMeshMat, [0.126, 0.1, 0]);

  // Dynamic tournament graphic slash across lower torso
  addMesh(spine, new BoxGeometry(0.2, 0.014, 0.008), accentMat, [0, 0.09, 0.124], [0, 0, 0.35]);

  // ==========================================
  // CHEST & UPPER T-SHIRT TORSO
  // ==========================================
  const chest = joint(spine, 0, 0.24);

  // Contoured athletic chest (pectoral & lat flare)
  addMesh(
    chest,
    new CapsuleGeometry(0.146, 0.13, capSeg, radial),
    tshirtMat,
    [0, 0.06, 0],
    [0, 0, 0],
    [1.18, 1, 0.84],
  );

  // Shoulders yoke bridging across upper chest
  addMesh(chest, new CapsuleGeometry(0.068, 0.33, capSeg, radial), tshirtMat, [0, 0.2, 0], [0, 0, Math.PI / 2]);

  // V-Neck / Crew collar with emerald ribbing
  addMesh(chest, new TorusGeometry(0.074, 0.011, 8, radial), accentMat, [0, 0.23, 0.02], [Math.PI / 2 - 0.25, 0, 0]);
  // Inner collar dark lining
  addMesh(chest, new CylinderGeometry(0.064, 0.064, 0.02, radial), tshirtMat, [0, 0.22, 0.02]);

  // Tournament Pro Diagonal Sash Graphics on front chest
  addMesh(chest, new BoxGeometry(0.24, 0.018, 0.008), accentMat, [-0.01, 0.13, 0.124], [0, 0, 0.38]);
  addMesh(chest, new BoxGeometry(0.22, 0.009, 0.008), whiteMat, [-0.01, 0.105, 0.124], [0, 0, 0.38]);

  // Tournament crest badge on left chest
  addMesh(chest, new BoxGeometry(0.035, 0.04, 0.006), whiteMat, [0.065, 0.145, 0.122]);
  addMesh(chest, new BoxGeometry(0.025, 0.03, 0.008), accentMat, [0.065, 0.145, 0.123]);

  // Upper back name / number plate
  addMesh(chest, new BoxGeometry(0.18, 0.05, 0.006), whiteMat, [0, 0.16, -0.122]);

  // ==========================================
  // NECK & REAL HUMAN HEAD
  // ==========================================
  const neck = joint(chest, 0, 0.27);

  // Muscular neck column
  addMesh(neck, new CylinderGeometry(0.044, 0.05, 0.08, radial), skinMat, [0, 0.035, 0]);
  // Trapezius muscle slope connecting neck into shoulders
  addMesh(neck, new ConeGeometry(0.072, 0.05, radial), skinMat, [0, 0.01, 0]);

  // Anatomical Head:
  // 1. Cranium
  addMesh(
    neck,
    new SphereGeometry(0.098, radial * 2, radial),
    skinMat,
    [0, 0.165, 0],
    [0, 0, 0],
    [0.88, 1.08, 0.96],
  );

  // 2. Athletic Jawline and Chin
  addMesh(neck, new BoxGeometry(0.062, 0.065, 0.075), skinMat, [0, 0.118, 0.03], [0.22, 0, 0]);

  // 3. Nose Bridge and Tip
  addMesh(neck, new ConeGeometry(0.016, 0.036, 4), skinMat, [0, 0.155, 0.096], [-Math.PI / 2, 0, 0]);

  // 4. Brow Ridge
  addMesh(neck, new BoxGeometry(0.09, 0.016, 0.02), skinMat, [0, 0.185, 0.08]);

  // 5. Ears
  addMesh(neck, new SphereGeometry(0.024, 8, 6), skinMat, [0.088, 0.16, -0.005], [0, 0, 0], [0.4, 1.2, 0.7]);
  addMesh(neck, new SphereGeometry(0.024, 8, 6), skinMat, [-0.088, 0.16, -0.005], [0, 0, 0], [0.4, 1.2, 0.7]);

  // Pro Athlete Fade Haircut:
  // Top & crown volume
  addMesh(
    neck,
    new SphereGeometry(0.102, radial * 2, radial, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hairMat,
    [0, 0.178, -0.008],
    [0, 0, 0],
    [0.92, 1.06, 0.98],
  );
  // Back & side tapered fade
  addMesh(neck, new CylinderGeometry(0.095, 0.086, 0.06, radial), hairMat, [0, 0.145, -0.018]);
  // Styled athletic front fringe
  addMesh(
    neck,
    new CapsuleGeometry(0.042, 0.065, 4, 8),
    hairMat,
    [0, 0.222, 0.02],
    [Math.PI / 2 - 0.2, 0, 0],
  );

  // Tournament Performance Sweatband / Headband
  addMesh(
    neck,
    new TorusGeometry(0.094, 0.012, 8, radial),
    accentMat,
    [0, 0.192, 0.01],
    [Math.PI / 2 - 0.12, 0, 0],
  );
  // Headband white racing center stripe
  addMesh(
    neck,
    new TorusGeometry(0.095, 0.004, 6, radial),
    whiteMat,
    [0, 0.192, 0.01],
    [Math.PI / 2 - 0.12, 0, 0],
  );

  // ==========================================
  // ARMS, T-SHIRT SLEEVES & HANDS
  // ==========================================
  const arm = (side: 1 | -1, isRacketArm: boolean) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);

    // Deltoid muscle base under sleeve
    addMesh(shoulder, new SphereGeometry(0.056, radial, radial), skinMat, [0, -0.02, 0]);

    // T-Shirt Short Sleeve (draped athletic cut)
    addMesh(shoulder, new CylinderGeometry(0.06, 0.055, 0.12, radial), tshirtMat, [0, -0.06, 0]);
    // Sleeve cuff accent stripe
    addMesh(shoulder, new TorusGeometry(0.056, 0.006, 6, radial), accentMat, [0, -0.118, 0], [Math.PI / 2, 0, 0]);

    // Muscular Bicep / Tricep
    addMesh(
      shoulder,
      new CapsuleGeometry(0.046, UPPER_ARM - 0.13, capSeg, radial),
      skinMat,
      [0, -UPPER_ARM / 2 - 0.02, 0],
    );

    const elbow = joint(shoulder, 0, -UPPER_ARM);

    // Anatomical Elbow Joint
    addMesh(elbow, new SphereGeometry(0.038, radial, radial / 2), skinMat, [0, 0, 0]);

    // Muscular Forearm (anatomical taper from brachioradialis to wrist)
    addMesh(elbow, new CylinderGeometry(0.041, 0.031, FOREARM - 0.08, radial), skinMat, [0, -FOREARM / 2 + 0.01, 0]);

    // Racket Arm: Tournament Terrycloth Wristband
    if (isRacketArm) {
      addMesh(elbow, new CylinderGeometry(0.036, 0.034, 0.05, radial), accentMat, [0, -FOREARM + 0.028, 0]);
      addMesh(elbow, new TorusGeometry(0.0365, 0.004, 6, radial), whiteMat, [0, -FOREARM + 0.028, 0], [Math.PI / 2, 0, 0]);
    } else {
      // Off-arm athlete silicone tournament band
      addMesh(elbow, new CylinderGeometry(0.033, 0.032, 0.015, radial), accentMat, [0, -FOREARM + 0.025, 0]);
    }

    // Anatomical Hand:
    // Palm
    addMesh(elbow, new BoxGeometry(0.056, 0.05, 0.028), skinMat, [0, -FOREARM - 0.024, 0]);

    // Opposed Thumb
    addMesh(
      elbow,
      new CapsuleGeometry(0.012, 0.032, 4, 6),
      skinMat,
      [-side * 0.028, -FOREARM - 0.018, 0.016],
      [0.3, 0, side * 0.4],
    );

    // Fingers
    if (isRacketArm) {
      // Curled fingers wrapped around the racket handle grip
      addMesh(
        elbow,
        new CapsuleGeometry(0.012, 0.046, 4, 6),
        skinMat,
        [0, -FOREARM - 0.045, -0.012],
        [0, 0, Math.PI / 2],
      );
      addMesh(
        elbow,
        new CapsuleGeometry(0.011, 0.042, 4, 6),
        skinMat,
        [0, -FOREARM - 0.036, 0.012],
        [0, 0, Math.PI / 2],
      );
    } else {
      // Left arm balance fingers: natural athletic extension for counter-balance
      addMesh(
        elbow,
        new CapsuleGeometry(0.011, 0.048, 4, 6),
        skinMat,
        [0, -FOREARM - 0.05, 0],
        [0.1, 0, 0],
      );
    }

    return { shoulder, elbow };
  };

  const right = arm(-1, true);
  const left = arm(1, false);

  // ==========================================
  // LEGS, SHORTS, SOCKS & COURT SHOES
  // ==========================================
  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);

    // Match Shorts Leg (athletic mid-thigh cut)
    addMesh(hip, new CylinderGeometry(0.086, 0.08, 0.17, radial), shortsMat, [0, -0.075, 0]);
    // Shorts side racing stripes (emerald + white)
    addMesh(hip, new BoxGeometry(0.008, 0.16, 0.02), accentMat, [side * 0.083, -0.075, 0]);
    addMesh(hip, new BoxGeometry(0.004, 0.16, 0.015), whiteMat, [side * 0.083, -0.075, 0.018]);
    // Shorts hem piping rim
    addMesh(hip, new TorusGeometry(0.081, 0.005, 6, radial), waistMat, [0, -0.158, 0], [Math.PI / 2, 0, 0]);

    // Exposed Muscular Quadriceps (powerful thigh below shorts)
    addMesh(
      hip,
      new CapsuleGeometry(0.064, THIGH - 0.18, capSeg, radial),
      skinMat,
      [0, -THIGH / 2 - 0.025, 0],
    );
    // Vastus Medialis muscle bulge (inner quad teardrop above knee)
    addMesh(hip, new SphereGeometry(0.036, radial, radial / 2), skinMat, [-side * 0.026, -THIGH + 0.06, 0.024]);

    const knee = joint(hip, 0, -THIGH);

    // Anatomical Patella (kneecap)
    addMesh(knee, new BoxGeometry(0.042, 0.046, 0.024), skinMat, [0, 0, 0.038]);

    // Muscular Gastrocnemius (Calf)
    addMesh(
      knee,
      new CapsuleGeometry(0.053, 0.18, capSeg, radial),
      skinMat,
      [0, -0.11, -0.012],
      [0, 0, 0],
      [0.95, 1, 1.1],
    );

    // Ankle Malleolus (inner/outer ankle bones)
    addMesh(knee, new SphereGeometry(0.018, 6, 6), skinMat, [0.036, -SHIN + 0.05, 0]);
    addMesh(knee, new SphereGeometry(0.018, 6, 6), skinMat, [-0.036, -SHIN + 0.05, 0]);

    // Technical Badminton Crew Sock
    addMesh(knee, new CylinderGeometry(0.043, 0.038, 0.16, radial), sockMat, [0, -SHIN + 0.085, 0]);
    // Sock cuff dual tournament stripes
    addMesh(knee, new TorusGeometry(0.0435, 0.004, 6, radial), accentMat, [0, -SHIN + 0.155, 0], [Math.PI / 2, 0, 0]);
    addMesh(knee, new TorusGeometry(0.0435, 0.004, 6, radial), tshirtMat, [0, -SHIN + 0.142, 0], [Math.PI / 2, 0, 0]);

    // ==========================================
    // PRO BADMINTON TOURNAMENT COURT SHOE
    // ==========================================
    // 1. Synthetic white leather upper body
    addMesh(knee, new BoxGeometry(0.096, 0.062, 0.23), shoeUpperMat, [0, -SHIN + 0.005, 0.055]);
    // 2. Aerodynamic toe box
    addMesh(
      knee,
      new CapsuleGeometry(0.046, 0.07, capSeg, radial),
      shoeUpperMat,
      [0, -SHIN + 0.005, 0.14],
      [Math.PI / 2, 0, 0],
    );

    // 3. Dark graphite carbon quarter panels (lateral & medial)
    addMesh(knee, new BoxGeometry(0.098, 0.04, 0.12), shoeGraphiteMat, [0, -SHIN + 0.01, 0.02]);

    // 4. Padded heel counter and ankle collar
    addMesh(
      knee,
      new CylinderGeometry(0.046, 0.044, 0.045, radial, 1, false, Math.PI / 2, Math.PI),
      shoeGraphiteMat,
      [0, -SHIN + 0.028, -0.04],
    );

    // 5. Shoe Tongue & Lacing Throat
    addMesh(knee, new BoxGeometry(0.042, 0.025, 0.12), shoeUpperMat, [0, -SHIN + 0.038, 0.065], [-0.22, 0, 0]);
    // Criss-cross laces
    for (let i = 0; i < 4; i++) {
      const zOffset = 0.03 + i * 0.026;
      const yOffset = 0.03 + (3 - i) * 0.005;
      addMesh(knee, new BoxGeometry(0.046, 0.006, 0.012), shoeLacesMat, [0, -SHIN + yOffset, zOffset]);
    }

    // 6. Lateral Claw / Power Cushion TPU Stability Wing (outer forefoot)
    addMesh(knee, new BoxGeometry(0.016, 0.038, 0.09), accentMat, [side * 0.05, -SHIN - 0.005, 0.075]);

    // 7. Sculpted EVA Cushion Midsole
    addMesh(knee, new BoxGeometry(0.1, 0.028, 0.25), shoeMidsoleMat, [0, -SHIN - 0.028, 0.055]);

    // 8. Carbon Midfoot Drive Shank Plate (under arch)
    addMesh(knee, new BoxGeometry(0.085, 0.015, 0.06), shoeGraphiteMat, [0, -SHIN - 0.032, 0.03]);

    // 9. Non-Marking Amber Gum Rubber Outsole
    addMesh(knee, new BoxGeometry(0.102, 0.015, 0.255), shoeGumSoleMat, [0, -SHIN - 0.044, 0.055]);
    // Outsole toe bumper wrapping over the front tip
    addMesh(knee, new BoxGeometry(0.085, 0.028, 0.025), shoeGumSoleMat, [0, -SHIN - 0.02, 0.175]);

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
