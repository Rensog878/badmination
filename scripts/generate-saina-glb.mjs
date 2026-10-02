// scripts/generate-saina-glb.mjs
// Generates AAA game-ready rigged Saina Nehwal GLB model: public/models/saina-nehwal.glb
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Polyfill FileReader and self for Node.js GLTFExporter
class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = FileReader;
if (typeof globalThis.self === "undefined") {
  globalThis.self = globalThis;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outGlbPath = join(rootDir, "public", "models", "saina-nehwal.glb");

const THREE = await import("three");
const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

const {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  QuaternionKeyframeTrack,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  VectorKeyframeTrack,
  AnimationClip,
} = THREE;

console.log("[generate-saina-glb] Building AAA Saina Nehwal character rig...");

// ==========================================
// ANTHROPOMETRIC DIMENSIONS (Saina Nehwal ~1.65m)
// ==========================================
const SHOULDER_SPAN = 0.165;
const UPPER_ARM = 0.23;
const FOREARM = 0.21;
const HIP_SPAN = 0.088;
const THIGH = 0.36;
const CALF = 0.35;

// ==========================================
// MATERIALS (Olympic Tournament Standard)
// ==========================================
// 1. Saina Nehwal authentic warm golden tan skin tone (#b98469)
const skinMat = new MeshPhysicalMaterial({
  name: "M_SainaSkin",
  color: 0xb98469,
  roughness: 0.65,
  metalness: 0.02,
  sheen: 0.25,
  sheenColor: new Color(0xd29272),
  sheenRoughness: 0.45,
});

// 2. Realistic Eyeball Sclera
const eyeWhiteMat = new MeshStandardMaterial({
  name: "M_EyeWhite",
  color: 0xffffff,
  roughness: 0.15,
  metalness: 0.02,
});

// 3. Focused Dark Iris & Pupil
const irisMat = new MeshStandardMaterial({
  name: "M_IrisDark",
  color: 0x140e0c,
  roughness: 0.15,
  metalness: 0.1,
});

// 4. Natural Lips & Smile Contour
const lipMat = new MeshStandardMaterial({
  name: "M_SainaLips",
  color: 0xb86a58,
  roughness: 0.55,
  metalness: 0.02,
});

// 5. White Crest & Accents
const whiteMat = new MeshStandardMaterial({
  name: "M_TournamentWhite",
  color: 0xf8fafc,
  roughness: 0.35,
  metalness: 0.05,
});

// 6. Saina's Signature Silver Metallic Hoop Earrings
const silverMat = new MeshStandardMaterial({
  name: "M_SilverHoop",
  color: 0xf1f5f9,
  roughness: 0.15,
  metalness: 0.95,
});

// 7. Traditional Gold Chain Necklace
const goldNecklaceMat = new MeshStandardMaterial({
  name: "M_GoldChain",
  color: 0xeab308,
  roughness: 0.2,
  metalness: 0.9,
});

// 8. Traditional Black Beads
const blackBeadsMat = new MeshStandardMaterial({
  name: "M_BlackBeads",
  color: 0x0a0a0c,
  roughness: 0.4,
  metalness: 0.1,
});

// 9. Hair Clips (Yellow & Pink as in reference sheet)
const clipYellowMat = new MeshStandardMaterial({
  name: "M_ClipYellow",
  color: 0xfacc15,
  roughness: 0.3,
  metalness: 0.2,
});
const clipPinkMat = new MeshStandardMaterial({
  name: "M_ClipPink",
  color: 0xec4899,
  roughness: 0.3,
  metalness: 0.2,
});

// 10. Deep Espresso Hair
const hairMat = new MeshStandardMaterial({
  name: "M_SainaHair",
  color: 0x141110,
  roughness: 0.62,
  metalness: 0.1,
});

// 11. Black Performance Jersey
const jerseyBaseMat = new MeshStandardMaterial({
  name: "M_JerseyBlack",
  color: 0x0e1117,
  roughness: 0.65,
  metalness: 0.05,
});

// 12. Purple Collar Lining Accents (as seen on reference photo)
const jerseyPurpleMat = new MeshStandardMaterial({
  name: "M_JerseyPurple",
  color: 0x7c3aed,
  roughness: 0.45,
  metalness: 0.1,
});

// 13. Breathable Mesh Flank Panels
const jerseyMeshMat = new MeshStandardMaterial({
  name: "M_JerseyMesh",
  color: 0x161c28,
  roughness: 0.85,
  metalness: 0.04,
});

// 14. Match Pleated Skirt & Compression Shorts
const skirtBaseMat = new MeshStandardMaterial({
  name: "M_MatchSkirt",
  color: 0x0a0c10,
  roughness: 0.68,
  metalness: 0.04,
});

// 15. Right Yellow Performance Wristband
const wristbandYellowMat = new MeshStandardMaterial({
  name: "M_WristbandYellow",
  color: 0xfacc15,
  roughness: 0.75,
});

// 16. Left White Athletic Watch
const watchWhiteMat = new MeshStandardMaterial({
  name: "M_AthleticWatch",
  color: 0xf8fafc,
  roughness: 0.3,
  metalness: 0.4,
});

// 17. Low-Cut White Athletic Court Socks
const sockMat = new MeshStandardMaterial({
  name: "M_CourtSocks",
  color: 0xf1f5f9,
  roughness: 0.75,
  metalness: 0.02,
});

// 18. Yonex Power Cushion Shoes Upper
const shoeUpperMat = new MeshStandardMaterial({
  name: "M_ShoeUpper",
  color: 0xffffff,
  roughness: 0.32,
  metalness: 0.08,
});

// 19. Magenta TPU Lateral Claw & Heel Counter
const shoeMagentaMat = new MeshStandardMaterial({
  name: "M_ShoeMagenta",
  color: 0xdb2777,
  roughness: 0.28,
  metalness: 0.2,
});

// 20. EVA Cushion Midsole
const shoeMidsoleMat = new MeshStandardMaterial({
  name: "M_ShoeMidsole",
  color: 0xf8fafc,
  roughness: 0.5,
});

// 21. Amber Gum Rubber Court Outsole
const shoeGumSoleMat = new MeshStandardMaterial({
  name: "M_ShoeGumSole",
  color: 0xd97706,
  roughness: 0.58,
  metalness: 0.04,
});

// 22. Racket Frame Graphite & Red Accents
const racketFrameMat = new MeshStandardMaterial({
  name: "M_RacketFrame",
  color: 0x18181b,
  roughness: 0.25,
  metalness: 0.85,
});
const racketRedMat = new MeshStandardMaterial({
  name: "M_RacketRed",
  color: 0xdc2626,
  roughness: 0.3,
  metalness: 0.6,
});

// 23. Racket String Bed with Red Yonex Stencil
const racketStringMat = new MeshStandardMaterial({
  name: "M_RacketStrings",
  color: 0xffffff,
  roughness: 0.4,
  transparent: true,
  opacity: 0.85,
  side: DoubleSide,
});

// 24. Racket Yellow Polyurethane Grip
const racketGripMat = new MeshStandardMaterial({
  name: "M_RacketGrip",
  color: 0xeab308,
  roughness: 0.82,
});

// Dedicated placeholder materials for injected texture maps
const faceDecalMat = new MeshStandardMaterial({
  name: "M_SainaFaceDecal",
  color: 0xffffff,
  roughness: 0.72,
  metalness: 0.0,
  transparent: true,
  side: DoubleSide,
});

const chestCrestMat = new MeshStandardMaterial({
  name: "M_ChestCrestDecal",
  color: 0xffffff,
  roughness: 0.55,
  metalness: 0.05,
  side: DoubleSide,
});

const shoeSideDecalMat = new MeshStandardMaterial({
  name: "M_ShoeSideDecal",
  color: 0xffffff,
  roughness: 0.4,
  metalness: 0.1,
  side: DoubleSide,
});

const racketStencilMat = new MeshStandardMaterial({
  name: "M_RacketStencilDecal",
  color: 0xffffff,
  roughness: 0.4,
  transparent: true,
  side: DoubleSide,
});

// Helper for adding meshes
const addMesh = (parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) => {
  const m = new Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  if (scale[0] !== 1 || scale[1] !== 1 || scale[2] !== 1) {
    m.scale.set(...scale);
  }
  parent.add(m);
  return m;
};

const joint = (parent, name, x, y, z = 0) => {
  const o = new Object3D();
  o.name = name;
  o.position.set(x, y, z);
  parent.add(o);
  return o;
};

// ==========================================
// RIG HIERARCHY
// ==========================================
const root = new Group();
root.name = "athlete_root";

const radial = 16;
const capSeg = 8;

// HIPS (root joint)
const hips = joint(root, "hips", 0, 0.86, 0);

// Pelvis & black compression shorts seat
addMesh(hips, new CapsuleGeometry(0.098, 0.11, capSeg, radial), skirtBaseMat, [0, 0, 0], [0, 0, Math.PI / 2]);
// Shorts elastic waistband
addMesh(hips, new CylinderGeometry(0.112, 0.112, 0.038, radial), skirtBaseMat, [0, 0.04, 0]);

// Match pleated skirt flared silhouette (drapes over hips)
addMesh(hips, new CylinderGeometry(0.115, 0.155, 0.13, radial, 1, true), skirtBaseMat, [0, -0.015, 0]);
// Skirt white hem trim
addMesh(hips, new TorusGeometry(0.155, 0.003, 6, radial), whiteMat, [0, -0.078, 0], [Math.PI / 2, 0, 0]);
// Skirt Yonex logo badge on hem
addMesh(hips, new BoxGeometry(0.016, 0.012, 0.004), whiteMat, [0.12, -0.065, 0.09], [0, -0.6, 0]);

// SPINE & WAIST
const spine = joint(hips, "spine", 0, 0.08);

// Lower jersey torso
addMesh(spine, new CapsuleGeometry(0.118, 0.12, capSeg, radial), jerseyBaseMat, [0, 0.095, 0]);
// Lower jersey hem with white contrast piping
addMesh(spine, new CylinderGeometry(0.122, 0.126, 0.032, radial), jerseyBaseMat, [0, 0.012, 0]);
addMesh(spine, new TorusGeometry(0.126, 0.004, 6, radial), whiteMat, [0, -0.002, 0], [Math.PI / 2, 0, 0]);

// Breathable rib flank mesh panels
addMesh(spine, new BoxGeometry(0.01, 0.15, 0.13), jerseyMeshMat, [-0.118, 0.095, 0]);
addMesh(spine, new BoxGeometry(0.01, 0.15, 0.13), jerseyMeshMat, [0.118, 0.095, 0]);

// Dynamic silver/white speed stitch dashes across lower torso
addMesh(spine, new BoxGeometry(0.18, 0.012, 0.006), whiteMat, [0, 0.085, 0.118], [0, 0, 0.32]);
addMesh(spine, new BoxGeometry(0.16, 0.01, 0.006), jerseyPurpleMat, [0, 0.065, 0.118], [0, 0, 0.32]);

// CHEST & UPPER JERSEY TORSO
const chest = joint(spine, "chest", 0, 0.24);

// Contoured athletic female chest & pectoral flare
addMesh(chest, new CapsuleGeometry(0.136, 0.125, capSeg, radial), jerseyBaseMat, [0, 0.055, 0], [0, 0, 0], [1.14, 1, 0.86]);

// Shoulder bridge yoke
addMesh(chest, new CapsuleGeometry(0.062, 0.31, capSeg, radial), jerseyBaseMat, [0, 0.19, 0], [0, 0, Math.PI / 2]);

// V-Neck collar with purple inner lining and white edge piping
addMesh(chest, new TorusGeometry(0.068, 0.009, 8, radial), jerseyPurpleMat, [0, 0.22, 0.02], [Math.PI / 2 - 0.25, 0, 0]);
addMesh(chest, new TorusGeometry(0.064, 0.005, 6, radial), whiteMat, [0, 0.218, 0.022], [Math.PI / 2 - 0.25, 0, 0]);

// Chest Crest Decal: Indian flag & Yonex twin-triangle logo
addMesh(chest, new CylinderGeometry(0.138, 0.138, 0.055, radial, 1, true, -Math.PI * 0.25, Math.PI * 0.5), chestCrestMat, [0, 0.135, 0.01]);

// NECK & HEAD (SAINA NEHWAL)
const neck = joint(chest, "neck", 0, 0.27);

// Athletic neck column
addMesh(neck, new CylinderGeometry(0.038, 0.044, 0.08, radial), skinMat, [0, 0.035, 0]);
// Trapezius muscle slope connecting into shoulders
addMesh(neck, new ConeGeometry(0.068, 0.05, radial), skinMat, [0, 0.01, 0]);

// Saina's signature necklaces:
// 1. Traditional gold chain
addMesh(neck, new TorusGeometry(0.044, 0.002, 8, radial), goldNecklaceMat, [0, 0.02, 0.005], [Math.PI / 2 + 0.18, 0, 0]);
// 2. Black beaded chain
addMesh(neck, new TorusGeometry(0.042, 0.0025, 8, radial), blackBeadsMat, [0, 0.028, 0.004], [Math.PI / 2 + 0.15, 0, 0]);
// 3. Yellow athletic necklace cord
addMesh(neck, new TorusGeometry(0.041, 0.002, 8, radial), wristbandYellowMat, [0, 0.036, 0.003], [Math.PI / 2 + 0.12, 0, 0]);

// Head Joint
const head = joint(neck, "head", 0, 0.16);

// 1. Cranium (anatomical female proportions)
addMesh(head, new SphereGeometry(0.085, 24, 16), skinMat, [0, 0, 0], [0, 0, 0], [0.88, 1.04, 0.94]);

// 2. High-Fidelity Frontal Facial Projection Decal (Saina Nehwal photo likeness)
addMesh(head, new CylinderGeometry(0.087, 0.081, 0.14, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.7), faceDecalMat, [0, -0.004, 0.004]);

// 3. Forehead & Brow Structure
addMesh(head, new BoxGeometry(0.074, 0.014, 0.022), skinMat, [0, 0.024, 0.066]);

// 4. Refined Athletic Nose Sculpt
addMesh(head, new CylinderGeometry(0.005, 0.008, 0.026, 8), skinMat, [0, -0.006, 0.088], [-0.26, 0, 0]);
addMesh(head, new SphereGeometry(0.0065, 8, 8), skinMat, [0, -0.017, 0.093]);
addMesh(head, new SphereGeometry(0.004, 6, 6), skinMat, [0.008, -0.019, 0.088]);
addMesh(head, new SphereGeometry(0.004, 6, 6), skinMat, [-0.008, -0.019, 0.088]);

// 5. Smiling Lips with Visible Teeth
addMesh(head, new BoxGeometry(0.022, 0.0045, 0.006), lipMat, [0, -0.03, 0.084]);
addMesh(head, new BoxGeometry(0.015, 0.0035, 0.005), whiteMat, [0, -0.034, 0.085]);
addMesh(head, new BoxGeometry(0.02, 0.0045, 0.006), lipMat, [0, -0.039, 0.083]);

// 6. Saina's Signature Beauty Mark (Mole on Left Upper Cheek)
addMesh(head, new SphereGeometry(0.0018, 6, 6), hairMat, [0.038, -0.008, 0.084]);

// 7. Mandible, Chin & Cheeks
addMesh(head, new BoxGeometry(0.048, 0.038, 0.055), skinMat, [0, -0.05, 0.038], [0.22, 0, 0]);
addMesh(head, new SphereGeometry(0.011, 8, 8), skinMat, [0, -0.064, 0.062]);
addMesh(head, new SphereGeometry(0.016, 8, 8), skinMat, [0.042, -0.008, 0.048], [0, 0, 0], [0.85, 1, 0.9]);
addMesh(head, new SphereGeometry(0.016, 8, 8), skinMat, [-0.042, -0.008, 0.048], [0, 0, 0], [0.85, 1, 0.9]);

// 8. Human Ears & Saina's Signature Silver Hoop Earrings
// Left ear & silver hoop earring
addMesh(head, new CylinderGeometry(0.013, 0.015, 0.032, 8), skinMat, [0.075, -0.002, -0.005], [0, 0, 0.15], [0.35, 1, 0.7]);
addMesh(head, new TorusGeometry(0.0075, 0.0018, 8, 16), silverMat, [0.077, -0.014, -0.004], [0, Math.PI / 2, 0]);
// Right ear & silver hoop earring
addMesh(head, new CylinderGeometry(0.013, 0.015, 0.032, 8), skinMat, [-0.075, -0.002, -0.005], [0, 0, -0.15], [0.35, 1, 0.7]);
addMesh(head, new TorusGeometry(0.0075, 0.0018, 8, 16), silverMat, [-0.077, -0.014, -0.004], [0, Math.PI / 2, 0]);

// 9. Saina's Signature Hair Accessories (Yellow and Pink Hair Clips)
addMesh(head, new BoxGeometry(0.02, 0.006, 0.004), clipYellowMat, [0.028, 0.072, 0.04], [0.3, 0.2, -0.3]);
addMesh(head, new BoxGeometry(0.02, 0.006, 0.004), clipPinkMat, [0.055, 0.055, 0.028], [0.2, 0.4, -0.4]);
addMesh(head, new BoxGeometry(0.02, 0.006, 0.004), clipYellowMat, [-0.028, 0.072, 0.04], [0.3, -0.2, 0.3]);
addMesh(head, new BoxGeometry(0.02, 0.006, 0.004), clipPinkMat, [-0.055, 0.055, 0.028], [0.2, -0.4, 0.4]);

// 10. Saina Nehwal's Signature Athletic Pulled-Back Ponytail Hairstyle
// Hair cranium wrapping seamlessly across crown, temples, back, and nape
addMesh(
  head,
  new SphereGeometry(0.088, 24, 16, Math.PI * 0.2, Math.PI * 1.6, 0, Math.PI * 0.82),
  hairMat,
  [0, 0.001, -0.002],
  [0, 0, 0],
  [0.91, 1.05, 0.97],
);
// Athletic front hairline
addMesh(
  head,
  new SphereGeometry(0.088, 24, 12, -Math.PI * 0.35, Math.PI * 0.7, 0, Math.PI * 0.26),
  hairMat,
  [0, 0.002, 0.002],
  [0, 0, 0],
  [0.91, 1.05, 0.97],
);
// Sleek side sweeps pulling back above ears
addMesh(head, new CapsuleGeometry(0.014, 0.055, 4, 8), hairMat, [0.071, 0.008, 0.008], [0.3, 0.15, -0.12]);
addMesh(head, new CapsuleGeometry(0.014, 0.055, 4, 8), hairMat, [-0.071, 0.008, 0.008], [0.3, -0.15, 0.12]);

// Ponytail gathering cone
addMesh(head, new ConeGeometry(0.045, 0.065, 14), hairMat, [0, -0.012, -0.068], [-Math.PI * 0.38, 0, 0]);
// Elastic ponytail hair tie band
addMesh(head, new TorusGeometry(0.015, 0.004, 8, 16), clipYellowMat, [0, -0.018, -0.098], [Math.PI * 0.25, 0, 0]);
// Flowing athletic ponytail
addMesh(head, new CylinderGeometry(0.013, 0.01, 0.07, 10), hairMat, [0, -0.048, -0.116], [0.3, 0, 0]);
addMesh(head, new CylinderGeometry(0.01, 0.007, 0.075, 10), hairMat, [0, -0.105, -0.13], [0.18, 0, 0]);
addMesh(head, new ConeGeometry(0.007, 0.045, 8), hairMat, [0, -0.152, -0.138], [Math.PI, 0.05, 0]);

// ==========================================
// ARMS, EQUIPMENT & HANDS
// ==========================================
const buildArm = (side, isRacketArm) => {
  const jointName = side === -1 ? "shoulderR" : "shoulderL";
  const elbowName = side === -1 ? "elbowR" : "elbowL";
  const shoulder = joint(chest, jointName, side * SHOULDER_SPAN, 0.2);

  // Deltoid under sleeve
  addMesh(shoulder, new SphereGeometry(0.054, 14, 12), skinMat, [0, -0.02, 0]);

  // Jersey short sleeve with white cuff trim
  addMesh(shoulder, new CylinderGeometry(0.058, 0.052, 0.115, radial), jerseyBaseMat, [0, -0.055, 0]);
  addMesh(shoulder, new TorusGeometry(0.053, 0.004, 6, radial), whiteMat, [0, -0.11, 0], [Math.PI / 2, 0, 0]);
  addMesh(shoulder, new TorusGeometry(0.053, 0.003, 6, radial), jerseyPurpleMat, [0, -0.116, 0], [Math.PI / 2, 0, 0]);

  // Toned bicep & tricep
  addMesh(shoulder, new CapsuleGeometry(0.042, 0.11, capSeg, radial), skinMat, [0, -0.15, 0]);

  // Elbow Joint
  const elbow = joint(shoulder, elbowName, 0, -UPPER_ARM);

  // Forearm & wrist
  addMesh(elbow, new CapsuleGeometry(0.038, 0.1, capSeg, radial), skinMat, [0, -0.07, 0]);
  addMesh(elbow, new CylinderGeometry(0.034, 0.028, 0.09, radial), skinMat, [0, -0.15, 0]);

  if (isRacketArm) {
    // Saina's signature yellow tournament wristband on right wrist
    addMesh(elbow, new CylinderGeometry(0.032, 0.032, 0.042, radial), wristbandYellowMat, [0, -0.175, 0]);
  } else {
    // White athletic tournament watch on left wrist
    addMesh(elbow, new CylinderGeometry(0.031, 0.031, 0.026, radial), watchWhiteMat, [0, -0.175, 0]);
  }

  // 5-Digit Articulated Hand
  const handY = -FOREARM - 0.015;
  // Palm
  addMesh(elbow, new BoxGeometry(0.042, 0.048, 0.02), skinMat, [0, handY, 0]);
  // Fingers curled into athletic badminton grip
  for (let i = 0; i < 4; i++) {
    const fx = (i - 1.5) * 0.01;
    addMesh(elbow, new CapsuleGeometry(0.005, 0.028, 4, 8), skinMat, [fx, handY - 0.028, 0.006], [0.65, 0, 0]);
  }
  // Opposed thumb
  addMesh(elbow, new CapsuleGeometry(0.0055, 0.024, 4, 8), skinMat, [side * 0.022, handY - 0.01, 0.01], [0.3, side * 0.4, 0]);

  return { shoulder, elbow };
};

const armR = buildArm(-1, true);
const armL = buildArm(1, false);

// HAND ANCHOR & YONEX BADMINTON RACKET
const handAnchor = joint(armR.elbow, "handAnchor", 0, -FOREARM - 0.02);
handAnchor.rotation.set(Math.PI, 0, 0);

// Named racket container for clean toggle/inspection
const racketGroup = new Group();
racketGroup.name = "racket";
handAnchor.add(racketGroup);

// Professional Yonex Badminton Racket:
// 1. Polyurethane yellow cushioned grip
addMesh(racketGroup, new CylinderGeometry(0.014, 0.015, 0.18, 12), racketGripMat, [0, 0.09, 0]);
// Grip butt cap
addMesh(racketGroup, new CylinderGeometry(0.016, 0.015, 0.015, 12), racketFrameMat, [0, 0.008, 0]);
// Control support cone
addMesh(racketGroup, new ConeGeometry(0.014, 0.028, 12), racketFrameMat, [0, 0.194, 0]);

// 2. High-modulus graphite slim shaft
addMesh(racketGroup, new CylinderGeometry(0.0036, 0.0036, 0.38, 8), racketFrameMat, [0, 0.395, 0]);
// Built-in T-Joint with red Yonex accent
addMesh(racketGroup, new SphereGeometry(0.0065, 8, 8), racketRedMat, [0, 0.585, 0]);

// 3. Isometric Head Frame (red and metallic black)
const headY = 0.585 + 0.13;
addMesh(racketGroup, new TorusGeometry(0.1, 0.005, 8, 24), racketFrameMat, [0, headY, 0], [0, 0, 0], [0.92, 1.25, 1]);
addMesh(racketGroup, new TorusGeometry(0.101, 0.004, 6, 24), racketRedMat, [0, headY, 0], [0, 0, 0], [0.92, 1.25, 1]);

// 4. String Bed with Red Yonex "YY" Stencil Logo
addMesh(racketGroup, new CylinderGeometry(0.091, 0.091, 0.001, 18), racketStringMat, [0, headY, 0], [0, 0, 0], [0.92, 1, 1.25]);
addMesh(racketGroup, new CylinderGeometry(0.075, 0.075, 0.002, 16), racketStencilMat, [0, headY, 0], [0, 0, 0], [0.92, 1, 1.25]);

// ==========================================
// LEGS & YONEX POWER CUSHION COURT SHOES
// ==========================================
const buildLeg = (side) => {
  const hipName = side === -1 ? "hipR" : "hipL";
  const kneeName = side === -1 ? "kneeR" : "kneeL";
  const hip = joint(hips, hipName, side * HIP_SPAN, -0.05);

  // Defined Vastus Medialis & Rectus Femoris Quadriceps
  addMesh(hip, new CapsuleGeometry(0.065, 0.16, capSeg, radial), skinMat, [0, -0.1, 0], [0, 0, 0], [1.05, 1, 0.95]);
  // Teardrop vastus medialis definition above inner knee
  addMesh(hip, new SphereGeometry(0.026, 8, 8), skinMat, [side * -0.022, -0.18, 0.015], [0, 0, 0], [0.8, 1.1, 0.9]);
  // Lower thigh
  addMesh(hip, new CylinderGeometry(0.058, 0.048, 0.14, radial), skinMat, [0, -0.22, 0]);

  // Knee Joint & Patellar Tendon
  const knee = joint(hip, kneeName, 0, -THIGH);

  addMesh(knee, new SphereGeometry(0.038, 12, 10), skinMat, [0, 0, 0.008]);
  addMesh(knee, new CapsuleGeometry(0.012, 0.04, 4, 8), skinMat, [0, -0.015, 0.034]);

  // Athletic Badminton Calf (gastrocnemius diamond taper)
  addMesh(knee, new CapsuleGeometry(0.052, 0.14, capSeg, radial), skinMat, [0, -0.11, -0.008], [0, 0, 0], [0.92, 1, 1.1]);
  // Lower shin & Achilles tendon
  addMesh(knee, new CylinderGeometry(0.042, 0.032, 0.15, radial), skinMat, [0, -0.23, 0]);

  // Low-Cut White Athletic Court Socks
  addMesh(knee, new CylinderGeometry(0.034, 0.034, 0.05, radial), sockMat, [0, -0.29, 0]);

  // Yonex Power Cushion Court Shoes
  const footY = -CALF;
  // White technical mesh upper
  addMesh(knee, new CapsuleGeometry(0.042, 0.12, capSeg, radial), shoeUpperMat, [0, footY + 0.03, 0.05], [Math.PI / 2, 0, 0], [0.88, 1, 0.72]);
  // Magenta TPU lateral claw & heel counter
  addMesh(knee, new BoxGeometry(0.068, 0.032, 0.065), shoeMagentaMat, [side * 0.01, footY + 0.024, -0.01]);
  addMesh(knee, new CylinderGeometry(0.043, 0.044, 0.018, radial), shoeMagentaMat, [0, footY + 0.022, 0.04]);
  // Shoe side decal (Yonex logo)
  addMesh(knee, new BoxGeometry(0.01, 0.025, 0.04), shoeSideDecalMat, [side * 0.038, footY + 0.028, 0.04]);
  // White athletic tournament laces
  addMesh(knee, new BoxGeometry(0.03, 0.012, 0.06), whiteMat, [0, footY + 0.05, 0.04], [0.25, 0, 0]);
  // EVA cushion midsole
  addMesh(knee, new BoxGeometry(0.076, 0.018, 0.185), shoeMidsoleMat, [0, footY + 0.01, 0.045]);
  // Amber gum rubber non-marking court outsole
  addMesh(knee, new BoxGeometry(0.078, 0.009, 0.188), shoeGumSoleMat, [0, footY + 0.002, 0.045]);

  return { hip, knee };
};

const legR = buildLeg(-1);
const legL = buildLeg(1);

// ==========================================
// ANIMATION CLIPS (7 INCLUDED IN GLB)
// ==========================================
console.log("[generate-saina-glb] Creating 7 tournament action animations...");

// 1. SMASH ANIMATION (matching exact website timeline)
const smashTimes = [0.1, 0.36, 0.55, 0.7, 0.8, 1.0];
const smashRootY = [0.9, 0.8, 1.55, 1.6, 1.2, 0.86];
const smashRootZ = [0.0, 0.0, 0.1, 0.2, 0.35, 0.45];

const makeRotTracks = (jointName, rotations, times = smashTimes) => {
  const values = [];
  const q = new Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < rotations.length; i++) {
    const r = rotations[i];
    e.set(r[0], r[1], r[2]);
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new QuaternionKeyframeTrack(`${jointName}.quaternion`, times, values);
};

const smashTracks = [
  new VectorKeyframeTrack(
    "athlete_root.position",
    smashTimes,
    smashTimes.flatMap((_, i) => [0, 0, smashRootZ[i]]),
  ),
  new VectorKeyframeTrack(
    "hips.position",
    smashTimes,
    smashTimes.flatMap((_, i) => [0, smashRootY[i], 0]),
  ),
  makeRotTracks("hips", [[0, 0, 0], [0, -0.8, 0], [-0.1, -0.9, 0], [0, -0.2, 0], [0.1, 0.3, 0], [0.15, 0.3, 0]]),
  makeRotTracks("spine", [[0.05, 0, 0], [-0.1, -0.3, 0], [-0.25, -0.25, 0], [0.15, 0.1, 0], [0.35, 0.2, 0], [0.25, 0.1, 0]]),
  makeRotTracks("chest", [[0, 0, 0], [-0.05, -0.2, 0], [-0.1, -0.15, 0], [0.1, 0.2, 0], [0.2, 0.2, 0], [0.1, 0.1, 0]]),
  makeRotTracks("neck", [[-0.35, 0, 0], [-0.4, 0.9, 0], [-0.4, 0.8, 0], [-0.3, 0, 0], [-0.1, 0, 0], [-0.1, 0, 0]]),
  makeRotTracks("shoulderR", [[3.68, 0, -0.25], [2.4, 0, -0.5], [2.7, 0, -0.4], [3.33, 0, -0.15], [5.38, 0, 0.7], [5.78, 0, 0.4]]),
  makeRotTracks("elbowR", [[-0.3, 0, 0], [-1.9, 0, 0], [-2.3, 0, 0], [-0.05, 0, 0], [-0.4, 0, 0], [-0.5, 0, 0]]),
  makeRotTracks("shoulderL", [[-0.3, 0, 0.15], [-2.5, 0, 0.2], [-2.7, 0, 0.2], [-0.6, 0, 0.4], [0.3, 0, 0.3], [0.1, 0, 0.25]]),
  makeRotTracks("elbowL", [[-0.5, 0, 0], [-0.2, 0, 0], [-0.2, 0, 0], [-1.2, 0, 0], [-1.0, 0, 0], [-0.6, 0, 0]]),
  makeRotTracks("hipR", [[-0.25, 0, 0], [-0.5, 0, 0], [0.2, 0, 0], [-0.6, 0, 0], [-0.9, 0, 0], [-0.8, 0, 0]]),
  makeRotTracks("kneeR", [[0.45, 0, 0], [1.0, 0, 0], [1.4, 0, 0], [0.9, 0, 0], [1.0, 0, 0], [1.1, 0, 0]]),
  makeRotTracks("hipL", [[-0.1, 0, 0], [-0.3, 0, 0], [-0.9, 0, 0], [0.2, 0, 0], [0.1, 0, 0], [-0.2, 0, 0]]),
  makeRotTracks("kneeL", [[0.3, 0, 0], [0.8, 0, 0], [1.2, 0, 0], [1.2, 0, 0], [0.9, 0, 0], [0.7, 0, 0]]),
];
const smashClip = new AnimationClip("smash", 1.0, smashTracks);

// 2. IDLE ANIMATION
const idleClip = new AnimationClip("idle", 2.0, [
  new VectorKeyframeTrack("hips.position", [0, 1.0, 2.0], [0, 0.86, 0, 0, 0.87, 0, 0, 0.86, 0]),
  makeRotTracks("chest", [[0, 0, 0], [0.03, 0, 0], [0, 0, 0]], [0, 1.0, 2.0]),
]);

// 3. READY STANCE ANIMATION
const readyClip = new AnimationClip("ready", 1.0, [
  new VectorKeyframeTrack("hips.position", [0, 1.0], [0, 0.78, 0, 0, 0.78, 0]),
  makeRotTracks("hipR", [[-0.4, 0, 0], [-0.4, 0, 0]], [0, 1.0]),
  makeRotTracks("kneeR", [[0.6, 0, 0], [0.6, 0, 0]], [0, 1.0]),
  makeRotTracks("hipL", [[-0.4, 0, 0], [-0.4, 0, 0]], [0, 1.0]),
  makeRotTracks("kneeL", [[0.6, 0, 0], [0.6, 0, 0]], [0, 1.0]),
  makeRotTracks("shoulderR", [[1.2, 0, -0.4], [1.2, 0, -0.4]], [0, 1.0]),
  makeRotTracks("elbowR", [[-1.2, 0, 0], [-1.2, 0, 0]], [0, 1.0]),
]);

// 4. FOREHAND ANIMATION
const forehandClip = new AnimationClip("forehand", 1.2, [
  new VectorKeyframeTrack("hips.position", [0, 0.6, 1.2], [0, 0.84, 0, 0, 0.82, 0, 0, 0.84, 0]),
  makeRotTracks("shoulderR", [[0.5, 0, -0.3], [1.8, 0, -0.2], [2.6, 0, 0.4]], [0, 0.6, 1.2]),
  makeRotTracks("elbowR", [[-1.4, 0, 0], [-0.2, 0, 0], [-0.8, 0, 0]], [0, 0.6, 1.2]),
]);

// 5. BACKHAND ANIMATION
const backhandClip = new AnimationClip("backhand", 1.2, [
  new VectorKeyframeTrack("hips.position", [0, 0.6, 1.2], [0, 0.82, 0, 0, 0.8, 0, 0, 0.82, 0]),
  makeRotTracks("shoulderR", [[0.8, -0.8, 0.5], [1.5, -0.3, 0.2], [2.2, 0.4, -0.3]], [0, 0.6, 1.2]),
]);

// 6. LUNGE ANIMATION
const lungeClip = new AnimationClip("lunge", 1.5, [
  new VectorKeyframeTrack("hips.position", [0, 0.75, 1.5], [0, 0.84, 0, 0, 0.65, 0.3, 0, 0.84, 0]),
  makeRotTracks("hipR", [[-0.2, 0, 0], [-1.1, 0, 0], [-0.2, 0, 0]], [0, 0.75, 1.5]),
  makeRotTracks("kneeR", [[0.3, 0, 0], [1.5, 0, 0], [0.3, 0, 0]], [0, 0.75, 1.5]),
]);

// 7. RECOVERY ANIMATION
const recoveryClip = new AnimationClip("recovery", 1.0, [
  new VectorKeyframeTrack("hips.position", [0, 0.5, 1.0], [0, 0.75, 0.2, 0, 0.82, 0.1, 0, 0.86, 0]),
]);

const animations = [smashClip, idleClip, readyClip, forehandClip, backhandClip, lungeClip, recoveryClip];

root.traverse((obj) => {
  if (obj.isMesh) {
    obj.castShadow = true;
    obj.receiveShadow = true;
  }
});

const exporter = new GLTFExporter();
exporter.parse(
  root,
  async (glbBuffer) => {
    try {
      console.log("[generate-saina-glb] Initial GLB size:", glbBuffer.byteLength, "bytes");

      // Load PNG buffers to embed into the GLB
      const faceTexPath = join(rootDir, "public", "textures", "saina_face_front_seamless.png");
      const crestTexPath = join(rootDir, "public", "textures", "saina_chest_crest.png");
      const racketTexPath = join(rootDir, "public", "textures", "saina_racket_texture.png");
      const shoeTexPath = join(rootDir, "public", "textures", "saina_shoe_texture.png");

      const texturesToEmbed = [
        { name: "face", path: faceTexPath, matName: "M_SainaFaceDecal" },
        { name: "crest", path: crestTexPath, matName: "M_ChestCrestDecal" },
        { name: "racket", path: racketTexPath, matName: "M_RacketStencilDecal" },
        { name: "shoe", path: shoeTexPath, matName: "M_ShoeSideDecal" },
      ].filter((t) => existsSync(t.path));

      // Parse GLB chunks
      const dv = new DataView(glbBuffer);
      const jsonLen = dv.getUint32(12, true);
      const jsonStr = new TextDecoder().decode(new Uint8Array(glbBuffer, 20, jsonLen));
      const gltf = JSON.parse(jsonStr);

      const binChunkOffset = 20 + jsonLen;
      const binLen = dv.getUint32(binChunkOffset, true);
      let binData = Buffer.from(glbBuffer, binChunkOffset + 8, binLen);

      // Pad existing binData to 4 bytes
      const pad = (4 - (binData.length % 4)) % 4;
      if (pad > 0) binData = Buffer.concat([binData, Buffer.alloc(pad)]);

      if (!gltf.bufferViews) gltf.bufferViews = [];
      if (!gltf.images) gltf.images = [];
      if (!gltf.textures) gltf.textures = [];

      // Append each texture into binData and link to material
      for (const t of texturesToEmbed) {
        const fileBuf = readFileSync(t.path);
        const offset = binData.length;
        binData = Buffer.concat([binData, fileBuf]);
        const filePad = (4 - (binData.length % 4)) % 4;
        if (filePad > 0) binData = Buffer.concat([binData, Buffer.alloc(filePad)]);

        const bvIdx = gltf.bufferViews.length;
        gltf.bufferViews.push({
          buffer: 0,
          byteOffset: offset,
          byteLength: fileBuf.length,
        });

        const imgIdx = gltf.images.length;
        gltf.images.push({
          name: t.name,
          mimeType: "image/png",
          bufferView: bvIdx,
        });

        const texIdx = gltf.textures.length;
        gltf.textures.push({
          name: t.name,
          source: imgIdx,
        });

        const mat = gltf.materials.find((m) => m.name === t.matName);
        if (mat) {
          if (!mat.pbrMetallicRoughness) mat.pbrMetallicRoughness = {};
          mat.pbrMetallicRoughness.baseColorTexture = { index: texIdx };
        }
      }

      gltf.buffers[0].byteLength = binData.length;

      // Pack updated GLB
      let newJsonStr = JSON.stringify(gltf);
      let newJsonBuf = Buffer.from(newJsonStr, "utf8");
      const jsonPad = (4 - (newJsonBuf.length % 4)) % 4;
      if (jsonPad > 0) newJsonBuf = Buffer.concat([newJsonBuf, Buffer.from(" ".repeat(jsonPad))]);

      const header = Buffer.alloc(12);
      header.write("glTF", 0);
      header.writeUInt32LE(2, 4);
      const totalLen = 12 + 8 + newJsonBuf.length + 8 + binData.length;
      header.writeUInt32LE(totalLen, 8);

      const jsonChunkHeader = Buffer.alloc(8);
      jsonChunkHeader.writeUInt32LE(newJsonBuf.length, 0);
      jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

      const binChunkHeader = Buffer.alloc(8);
      binChunkHeader.writeUInt32LE(binData.length, 0);
      binChunkHeader.writeUInt32LE(0x004e4942, 4);

      const finalGlb = Buffer.concat([header, jsonChunkHeader, newJsonBuf, binChunkHeader, binData]);
      writeFileSync(outGlbPath, finalGlb);

      console.log(`[generate-saina-glb] SUCCESS! Output: ${outGlbPath} (${(finalGlb.length / 1024).toFixed(1)} KB)`);
      console.log("[generate-saina-glb] Model includes:", {
        nodes: gltf.nodes.length,
        meshes: gltf.meshes.length,
        materials: gltf.materials.length,
        textures: gltf.textures.length,
        animations: gltf.animations.map((a) => a.name),
      });
    } catch (e) {
      console.error("[generate-saina-glb] Packaging error:", e);
      process.exit(1);
    }
  },
  (err) => {
    console.error("[generate-saina-glb] Exporter error:", err);
    process.exit(1);
  },
  { binary: true, animations },
);
