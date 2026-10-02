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
 * World-Class Pro Badminton Athlete Rig (Olympic / BWF World Tour Standard).
 * Modelled in metres facing +Z, right-handed (racket arm on -X).
 *
 * Inspired by world champions (Shi Yuqi, Loh Kean Yew, Chou Tien-chen, Lakshya Sen):
 * - Authentic human facial features (eyes, nose, lips, jawline, ears) & modern athletic fade haircut (no headband).
 * - Muscular badminton player anatomy (trapezius, defined biceps, articulated fingers, vascular/teardrop quads, calves).
 * - Pro tournament technical t-shirt with dynamic speed-slash graphics, V-neck, short sleeves, and chest/back tournament badges.
 * - Competition match shorts with side speed chevrons and split-hem.
 * - Yonex Power Cushion style badminton tournament shoes with gum rubber soles, carbon shank, and lateral stability claw.
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

  // ==========================================
  // MATERIALS PALETTE (World Tour Standard)
  // ==========================================

  // 1. Natural Athletic Human Skin (warm natural Asian/Indian athlete tone)
  const skinMat = new MeshPhysicalMaterial({
    color: "#d09575",
    roughness: 0.5,
    metalness: 0.04,
    sheen: 0.42,
    sheenColor: "#ffc2a8",
    sheenRoughness: 0.35,
  });
  materials.push(skinMat);

  // 2. Realistic Eyeball Sclera
  const eyeWhiteMat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.18,
    metalness: 0.02,
  });
  materials.push(eyeWhiteMat);

  // 3. Dark Iris & Pupil (focused tournament intensity)
  const irisMat = new MeshStandardMaterial({
    color: "#1c1410",
    roughness: 0.2,
    metalness: 0.1,
  });
  materials.push(irisMat);

  // 4. Natural Lips
  const lipMat = new MeshStandardMaterial({
    color: "#b87060",
    roughness: 0.55,
    metalness: 0.02,
  });
  materials.push(lipMat);

  // 5. Pro Athlete Tapered Haircut (espresso/dark black)
  const hairMat = new MeshStandardMaterial({
    color: "#161311",
    roughness: 0.65,
    metalness: 0.12,
  });
  materials.push(hairMat);

  // 6. Pro Tournament T-Shirt - Obsidian Body
  const jerseyBaseMat = new MeshStandardMaterial({
    color: "#0c1018",
    roughness: 0.62,
    metalness: 0.06,
  });
  materials.push(jerseyBaseMat);

  // 7. Tournament Electric Cyan Speed Graphics
  const jerseyCyanMat = new MeshStandardMaterial({
    color: "#06b6d4",
    roughness: 0.35,
    metalness: 0.15,
    emissive: "#06b6d4",
    emissiveIntensity: 0.28,
  });
  materials.push(jerseyCyanMat);

  // 8. Tournament Court Emerald Speed Graphics
  const jerseyEmeraldMat = new MeshStandardMaterial({
    color: "#10b981",
    roughness: 0.35,
    metalness: 0.15,
    emissive: "#10b981",
    emissiveIntensity: 0.28,
  });
  materials.push(jerseyEmeraldMat);

  // 9. Tournament Crest White Accents
  const whiteMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.38,
    metalness: 0.05,
  });
  materials.push(whiteMat);

  // 10. Breathable Flank Mesh Panels
  const jerseyMeshMat = new MeshStandardMaterial({
    color: "#161c28",
    roughness: 0.85,
    metalness: 0.04,
  });
  materials.push(jerseyMeshMat);

  // 11. Competition Match Shorts (matte performance black)
  const shortsBaseMat = new MeshStandardMaterial({
    color: "#0e1117",
    roughness: 0.68,
    metalness: 0.05,
  });
  materials.push(shortsBaseMat);

  // 12. Shorts Elastic Waistband
  const shortsWaistMat = new MeshStandardMaterial({
    color: "#1a1f2c",
    roughness: 0.78,
    metalness: 0.04,
  });
  materials.push(shortsWaistMat);

  // 13. Knee Kinesiology Tape (Cyan pro athletic tape)
  const kinesioTapeMat = new MeshStandardMaterial({
    color: "#06b6d4",
    roughness: 0.85,
    metalness: 0.02,
  });
  materials.push(kinesioTapeMat);

  // 14. Mid-Calf Technical Tournament Socks
  const sockMat = new MeshStandardMaterial({
    color: "#f1f5f9",
    roughness: 0.75,
    metalness: 0.02,
  });
  materials.push(sockMat);

  // 15. Pro Court Shoes - Premium White Synthetic Upper
  const shoeUpperMat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.32,
    metalness: 0.1,
  });
  materials.push(shoeUpperMat);

  // 16. Shoes - Carbon Graphite Shank & Quarter Panels
  const shoeCarbonMat = new MeshStandardMaterial({
    color: "#181d26",
    roughness: 0.45,
    metalness: 0.25,
  });
  materials.push(shoeCarbonMat);

  // 17. Shoes - Sculpted EVA Cushion Midsole
  const shoeMidsoleMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.5,
  });
  materials.push(shoeMidsoleMat);

  // 18. Shoes - Authentic Non-Marking Amber Gum Rubber Outsole
  const shoeGumSoleMat = new MeshStandardMaterial({
    color: "#d97706",
    roughness: 0.58,
    metalness: 0.04,
  });
  materials.push(shoeGumSoleMat);

  // 19. Shoes - Power Cushion TPU Lateral Stability Claw
  const shoeClawMat = new MeshStandardMaterial({
    color: "#10b981",
    roughness: 0.25,
    metalness: 0.2,
    emissive: "#10b981",
    emissiveIntensity: 0.35,
  });
  materials.push(shoeClawMat);

  // 20. Shoes - Tournament Laces
  const shoeLacesMat = new MeshStandardMaterial({
    color: "#e2e8f0",
    roughness: 0.7,
  });
  materials.push(shoeLacesMat);

  // 21. Racket Arm Terrycloth Wristband
  const wristbandMat = new MeshStandardMaterial({
    color: "#0f131b",
    roughness: 0.85,
  });
  materials.push(wristbandMat);

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
  // HIPS & PELVIS (Match Shorts Waistband & Seat)
  // ==========================================
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);

  // Pelvis bridge / shorts seat
  addMesh(hips, new CapsuleGeometry(0.108, 0.12, capSeg, radial), shortsBaseMat, [0, 0, 0], [0, 0, Math.PI / 2]);

  // Ribbed elastic waistband
  addMesh(hips, new CylinderGeometry(0.122, 0.122, 0.04, radial), shortsWaistMat, [0, 0.045, 0]);
  // Waistband emerald accent rim
  addMesh(hips, new TorusGeometry(0.123, 0.006, 6, radial), jerseyEmeraldMat, [0, 0.045, 0], [Math.PI / 2, 0, 0]);
  // Drawcord aglets at center front
  addMesh(hips, new CylinderGeometry(0.003, 0.003, 0.035, 6), jerseyCyanMat, [0.008, 0.02, 0.12], [0.15, 0, -0.1]);
  addMesh(hips, new CylinderGeometry(0.003, 0.003, 0.035, 6), jerseyCyanMat, [-0.008, 0.02, 0.12], [0.15, 0, 0.1]);

  // ==========================================
  // SPINE & LOWER T-SHIRT TORSO
  // ==========================================
  const spine = joint(hips, 0, 0.08);

  // T-Shirt lower body (tapered athletic core)
  addMesh(spine, new CapsuleGeometry(0.126, 0.13, capSeg, radial), jerseyBaseMat, [0, 0.1, 0]);

  // T-Shirt lower hem (drapes naturally over the shorts waistband)
  addMesh(spine, new CylinderGeometry(0.132, 0.136, 0.035, radial), jerseyBaseMat, [0, 0.015, 0]);
  // T-Shirt hem piping line
  addMesh(spine, new TorusGeometry(0.136, 0.005, 6, radial), jerseyCyanMat, [0, -0.002, 0], [Math.PI / 2, 0, 0]);

  // Breathable side ventilation mesh panels along rib flanks
  addMesh(spine, new BoxGeometry(0.012, 0.16, 0.14), jerseyMeshMat, [-0.126, 0.1, 0]);
  addMesh(spine, new BoxGeometry(0.012, 0.16, 0.14), jerseyMeshMat, [0.126, 0.1, 0]);

  // Dynamic tournament speed slash continuing down front torso
  addMesh(spine, new BoxGeometry(0.2, 0.016, 0.008), jerseyCyanMat, [0, 0.09, 0.124], [0, 0, 0.35]);
  addMesh(spine, new BoxGeometry(0.18, 0.012, 0.008), jerseyEmeraldMat, [0, 0.07, 0.124], [0, 0, 0.35]);

  // ==========================================
  // CHEST & UPPER T-SHIRT TORSO
  // ==========================================
  const chest = joint(spine, 0, 0.24);

  // Contoured athletic chest (pectoral & lat flare)
  addMesh(
    chest,
    new CapsuleGeometry(0.146, 0.13, capSeg, radial),
    jerseyBaseMat,
    [0, 0.06, 0],
    [0, 0, 0],
    [1.18, 1, 0.84],
  );

  // Shoulders yoke bridging across upper chest
  addMesh(chest, new CapsuleGeometry(0.068, 0.33, capSeg, radial), jerseyBaseMat, [0, 0.2, 0], [0, 0, Math.PI / 2]);

  // Tailored V-Neck collar with contrast cyan/emerald piping
  addMesh(chest, new TorusGeometry(0.074, 0.01, 8, radial), jerseyEmeraldMat, [0, 0.23, 0.02], [Math.PI / 2 - 0.25, 0, 0]);
  addMesh(chest, new TorusGeometry(0.068, 0.005, 6, radial), jerseyCyanMat, [0, 0.228, 0.022], [Math.PI / 2 - 0.25, 0, 0]);
  addMesh(chest, new CylinderGeometry(0.062, 0.062, 0.02, radial), jerseyBaseMat, [0, 0.218, 0.02]);

  // Dynamic Tournament Chest Graphics (Multi-layered Speed Sash as in reference photos)
  addMesh(chest, new BoxGeometry(0.24, 0.022, 0.008), jerseyCyanMat, [-0.01, 0.138, 0.124], [0, 0, 0.38]);
  addMesh(chest, new BoxGeometry(0.23, 0.018, 0.008), jerseyEmeraldMat, [-0.01, 0.112, 0.124], [0, 0, 0.38]);
  addMesh(chest, new BoxGeometry(0.21, 0.008, 0.008), whiteMat, [-0.01, 0.088, 0.124], [0, 0, 0.38]);

  // Tournament Crest Badge on Left Chest
  addMesh(chest, new BoxGeometry(0.034, 0.038, 0.006), whiteMat, [0.066, 0.15, 0.122]);
  addMesh(chest, new BoxGeometry(0.024, 0.028, 0.008), jerseyCyanMat, [0.066, 0.15, 0.123]);

  // Back Player Name & Number Plate ("HENSIYA" as seen on Lakshya Sen reference photo)
  addMesh(chest, new BoxGeometry(0.18, 0.045, 0.006), whiteMat, [0, 0.165, -0.122]);
  addMesh(chest, new BoxGeometry(0.12, 0.024, 0.006), jerseyCyanMat, [0, 0.125, -0.122]);

  // ==========================================
  // REAL HUMAN HEAD & FACE (World-Class Sculpt)
  // ==========================================
  const neck = joint(chest, 0, 0.27);

  // Muscular neck column
  addMesh(neck, new CylinderGeometry(0.043, 0.049, 0.085, radial), skinMat, [0, 0.035, 0]);
  // Sternocleidomastoid muscle cords angling down to sternum
  addMesh(neck, new CylinderGeometry(0.009, 0.007, 0.08, 6), skinMat, [0.022, 0.038, 0.026], [0.2, 0, -0.18]);
  addMesh(neck, new CylinderGeometry(0.009, 0.007, 0.08, 6), skinMat, [-0.022, 0.038, 0.026], [0.2, 0, 0.18]);
  // Adam's apple
  addMesh(neck, new SphereGeometry(0.008, 6, 6), skinMat, [0, 0.048, 0.044]);
  // Trapezius muscle slope connecting neck into shoulders
  addMesh(neck, new ConeGeometry(0.074, 0.055, radial), skinMat, [0, 0.01, 0]);

  // Anatomical Head:
  // 1. Cranium
  addMesh(
    neck,
    new SphereGeometry(0.096, 24, 16),
    skinMat,
    [0, 0.165, 0],
    [0, 0, 0],
    [0.88, 1.06, 0.98],
  );

  // 2. Forehead & Brow Ridge
  addMesh(neck, new BoxGeometry(0.082, 0.016, 0.03), skinMat, [0, 0.188, 0.076]);

  // 3. Eyebrows
  addMesh(neck, new BoxGeometry(0.032, 0.007, 0.008), hairMat, [0.024, 0.192, 0.088], [0, 0, -0.12]);
  addMesh(neck, new BoxGeometry(0.032, 0.007, 0.008), hairMat, [-0.024, 0.192, 0.088], [0, 0, 0.12]);

  // 4. Realistic Human Eyes (Sclera + Dark Iris & Pupil)
  // Left eye
  addMesh(neck, new SphereGeometry(0.012, 10, 8), eyeWhiteMat, [0.024, 0.178, 0.082], [0, 0, 0], [1.3, 0.85, 0.7]);
  addMesh(neck, new SphereGeometry(0.006, 8, 8), irisMat, [0.024, 0.178, 0.09]);
  // Right eye
  addMesh(neck, new SphereGeometry(0.012, 10, 8), eyeWhiteMat, [-0.024, 0.178, 0.082], [0, 0, 0], [1.3, 0.85, 0.7]);
  addMesh(neck, new SphereGeometry(0.006, 8, 8), irisMat, [-0.024, 0.178, 0.09]);

  // 5. Sculpted Human Nose (Bridge, Tip, Nostrils)
  addMesh(neck, new CylinderGeometry(0.007, 0.012, 0.032, 8), skinMat, [0, 0.162, 0.092], [-0.32, 0, 0]);
  addMesh(neck, new SphereGeometry(0.009, 8, 8), skinMat, [0, 0.148, 0.102]);
  addMesh(neck, new SphereGeometry(0.0055, 6, 6), skinMat, [0.011, 0.146, 0.096]);
  addMesh(neck, new SphereGeometry(0.0055, 6, 6), skinMat, [-0.011, 0.146, 0.096]);

  // 6. Mouth & Expressive Athletic Lips
  addMesh(neck, new BoxGeometry(0.028, 0.006, 0.008), lipMat, [0, 0.132, 0.09]);
  addMesh(neck, new BoxGeometry(0.026, 0.007, 0.009), lipMat, [0, 0.123, 0.088]);

  // 7. Sculpted Athletic Mandible, Chin & Cheekbones
  addMesh(neck, new BoxGeometry(0.056, 0.045, 0.065), skinMat, [0, 0.11, 0.042], [0.26, 0, 0]);
  addMesh(neck, new SphereGeometry(0.014, 8, 8), skinMat, [0, 0.096, 0.068]);
  addMesh(neck, new SphereGeometry(0.022, 8, 8), skinMat, [0.052, 0.158, 0.052], [0, 0, 0], [0.8, 1, 0.9]);
  addMesh(neck, new SphereGeometry(0.022, 8, 8), skinMat, [-0.052, 0.158, 0.052], [0, 0, 0], [0.8, 1, 0.9]);

  // 8. Human Ears
  addMesh(neck, new CylinderGeometry(0.016, 0.018, 0.038, 8), skinMat, [0.084, 0.165, -0.005], [0, 0, 0.15], [0.35, 1, 0.7]);
  addMesh(neck, new CylinderGeometry(0.016, 0.018, 0.038, 8), skinMat, [-0.084, 0.165, -0.005], [0, 0, -0.15], [0.35, 1, 0.7]);

  // 9. Modern Pro Badminton Fade Haircut (Loh Kean Yew / Lakshya Sen style)
  // Crown and top volume
  addMesh(
    neck,
    new SphereGeometry(0.101, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hairMat,
    [0, 0.178, -0.006],
    [0, 0, 0],
    [0.92, 1.08, 0.98],
  );
  // Back & side tapered high fade
  addMesh(neck, new CylinderGeometry(0.093, 0.084, 0.065, 18), hairMat, [0, 0.144, -0.016]);
  // Textured athletic front locks & sweep
  addMesh(
    neck,
    new CapsuleGeometry(0.038, 0.075, 4, 10),
    hairMat,
    [0.015, 0.224, 0.026],
    [Math.PI / 2 - 0.25, 0.15, -0.1],
  );
  addMesh(
    neck,
    new CapsuleGeometry(0.028, 0.065, 4, 8),
    hairMat,
    [-0.032, 0.22, 0.02],
    [Math.PI / 2 - 0.2, -0.2, 0.15],
  );

  // ==========================================
  // ARMS, T-SHIRT SLEEVES & HANDS
  // ==========================================
  const arm = (side: 1 | -1, isRacketArm: boolean) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);

    // Deltoid muscle base under sleeve
    addMesh(shoulder, new SphereGeometry(0.058, 14, 12), skinMat, [0, -0.02, 0]);

    // T-Shirt Short Sleeve (tailored athletic cut)
    addMesh(shoulder, new CylinderGeometry(0.062, 0.056, 0.125, radial), jerseyBaseMat, [0, -0.06, 0]);
    // Dual sleeve cuff stripes
    addMesh(shoulder, new TorusGeometry(0.057, 0.005, 6, radial), jerseyCyanMat, [0, -0.118, 0], [Math.PI / 2, 0, 0]);
    addMesh(shoulder, new TorusGeometry(0.057, 0.004, 6, radial), jerseyEmeraldMat, [0, -0.126, 0], [Math.PI / 2, 0, 0]);

    // Muscular Bicep & Tricep
    addMesh(
      shoulder,
      new CapsuleGeometry(0.046, UPPER_ARM - 0.13, capSeg, radial),
      skinMat,
      [0, -UPPER_ARM / 2 - 0.02, 0],
    );

    const elbow = joint(shoulder, 0, -UPPER_ARM);

    // Anatomical Elbow Joint
    addMesh(elbow, new SphereGeometry(0.038, 12, 8), skinMat, [0, 0, 0]);

    // Muscular Forearm (anatomical taper from brachioradialis to wrist)
    addMesh(elbow, new CylinderGeometry(0.042, 0.031, FOREARM - 0.08, radial), skinMat, [0, -FOREARM / 2 + 0.01, 0]);

    // Racket Arm: Pro Tournament Terrycloth Wristband
    if (isRacketArm) {
      addMesh(elbow, new CylinderGeometry(0.036, 0.034, 0.052, radial), wristbandMat, [0, -FOREARM + 0.028, 0]);
      addMesh(elbow, new TorusGeometry(0.0365, 0.004, 6, radial), jerseyCyanMat, [0, -FOREARM + 0.032, 0], [Math.PI / 2, 0, 0]);
      addMesh(elbow, new TorusGeometry(0.0365, 0.004, 6, radial), jerseyEmeraldMat, [0, -FOREARM + 0.024, 0], [Math.PI / 2, 0, 0]);
    } else {
      // Off-arm athlete silicone tournament band
      addMesh(elbow, new CylinderGeometry(0.033, 0.032, 0.016, radial), jerseyCyanMat, [0, -FOREARM + 0.025, 0]);
    }

    // Anatomical Hand:
    // Palm & Thenar muscle
    addMesh(elbow, new BoxGeometry(0.056, 0.052, 0.026), skinMat, [0, -FOREARM - 0.024, 0]);
    addMesh(elbow, new SphereGeometry(0.016, 6, 6), skinMat, [-side * 0.018, -FOREARM - 0.018, 0.012]);

    // Opposed Thumb
    addMesh(
      elbow,
      new CapsuleGeometry(0.011, 0.034, 4, 6),
      skinMat,
      [-side * 0.028, -FOREARM - 0.022, 0.016],
      [0.35, 0, side * 0.4],
    );

    // 4 Articulated Fingers
    if (isRacketArm) {
      // Racket hand: curled tightly around the handle grip
      addMesh(elbow, new CapsuleGeometry(0.01, 0.042, 4, 6), skinMat, [0, -FOREARM - 0.035, -0.012], [0, 0, Math.PI / 2]);
      addMesh(elbow, new CapsuleGeometry(0.01, 0.042, 4, 6), skinMat, [0, -FOREARM - 0.043, -0.01], [0, 0, Math.PI / 2]);
      addMesh(elbow, new CapsuleGeometry(0.009, 0.038, 4, 6), skinMat, [0, -FOREARM - 0.051, -0.008], [0, 0, Math.PI / 2]);
      addMesh(elbow, new CapsuleGeometry(0.008, 0.034, 4, 6), skinMat, [0, -FOREARM - 0.058, -0.006], [0, 0, Math.PI / 2]);
    } else {
      // Off-arm: natural athletic open counter-balance fingers
      addMesh(elbow, new CapsuleGeometry(0.009, 0.046, 4, 6), skinMat, [0.018, -FOREARM - 0.05, 0.004], [0.1, 0, -0.15]);
      addMesh(elbow, new CapsuleGeometry(0.009, 0.048, 4, 6), skinMat, [0.006, -FOREARM - 0.052, 0], [0.12, 0, 0]);
      addMesh(elbow, new CapsuleGeometry(0.0085, 0.044, 4, 6), skinMat, [-0.006, -FOREARM - 0.05, -0.004], [0.14, 0, 0.1]);
      addMesh(elbow, new CapsuleGeometry(0.008, 0.038, 4, 6), skinMat, [-0.018, -FOREARM - 0.046, -0.008], [0.18, 0, 0.22]);
    }

    return { shoulder, elbow };
  };

  const right = arm(-1, true);
  const left = arm(1, false);

  // ==========================================
  // LEGS, MUSCULAR QUADS, CALVES & COURT SHOES
  // ==========================================
  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);

    // Match Shorts Leg (athletic mid-thigh cut)
    addMesh(hip, new CylinderGeometry(0.086, 0.08, 0.17, radial), shortsBaseMat, [0, -0.075, 0]);
    // Dynamic Side Racing Chevrons (cyan + emerald + white as in reference photos)
    addMesh(hip, new BoxGeometry(0.008, 0.16, 0.02), jerseyCyanMat, [side * 0.083, -0.075, -0.008]);
    addMesh(hip, new BoxGeometry(0.006, 0.16, 0.016), jerseyEmeraldMat, [side * 0.083, -0.075, 0.012]);
    addMesh(hip, new BoxGeometry(0.003, 0.16, 0.01), whiteMat, [side * 0.083, -0.075, 0.026]);
    // Shorts hem piping rim
    addMesh(hip, new TorusGeometry(0.081, 0.005, 6, radial), shortsWaistMat, [0, -0.158, 0], [Math.PI / 2, 0, 0]);

    // Muscular Quadriceps (Explosive badminton power legs, inspired by Chou Tien-chen & Shi Yuqi)
    addMesh(
      hip,
      new CapsuleGeometry(0.065, THIGH - 0.18, capSeg, radial),
      skinMat,
      [0, -THIGH / 2 - 0.025, 0],
    );
    // Vastus Lateralis outer sweep
    addMesh(hip, new CapsuleGeometry(0.035, 0.16, 4, 8), skinMat, [side * 0.034, -THIGH / 2 - 0.01, 0]);
    // Vastus Medialis (prominent inner quad teardrop bulge right above kneecap)
    addMesh(hip, new SphereGeometry(0.038, 10, 8), skinMat, [-side * 0.028, -THIGH + 0.06, 0.024]);

    const knee = joint(hip, 0, -THIGH);

    // Anatomical Patella (kneecap)
    addMesh(knee, new BoxGeometry(0.044, 0.048, 0.024), skinMat, [0, 0, 0.038]);
    // Patellar tendon
    addMesh(knee, new BoxGeometry(0.022, 0.04, 0.01), skinMat, [0, -0.032, 0.036]);

    // Right Knee: Pro Athlete Kinesiology Support Tape (as seen on Loh Kean Yew in Photo 2)
    if (side === -1) {
      addMesh(knee, new BoxGeometry(0.026, 0.055, 0.004), kinesioTapeMat, [-0.015, -0.025, 0.042], [0, 0, -0.25]);
    }

    // Muscular Gastrocnemius (Diamond-shaped calf)
    addMesh(
      knee,
      new CapsuleGeometry(0.054, 0.185, capSeg, radial),
      skinMat,
      [0, -0.11, -0.012],
      [0, 0, 0],
      [0.95, 1, 1.12],
    );
    // Medial calf belly bulge
    addMesh(knee, new SphereGeometry(0.032, 8, 8), skinMat, [-side * 0.02, -0.1, -0.014]);
    // Achilles tendon
    addMesh(knee, new CylinderGeometry(0.018, 0.022, 0.12, 8), skinMat, [0, -0.22, -0.022]);

    // Ankle Malleolus (inner & outer ankle bones)
    addMesh(knee, new SphereGeometry(0.016, 6, 6), skinMat, [side * 0.036, -SHIN + 0.05, 0]);
    addMesh(knee, new SphereGeometry(0.016, 6, 6), skinMat, [-side * 0.036, -SHIN + 0.055, 0]);

    // Technical Badminton Crew Sock
    addMesh(knee, new CylinderGeometry(0.043, 0.038, 0.165, radial), sockMat, [0, -SHIN + 0.085, 0]);
    // Sock cuff dual tournament stripes
    addMesh(knee, new TorusGeometry(0.0435, 0.004, 6, radial), jerseyCyanMat, [0, -SHIN + 0.155, 0], [Math.PI / 2, 0, 0]);
    addMesh(knee, new TorusGeometry(0.0435, 0.004, 6, radial), jerseyEmeraldMat, [0, -SHIN + 0.142, 0], [Math.PI / 2, 0, 0]);

    // ==========================================
    // PRO BADMINTON TOURNAMENT COURT SHOE
    // (Yonex Power Cushion 65Z3 / Li-Ning World Tour)
    // ==========================================
    // 1. Synthetic white leather upper body
    addMesh(knee, new BoxGeometry(0.096, 0.062, 0.23), shoeUpperMat, [0, -SHIN + 0.005, 0.055]);
    // 2. Aerodynamic toe box curve
    addMesh(
      knee,
      new CapsuleGeometry(0.046, 0.072, capSeg, radial),
      shoeUpperMat,
      [0, -SHIN + 0.005, 0.14],
      [Math.PI / 2, 0, 0],
    );

    // 3. Dark graphite carbon quarter panels (lateral & medial)
    addMesh(knee, new BoxGeometry(0.098, 0.04, 0.12), shoeCarbonMat, [0, -SHIN + 0.01, 0.02]);

    // 4. Padded heel counter and ankle collar
    addMesh(
      knee,
      new CylinderGeometry(0.046, 0.044, 0.046, radial, 1, false, Math.PI / 2, Math.PI),
      shoeCarbonMat,
      [0, -SHIN + 0.028, -0.04],
    );

    // 5. Shoe Tongue & Lacing Throat
    addMesh(knee, new BoxGeometry(0.042, 0.025, 0.12), shoeUpperMat, [0, -SHIN + 0.038, 0.065], [-0.22, 0, 0]);
    // 4 Sets of Criss-Cross Tournament Laces
    for (let i = 0; i < 4; i++) {
      const zOffset = 0.03 + i * 0.026;
      const yOffset = 0.03 + (3 - i) * 0.005;
      addMesh(knee, new BoxGeometry(0.046, 0.006, 0.012), shoeLacesMat, [0, -SHIN + yOffset, zOffset]);
    }

    // 6. Lateral Claw / Power Cushion TPU Stability Wing (outer forefoot)
    addMesh(knee, new BoxGeometry(0.016, 0.038, 0.09), shoeClawMat, [side * 0.05, -SHIN - 0.005, 0.075]);

    // 7. Multi-Density Sculpted EVA Cushion Midsole
    addMesh(knee, new BoxGeometry(0.1, 0.028, 0.25), shoeMidsoleMat, [0, -SHIN - 0.028, 0.055]);

    // 8. Carbon Midfoot Drive Shank Plate (under arch)
    addMesh(knee, new BoxGeometry(0.085, 0.015, 0.06), shoeCarbonMat, [0, -SHIN - 0.032, 0.03]);

    // 9. Authentic Non-Marking Amber Gum Rubber Outsole
    addMesh(knee, new BoxGeometry(0.102, 0.015, 0.255), shoeGumSoleMat, [0, -SHIN - 0.044, 0.055]);
    // Outsole toe bumper wrapping over the front tip for court drag
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
