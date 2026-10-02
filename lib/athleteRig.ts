import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
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
  // MATERIALS PALETTE: SAINA NEHWAL TOURNAMENT
  // ==========================================

  // 1. Saina Nehwal Authentic Skin Tone (warm golden tan #b98469)
  const skinMat = new MeshPhysicalMaterial({
    color: "#b98469",
    roughness: 0.65,
    metalness: 0.02,
    sheen: 0.25,
    sheenColor: "#cb8868",
    sheenRoughness: 0.45,
  });
  materials.push(skinMat);

  // 2. Realistic Eyeball Sclera
  const eyeWhiteMat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.15,
    metalness: 0.02,
  });
  materials.push(eyeWhiteMat);

  // 3. Dark Iris & Pupil
  const irisMat = new MeshStandardMaterial({
    color: "#140e0c",
    roughness: 0.15,
    metalness: 0.1,
  });
  materials.push(irisMat);

  // 4. Natural Lips & Smile Contour
  const lipMat = new MeshStandardMaterial({
    color: "#b86a58",
    roughness: 0.55,
    metalness: 0.02,
  });
  materials.push(lipMat);

  // 5. Saina's Signature Silver Hoop Earrings
  const silverMat = new MeshStandardMaterial({
    color: "#f1f5f9",
    roughness: 0.15,
    metalness: 0.95,
  });
  materials.push(silverMat);

  // 6. Photo-Accurate Facial Decal (Saina Nehwal: eyes, brows, nose, smile, teeth, left cheek mole)
  let faceTexture: Texture | null = null;
  let crestTexture: Texture | null = null;
  if (typeof window !== "undefined") {
    const loader = new TextureLoader();
    faceTexture = loader.load("/textures/saina_face_front_seamless.png");
    faceTexture.colorSpace = SRGBColorSpace;
    crestTexture = loader.load("/textures/saina_chest_crest.png");
    crestTexture.colorSpace = SRGBColorSpace;
  }
  const faceDecalMat = new MeshStandardMaterial({
    map: faceTexture,
    transparent: true,
    roughness: 0.72,
    metalness: 0.0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: DoubleSide,
  });
  materials.push(faceDecalMat);

  const chestCrestMat = new MeshStandardMaterial({
    map: crestTexture,
    transparent: true,
    roughness: 0.55,
    metalness: 0.05,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: DoubleSide,
  });
  materials.push(chestCrestMat);

  // 7. Sleek Pulled-Back Hair & Ponytail (deep espresso natural black)
  const hairMat = new MeshStandardMaterial({
    color: "#141110",
    roughness: 0.62,
    metalness: 0.1,
  });
  materials.push(hairMat);

  // 8. Saina's Signature Hair Accessories (Yellow & Pink Clips)
  const clipYellowMat = new MeshStandardMaterial({ color: "#facc15", roughness: 0.35, metalness: 0.1 });
  const clipPinkMat = new MeshStandardMaterial({ color: "#ec4899", roughness: 0.35, metalness: 0.1 });
  materials.push(clipYellowMat, clipPinkMat);

  // 9. Saina's Necklaces (Gold Chain + Black Beaded Cord)
  const goldNecklaceMat = new MeshStandardMaterial({ color: "#eab308", roughness: 0.25, metalness: 0.9 });
  const blackBeadsMat = new MeshStandardMaterial({ color: "#0a0a0c", roughness: 0.35, metalness: 0.2 });
  materials.push(goldNecklaceMat, blackBeadsMat);

  // 10. Black Performance Tournament Jersey
  const jerseyBaseMat = new MeshStandardMaterial({
    color: "#101014",
    roughness: 0.62,
    metalness: 0.06,
  });
  materials.push(jerseyBaseMat);

  // 11. Subtle Purple Detailing (Inner collar & trim)
  const jerseyPurpleMat = new MeshStandardMaterial({
    color: "#7c3aed",
    roughness: 0.38,
    metalness: 0.12,
  });
  materials.push(jerseyPurpleMat);

  // 12. Crisp White Contrast Trim
  const whiteMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.35,
    metalness: 0.05,
  });
  materials.push(whiteMat);

  // 13. Breathable Flank Mesh Panels
  const jerseyMeshMat = new MeshStandardMaterial({
    color: "#181b24",
    roughness: 0.85,
    metalness: 0.04,
  });
  materials.push(jerseyMeshMat);

  // 14. Black Pleated Tournament Match Skirt & Compression Shorts
  const skirtBaseMat = new MeshStandardMaterial({
    color: "#121318",
    roughness: 0.68,
    metalness: 0.05,
  });
  materials.push(skirtBaseMat);

  // 15. Saina's Signature Tournament Wristband (Yellow on Racket Arm) & Watch (White on Left)
  const wristbandYellowMat = new MeshStandardMaterial({ color: "#eab308", roughness: 0.78, metalness: 0.05 });
  const watchWhiteMat = new MeshStandardMaterial({ color: "#f8fafc", roughness: 0.3, metalness: 0.5 });
  materials.push(wristbandYellowMat, watchWhiteMat);

  // 16. Low-Cut White Athletic Court Socks
  const sockMat = new MeshStandardMaterial({
    color: "#f1f5f9",
    roughness: 0.75,
    metalness: 0.02,
  });
  materials.push(sockMat);

  // 17. Yonex Power Cushion Shoes Upper
  const shoeUpperMat = new MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.32,
    metalness: 0.08,
  });
  materials.push(shoeUpperMat);

  // 18. Magenta TPU Lateral Claw & Heel Counter
  const shoeMagentaMat = new MeshStandardMaterial({
    color: "#db2777",
    roughness: 0.28,
    metalness: 0.2,
  });
  materials.push(shoeMagentaMat);

  // 19. EVA Cushion Midsole
  const shoeMidsoleMat = new MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.5,
  });
  materials.push(shoeMidsoleMat);

  // 20. Amber Gum Rubber Non-Marking Outsole
  const shoeGumSoleMat = new MeshStandardMaterial({
    color: "#d97706",
    roughness: 0.58,
    metalness: 0.04,
  });
  materials.push(shoeGumSoleMat);

  // 21. Carbon Graphite Quarter Panels
  const shoeCarbonMat = new MeshStandardMaterial({
    color: "#181d26",
    roughness: 0.45,
    metalness: 0.25,
  });
  materials.push(shoeCarbonMat);

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
  // HIPS & PELVIS: Black Skirt & Compression Shorts
  // ==========================================
  const hips = joint(root, 0, SMASH_POSES.reach.rootY);

  // Pelvis & black compression shorts seat
  addMesh(hips, new CapsuleGeometry(0.098, 0.11, capSeg, radial), skirtBaseMat, [0, 0, 0], [0, 0, Math.PI / 2]);
  // Shorts elastic waistband
  addMesh(hips, new CylinderGeometry(0.112, 0.112, 0.038, radial), skirtBaseMat, [0, 0.04, 0]);

  // Match pleated skirt flared silhouette (drapes naturally over hips)
  addMesh(hips, new CylinderGeometry(0.115, 0.155, 0.13, radial, 1, true), skirtBaseMat, [0, -0.015, 0]);
  // Skirt white hem trim
  addMesh(hips, new TorusGeometry(0.155, 0.003, 6, radial), whiteMat, [0, -0.078, 0], [Math.PI / 2, 0, 0]);
  // Skirt Yonex logo badge on hem
  addMesh(hips, new BoxGeometry(0.016, 0.012, 0.004), whiteMat, [0.12, -0.065, 0.09], [0, -0.6, 0]);

  // ==========================================
  // SPINE & LOWER JERSEY TORSO
  // ==========================================
  const spine = joint(hips, 0, 0.08);

  // Lower jersey body (tapered athletic female core)
  addMesh(spine, new CapsuleGeometry(0.118, 0.12, capSeg, radial), jerseyBaseMat, [0, 0.095, 0]);
  // Lower jersey hem with white contrast piping
  addMesh(spine, new CylinderGeometry(0.122, 0.126, 0.032, radial), jerseyBaseMat, [0, 0.012, 0]);
  addMesh(spine, new TorusGeometry(0.126, 0.004, 6, radial), whiteMat, [0, -0.002, 0], [Math.PI / 2, 0, 0]);

  // Breathable side ventilation mesh panels along rib flanks
  addMesh(spine, new BoxGeometry(0.01, 0.15, 0.13), jerseyMeshMat, [-0.118, 0.095, 0]);
  addMesh(spine, new BoxGeometry(0.01, 0.15, 0.13), jerseyMeshMat, [0.118, 0.095, 0]);

  // Dynamic silver/white speed stitch dashes across lower torso
  addMesh(spine, new BoxGeometry(0.18, 0.012, 0.006), whiteMat, [0, 0.085, 0.118], [0, 0, 0.32]);
  addMesh(spine, new BoxGeometry(0.16, 0.01, 0.006), jerseyPurpleMat, [0, 0.065, 0.118], [0, 0, 0.32]);

  // ==========================================
  // CHEST & UPPER JERSEY TORSO
  // ==========================================
  const chest = joint(spine, 0, 0.24);

  // Contoured athletic female chest & pectoral flare
  addMesh(chest, new CapsuleGeometry(0.136, 0.125, capSeg, radial), jerseyBaseMat, [0, 0.055, 0], [0, 0, 0], [1.14, 1, 0.86]);

  // Shoulder bridge yoke
  addMesh(chest, new CapsuleGeometry(0.062, 0.31, capSeg, radial), jerseyBaseMat, [0, 0.19, 0], [0, 0, Math.PI / 2]);

  // V-Neck collar with purple inner lining and white edge piping
  addMesh(chest, new TorusGeometry(0.068, 0.009, 8, radial), jerseyPurpleMat, [0, 0.22, 0.02], [Math.PI / 2 - 0.25, 0, 0]);
  addMesh(chest, new TorusGeometry(0.064, 0.005, 6, radial), whiteMat, [0, 0.218, 0.022], [Math.PI / 2 - 0.25, 0, 0]);

  // Chest Crest: Indian flag shield & Yonex logo on upper left chest (+X)
  addMesh(chest, new CylinderGeometry(0.138, 0.138, 0.055, radial, 1, true, -Math.PI * 0.25, Math.PI * 0.5), chestCrestMat, [0, 0.135, 0.01]);

  // ==========================================
  // REAL HUMAN HEAD & FACE: SAINA NEHWAL
  // ==========================================
  const neck = joint(chest, 0, 0.27);

  // Athletic neck column
  addMesh(neck, new CylinderGeometry(0.038, 0.044, 0.08, radial), skinMat, [0, 0.035, 0]);
  // Trapezius slope connecting neck into shoulders
  addMesh(neck, new ConeGeometry(0.068, 0.05, radial), skinMat, [0, 0.01, 0]);

  // Saina's signature necklaces:
  // 1. Traditional gold chain
  addMesh(neck, new TorusGeometry(0.044, 0.002, 8, radial), goldNecklaceMat, [0, 0.02, 0.005], [Math.PI / 2 + 0.18, 0, 0]);
  // 2. Black beaded chain
  addMesh(neck, new TorusGeometry(0.042, 0.0025, 8, radial), blackBeadsMat, [0, 0.028, 0.004], [Math.PI / 2 + 0.15, 0, 0]);
  // 3. Yellow athletic necklace cord
  addMesh(neck, new TorusGeometry(0.041, 0.002, 8, radial), wristbandYellowMat, [0, 0.036, 0.003], [Math.PI / 2 + 0.12, 0, 0]);

  // Cranium (anatomical female proportions)
  addMesh(neck, new SphereGeometry(0.085, 24, 16), skinMat, [0, 0.16, 0], [0, 0, 0], [0.88, 1.04, 0.94]);

  // High-Fidelity Frontal Facial Projection Decal (Saina Nehwal photo likeness)
  addMesh(neck, new CylinderGeometry(0.087, 0.081, 0.14, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.7), faceDecalMat, [0, 0.156, 0.004]);

  // Forehead & Brow Structure
  addMesh(neck, new BoxGeometry(0.074, 0.014, 0.022), skinMat, [0, 0.184, 0.066]);

  // Refined Athletic Nose Sculpt
  addMesh(neck, new CylinderGeometry(0.005, 0.008, 0.026, 8), skinMat, [0, 0.154, 0.088], [-0.26, 0, 0]);
  addMesh(neck, new SphereGeometry(0.0065, 8, 8), skinMat, [0, 0.143, 0.093]);
  addMesh(neck, new SphereGeometry(0.004, 6, 6), skinMat, [0.008, 0.141, 0.088]);
  addMesh(neck, new SphereGeometry(0.004, 6, 6), skinMat, [-0.008, 0.141, 0.088]);

  // Smiling Lips with Visible Teeth
  addMesh(neck, new BoxGeometry(0.022, 0.0045, 0.006), lipMat, [0, 0.13, 0.084]);
  addMesh(neck, new BoxGeometry(0.015, 0.0035, 0.005), whiteMat, [0, 0.126, 0.085]);
  addMesh(neck, new BoxGeometry(0.02, 0.0045, 0.006), lipMat, [0, 0.121, 0.083]);

  // Saina's Signature Beauty Mark (Mole on Left Upper Cheek)
  addMesh(neck, new SphereGeometry(0.0018, 6, 6), hairMat, [0.038, 0.152, 0.084]);

  // Mandible, Chin & Cheeks
  addMesh(neck, new BoxGeometry(0.048, 0.038, 0.055), skinMat, [0, 0.11, 0.038], [0.22, 0, 0]);
  addMesh(neck, new SphereGeometry(0.011, 8, 8), skinMat, [0, 0.096, 0.062]);
  addMesh(neck, new SphereGeometry(0.016, 8, 8), skinMat, [0.042, 0.152, 0.048], [0, 0, 0], [0.85, 1, 0.9]);
  addMesh(neck, new SphereGeometry(0.016, 8, 8), skinMat, [-0.042, 0.152, 0.048], [0, 0, 0], [0.85, 1, 0.9]);

  // Human Ears & Saina's Signature Silver Hoop Earrings
  addMesh(neck, new CylinderGeometry(0.013, 0.015, 0.032, 8), skinMat, [0.075, 0.158, -0.005], [0, 0, 0.15], [0.35, 1, 0.7]);
  addMesh(neck, new TorusGeometry(0.0075, 0.0018, 8, 16), silverMat, [0.077, 0.146, -0.004], [0, Math.PI / 2, 0]);
  addMesh(neck, new CylinderGeometry(0.013, 0.015, 0.032, 8), skinMat, [-0.075, 0.158, -0.005], [0, 0, -0.15], [0.35, 1, 0.7]);
  addMesh(neck, new TorusGeometry(0.0075, 0.0018, 8, 16), silverMat, [-0.077, 0.146, -0.004], [0, Math.PI / 2, 0]);

  // Saina's Signature Hair Accessories (Yellow and Pink Hair Clips)
  addMesh(neck, new BoxGeometry(0.02, 0.006, 0.004), clipYellowMat, [0.028, 0.232, 0.04], [0.3, 0.2, -0.3]);
  addMesh(neck, new BoxGeometry(0.02, 0.006, 0.004), clipPinkMat, [0.055, 0.215, 0.028], [0.2, 0.4, -0.4]);
  addMesh(neck, new BoxGeometry(0.02, 0.006, 0.004), clipYellowMat, [-0.028, 0.232, 0.04], [0.3, -0.2, 0.3]);
  addMesh(neck, new BoxGeometry(0.02, 0.006, 0.004), clipPinkMat, [-0.055, 0.215, 0.028], [0.2, -0.4, 0.4]);

  // Saina Nehwal's Signature Athletic Pulled-Back Ponytail Hairstyle
  addMesh(
    neck,
    new SphereGeometry(0.088, 24, 16, Math.PI * 0.2, Math.PI * 1.6, 0, Math.PI * 0.82),
    hairMat,
    [0, 0.161, -0.002],
    [0, 0, 0],
    [0.91, 1.05, 0.97],
  );
  addMesh(
    neck,
    new SphereGeometry(0.088, 24, 12, -Math.PI * 0.35, Math.PI * 0.7, 0, Math.PI * 0.26),
    hairMat,
    [0, 0.162, 0.002],
    [0, 0, 0],
    [0.91, 1.05, 0.97],
  );
  addMesh(neck, new CapsuleGeometry(0.014, 0.055, 4, 8), hairMat, [0.071, 0.168, 0.008], [0.3, 0.15, -0.12]);
  addMesh(neck, new CapsuleGeometry(0.014, 0.055, 4, 8), hairMat, [-0.071, 0.168, 0.008], [0.3, -0.15, 0.12]);

  // Ponytail gathering cone & elastic tie band
  addMesh(neck, new ConeGeometry(0.045, 0.065, 14), hairMat, [0, 0.148, -0.068], [-Math.PI * 0.38, 0, 0]);
  addMesh(neck, new TorusGeometry(0.015, 0.004, 8, 16), clipYellowMat, [0, 0.142, -0.098], [Math.PI * 0.25, 0, 0]);
  addMesh(neck, new CylinderGeometry(0.013, 0.01, 0.07, 10), hairMat, [0, 0.112, -0.116], [0.3, 0, 0]);
  addMesh(neck, new CylinderGeometry(0.01, 0.007, 0.075, 10), hairMat, [0, 0.055, -0.13], [0.18, 0, 0]);
  addMesh(neck, new ConeGeometry(0.007, 0.045, 8), hairMat, [0, 0.008, -0.138], [Math.PI, 0.05, 0]);

  // ==========================================
  // ARMS, SLEEVES & HANDS
  // ==========================================
  const arm = (side: 1 | -1, isRacketArm: boolean) => {
    const shoulder = joint(chest, side * SHOULDER_HALF_SPAN, 0.2);

    // Deltoid muscle base under sleeve
    addMesh(shoulder, new SphereGeometry(0.054, 14, 12), skinMat, [0, -0.02, 0]);

    // Jersey Short Sleeve with white & purple trim
    addMesh(shoulder, new CylinderGeometry(0.058, 0.052, 0.115, radial), jerseyBaseMat, [0, -0.055, 0]);
    addMesh(shoulder, new TorusGeometry(0.053, 0.004, 6, radial), whiteMat, [0, -0.11, 0], [Math.PI / 2, 0, 0]);
    addMesh(shoulder, new TorusGeometry(0.053, 0.003, 6, radial), jerseyPurpleMat, [0, -0.116, 0], [Math.PI / 2, 0, 0]);

    // Toned Bicep & Tricep
    addMesh(
      shoulder,
      new CapsuleGeometry(0.042, UPPER_ARM - 0.12, capSeg, radial),
      skinMat,
      [0, -UPPER_ARM / 2 - 0.015, 0],
    );

    const elbow = joint(shoulder, 0, -UPPER_ARM);

    // Anatomical Elbow Joint
    addMesh(elbow, new SphereGeometry(0.036, 12, 8), skinMat, [0, 0, 0]);

    // Muscular Forearm
    addMesh(elbow, new CylinderGeometry(0.038, 0.028, FOREARM - 0.08, radial), skinMat, [0, -FOREARM / 2 + 0.01, 0]);

    if (isRacketArm) {
      // Saina's signature yellow tournament wristband on right wrist
      addMesh(elbow, new CylinderGeometry(0.033, 0.031, 0.048, radial), wristbandYellowMat, [0, -FOREARM + 0.026, 0]);
    } else {
      // White athletic tournament watch on left wrist
      addMesh(elbow, new CylinderGeometry(0.031, 0.03, 0.026, radial), watchWhiteMat, [0, -FOREARM + 0.026, 0]);
    }

    // Anatomical 5-Digit Hand
    const handY = -FOREARM - 0.015;
    // Palm
    addMesh(elbow, new BoxGeometry(0.044, 0.048, 0.022), skinMat, [0, handY, 0]);

    if (isRacketArm) {
      // Racket hand: curled tightly around the handle grip
      for (let i = 0; i < 4; i++) {
        const fx = (i - 1.5) * 0.01;
        addMesh(elbow, new CapsuleGeometry(0.0055, 0.03, 4, 8), skinMat, [fx, handY - 0.03, 0.006], [0.65, 0, 0]);
      }
      addMesh(elbow, new CapsuleGeometry(0.006, 0.026, 4, 8), skinMat, [side * 0.022, handY - 0.01, 0.01], [0.3, side * 0.4, 0]);
    } else {
      // Off-arm: athletic open counter-balance fingers
      addMesh(elbow, new CapsuleGeometry(0.007, 0.042, 4, 6), skinMat, [0.016, handY - 0.032, 0.004], [0.1, 0, -0.15]);
      addMesh(elbow, new CapsuleGeometry(0.007, 0.044, 4, 6), skinMat, [0.005, handY - 0.034, 0], [0.12, 0, 0]);
      addMesh(elbow, new CapsuleGeometry(0.0065, 0.04, 4, 6), skinMat, [-0.005, handY - 0.032, -0.004], [0.14, 0, 0.1]);
      addMesh(elbow, new CapsuleGeometry(0.006, 0.036, 4, 6), skinMat, [-0.016, handY - 0.028, -0.008], [0.18, 0, 0.22]);
      addMesh(elbow, new CapsuleGeometry(0.0065, 0.026, 4, 8), skinMat, [side * 0.022, handY - 0.01, 0.01], [0.3, side * 0.4, 0]);
    }

    return { shoulder, elbow };
  };

  const right = arm(-1, true);
  const left = arm(1, false);

  // ==========================================
  // LEGS & YONEX POWER CUSHION COURT SHOES
  // ==========================================
  const leg = (side: 1 | -1) => {
    const hip = joint(hips, side * HIP_HALF_SPAN, -0.03);

    // Defined Vastus Medialis & Rectus Femoris Quadriceps
    addMesh(
      hip,
      new CapsuleGeometry(0.062, THIGH - 0.18, capSeg, radial),
      skinMat,
      [0, -THIGH / 2 - 0.025, 0],
    );
    // Teardrop vastus medialis definition right above kneecap
    addMesh(hip, new SphereGeometry(0.032, 10, 8), skinMat, [-side * 0.024, -THIGH + 0.06, 0.022]);

    const knee = joint(hip, 0, -THIGH);

    // Anatomical Patella (kneecap)
    addMesh(knee, new BoxGeometry(0.04, 0.044, 0.022), skinMat, [0, 0, 0.036]);
    addMesh(knee, new BoxGeometry(0.02, 0.036, 0.01), skinMat, [0, -0.03, 0.034]);

    // Athletic Badminton Calf (gastrocnemius diamond taper)
    addMesh(
      knee,
      new CapsuleGeometry(0.05, 0.175, capSeg, radial),
      skinMat,
      [0, -0.11, -0.01],
      [0, 0, 0],
      [0.95, 1, 1.1],
    );
    // Achilles tendon
    addMesh(knee, new CylinderGeometry(0.018, 0.022, 0.12, 8), skinMat, [0, -0.22, -0.02]);

    // Ankle Malleolus (inner & outer ankle bones)
    addMesh(knee, new SphereGeometry(0.015, 6, 6), skinMat, [side * 0.034, -SHIN + 0.05, 0]);
    addMesh(knee, new SphereGeometry(0.015, 6, 6), skinMat, [-side * 0.034, -SHIN + 0.055, 0]);

    // Low-Cut White Athletic Court Socks
    addMesh(knee, new CylinderGeometry(0.038, 0.035, 0.1, radial), sockMat, [0, -SHIN + 0.06, 0]);

    // ==========================================
    // PRO YONEX POWER CUSHION COURT SHOES
    // ==========================================
    // 1. Synthetic white mesh upper body
    addMesh(knee, new BoxGeometry(0.092, 0.058, 0.22), shoeUpperMat, [0, -SHIN + 0.005, 0.055]);
    addMesh(
      knee,
      new CapsuleGeometry(0.044, 0.07, capSeg, radial),
      shoeUpperMat,
      [0, -SHIN + 0.005, 0.135],
      [Math.PI / 2, 0, 0],
    );

    // 2. Magenta TPU Lateral Stability Claw
    addMesh(knee, new BoxGeometry(0.015, 0.036, 0.085), shoeMagentaMat, [side * 0.048, -SHIN - 0.004, 0.075]);
    addMesh(knee, new CylinderGeometry(0.044, 0.044, 0.02, radial), shoeMagentaMat, [0, -SHIN + 0.02, 0.04]);

    // 3. Carbon Graphite Shank Plate
    addMesh(knee, new BoxGeometry(0.082, 0.015, 0.06), shoeCarbonMat, [0, -SHIN - 0.03, 0.03]);

    // 4. White Tournament Laces
    for (let i = 0; i < 4; i++) {
      const zOffset = 0.03 + i * 0.025;
      const yOffset = 0.028 + (3 - i) * 0.005;
      addMesh(knee, new BoxGeometry(0.044, 0.006, 0.012), whiteMat, [0, -SHIN + yOffset, zOffset]);
    }

    // 5. Multi-Density EVA Midsole Cushion
    addMesh(knee, new BoxGeometry(0.096, 0.026, 0.245), shoeMidsoleMat, [0, -SHIN - 0.026, 0.055]);

    // 6. Amber Gum Rubber Non-Marking Court Outsole
    addMesh(knee, new BoxGeometry(0.098, 0.014, 0.25), shoeGumSoleMat, [0, -SHIN - 0.042, 0.055]);
    // Outsole toe bumper for court drag
    addMesh(knee, new BoxGeometry(0.082, 0.026, 0.024), shoeGumSoleMat, [0, -SHIN - 0.018, 0.17]);

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
      faceTexture?.dispose();
      crestTexture?.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

/**
 * Creates an AthleteRig from a loaded GLTF/GLB scene (e.g. /models/saina-nehwal.glb).
 * Seamless drop-in replacement that maps all joints and handAnchor.
 */
export function createAthleteRigFromGltf(scene: Object3D): AthleteRig | null {
  const joints: Partial<Record<JointName, Object3D>> = {};
  let handAnchor: Object3D | null = null;

  scene.traverse((obj) => {
    if (JOINT_NAMES.includes(obj.name as JointName)) {
      joints[obj.name as JointName] = obj;
    }
    if (obj.name === "handAnchor") {
      handAnchor = obj;
    }
    // Hide internal static racket so the website's animated flying racket docks cleanly
    if (obj.name === "racket" || obj.name === "YonexRacket") {
      obj.visible = false;
    }
    if (obj instanceof Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;

      // Enhance PBR materials loaded from GLB for studio lighting
      if (obj.material) {
        const mat = obj.material as MeshStandardMaterial;
        if (mat.name === "M_SainaFaceDecal") {
          mat.transparent = true;
          mat.depthWrite = false;
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = -2;
          mat.polygonOffsetUnits = -2;
          mat.roughness = 0.68;
        } else if (mat.name === "M_ChestCrestDecal") {
          mat.transparent = true;
          mat.depthWrite = false;
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = -1;
          mat.polygonOffsetUnits = -1;
        } else if (mat.name === "M_SainaSkin") {
          mat.roughness = 0.62;
          mat.metalness = 0.02;
        } else if (mat.name === "M_HairBlack") {
          mat.roughness = 0.58;
          mat.metalness = 0.08;
        } else if (mat.name === "M_JerseyObsidian" || mat.name === "M_MatchSkirt") {
          mat.roughness = 0.68;
          mat.metalness = 0.04;
        }
      }
    }
  });

  // Verify all required joints exist
  for (const name of JOINT_NAMES) {
    if (!joints[name]) {
      return null;
    }
  }

  if (!handAnchor) {
    handAnchor = joints.elbowR!;
  }

  const root = scene instanceof Group ? scene : new Group().add(scene);

  return {
    root,
    handAnchor,
    joints: joints as Record<JointName, Object3D>,
    dispose: () => {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
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

