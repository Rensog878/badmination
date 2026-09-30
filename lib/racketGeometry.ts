import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Curve,
  CylinderGeometry,
  Float32BufferAttribute,
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Procedural racket, modelled in metres with the butt at y = 0 and the long axis on +Y.
 * String bed lies in the XY plane (face normal = Z). Silhouette follows a modern
 * "isometric" power racket: squared-off oval head, wider at the shoulders.
 */
export const RACKET_DIMENSIONS = {
  length: 0.675,
  headHeight: 0.23,
  headWidth: 0.2,
  gripLength: 0.2,
  /** Head-heavy balance point, measured from the butt. Used as the pivot. */
  balancePoint: 0.305,
} as const;

/** World units per metre. Keeps the racket a comfortable size for camera maths. */
export const RACKET_SCALE = 4;

export type RacketDetail = "high" | "low";

// Frame cross-section: slightly flattened (deeper than it is wide).
const FRAME_HALF_WIDTH = 0.0036;
const FRAME_HALF_DEPTH = 0.0049;

// Head shape (centreline of the frame tube).
const HEAD_EXPONENT = 2.6; // >2 squares off the oval
const HEAD_SHOULDER_WIDEN = 0.075; // wider at the top shoulders
const HEAD_HALF_WIDTH = RACKET_DIMENSIONS.headWidth / 2 - FRAME_HALF_WIDTH - 0.004;
const HEAD_HALF_HEIGHT = RACKET_DIMENSIONS.headHeight / 2 - FRAME_HALF_WIDTH;
const HEAD_CENTER_Y = RACKET_DIMENSIONS.length - RACKET_DIMENSIONS.headHeight / 2;

// Throat / shaft / grip.
const THROAT_Y = HEAD_CENTER_Y - HEAD_HALF_HEIGHT - 0.052;
const THROAT_ARM_ANGLE = 0.52; // radians from the bottom centre where the arms leave the head
const SHAFT_TOP_RADIUS = 0.0034;
const SHAFT_BOTTOM_RADIUS = 0.0041;
const BUTT_CAP_HEIGHT = 0.012;
const GRIP_RADIUS = 0.0132;
const HANDLE_CONE_HEIGHT = 0.02;
const GRIP_WRAP_TURNS = 11;
const GRIP_WRAP_RADIUS = 0.0009;

// Strings.
const STRING_THICKNESS = 0.0009;
const STRING_LAYER_OFFSET = 0.0006;

const DETAIL = {
  high: { frameSegments: 420, frameRadial: 16, mains: 22, crosses: 24, round: 24, wrap: true },
  low: { frameSegments: 140, frameRadial: 8, mains: 11, crosses: 12, round: 10, wrap: false },
} as const;

// Carbon weave tiling (tiles per metre along the tube, tiles around).
const WEAVE_TILES_PER_METRE = 160;
const WEAVE_TILES_AROUND = 4;

const Z_AXIS = new Vector3(0, 0, 1);

function headPoint(theta: number, target: Vector3): Vector3 {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const x = HEAD_HALF_WIDTH * Math.sign(c) * Math.pow(Math.abs(c), 2 / HEAD_EXPONENT);
  const y = HEAD_HALF_HEIGHT * Math.sign(s) * Math.pow(Math.abs(s), 2 / HEAD_EXPONENT);
  const widen = 1 + HEAD_SHOULDER_WIDEN * (y / HEAD_HALF_HEIGHT);
  return target.set(x * widen, HEAD_CENTER_Y + y, 0);
}

/** Closed head loop, starting at the bottom centre and running counter-clockwise. */
class HeadCurve extends Curve<Vector3> {
  constructor() {
    super();
    this.arcLengthDivisions = 600;
  }

  getPoint(t: number, target = new Vector3()): Vector3 {
    return headPoint(-Math.PI / 2 + t * Math.PI * 2, target);
  }
}

class HelixCurve extends Curve<Vector3> {
  constructor(
    private readonly radius: number,
    private readonly startY: number,
    private readonly height: number,
    private readonly turns: number,
  ) {
    super();
  }

  getPoint(t: number, target = new Vector3()): Vector3 {
    const a = t * this.turns * Math.PI * 2;
    return target.set(
      Math.cos(a) * this.radius,
      this.startY + t * this.height,
      Math.sin(a) * this.radius,
    );
  }
}

interface FlatTubeOptions {
  segments: number;
  radial: number;
  halfWidth: number;
  halfDepth: number;
  t0?: number;
  t1?: number;
  /** Radius multiplier at t1 relative to t0 (1 = no taper). */
  taper?: number;
}

/**
 * Tube with an elliptical cross-section: `halfWidth` in the string plane,
 * `halfDepth` along the face normal. Works for curves lying in the XY plane.
 */
function buildFlatTube(curve: Curve<Vector3>, opts: FlatTubeOptions): BufferGeometry {
  const { segments, radial, halfWidth, halfDepth, t0 = 0, t1 = 1, taper = 1 } = opts;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const p = new Vector3();
  const tangent = new Vector3();
  const side = new Vector3();
  const normal = new Vector3();
  const length = curve.getLength() * (t1 - t0);
  const uRepeat = length * WEAVE_TILES_PER_METRE;

  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const t = t0 + (t1 - t0) * f;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, tangent);
    side.crossVectors(Z_AXIS, tangent).normalize();
    const scale = 1 + (taper - 1) * f;
    const rw = halfWidth * scale;
    const rd = halfDepth * scale;

    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      positions.push(
        p.x + side.x * cos * rw,
        p.y + side.y * cos * rw,
        p.z + sin * rd,
      );
      normal
        .set(side.x * cos * rd, side.y * cos * rd, sin * rw)
        .normalize();
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(f * uRepeat, (j / radial) * WEAVE_TILES_AROUND);
    }
  }

  const ring = radial + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j;
      const b = (i + 1) * ring + j;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, d, b, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/** Inner edge of the head frame as a 2D polygon (where strings terminate). */
function innerHeadPolygon(curve: HeadCurve, samples: number): Vector2[] {
  const p = new Vector3();
  const tangent = new Vector3();
  const inward = new Vector3();
  const points: Vector2[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, tangent);
    // Counter-clockwise loop: Z × T points toward the centre.
    inward.crossVectors(Z_AXIS, tangent).normalize();
    points.push(new Vector2(p.x + inward.x * FRAME_HALF_WIDTH, p.y + inward.y * FRAME_HALF_WIDTH));
  }
  return points;
}

/** Min/max of the polygon along the other axis where it crosses `value` on `axis`. */
function polygonSpan(poly: Vector2[], axis: "x" | "y", value: number): [number, number] | null {
  const other = axis === "x" ? "y" : "x";
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const av = a[axis];
    const bv = b[axis];
    if ((av - value) * (bv - value) > 0 || av === bv) continue;
    const f = (value - av) / (bv - av);
    const hit = a[other] + (b[other] - a[other]) * f;
    min = Math.min(min, hit);
    max = Math.max(max, hit);
  }
  return min < max ? [min, max] : null;
}

function buildStrings(curve: HeadCurve, mains: number, crosses: number): BufferGeometry {
  const poly = innerHeadPolygon(curve, 360);
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  // Strings run slightly into the frame so their ends are hidden.
  const overlap = FRAME_HALF_WIDTH * 0.6;
  const pieces: BufferGeometry[] = [];

  for (let i = 0; i < mains; i++) {
    const x = xMin + ((xMax - xMin) * (i + 1)) / (mains + 1);
    const span = polygonSpan(poly, "x", x);
    if (!span) continue;
    const len = span[1] - span[0] + overlap * 2;
    const g = new BoxGeometry(STRING_THICKNESS, len, STRING_THICKNESS);
    g.translate(x, (span[0] + span[1]) / 2, STRING_LAYER_OFFSET);
    pieces.push(g);
  }
  for (let i = 0; i < crosses; i++) {
    const y = yMin + ((yMax - yMin) * (i + 1)) / (crosses + 1);
    const span = polygonSpan(poly, "y", y);
    if (!span) continue;
    const len = span[1] - span[0] + overlap * 2;
    const g = new BoxGeometry(len, STRING_THICKNESS, STRING_THICKNESS);
    g.translate((span[0] + span[1]) / 2, y, -STRING_LAYER_OFFSET);
    pieces.push(g);
  }

  const merged = mergeGeometries(pieces) ?? new BufferGeometry();
  pieces.forEach((g) => g.dispose());
  return merged;
}

function buildThroatArm(side: 1 | -1, segments: number, radial: number) {
  const start = headPoint(-Math.PI / 2 + side * THROAT_ARM_ANGLE, new Vector3());
  const end = new Vector3(0, THROAT_Y, 0);
  const control = new Vector3(start.x * 0.22, start.y - 0.03, 0);
  const arm = new QuadraticBezierCurve3(start, control, end);
  return buildFlatTube(arm, {
    segments,
    radial,
    halfWidth: FRAME_HALF_WIDTH * 1.05,
    halfDepth: FRAME_HALF_DEPTH,
    taper: 0.9,
  });
}

function cylinderBetween(
  bottomY: number,
  topY: number,
  radiusBottom: number,
  radiusTop: number,
  radial: number,
): CylinderGeometry {
  const g = new CylinderGeometry(radiusTop, radiusBottom, topY - bottomY, radial, 1);
  g.translate(0, (bottomY + topY) / 2, 0);
  return g;
}

/** Subtle twill-weave carbon texture, generated once on a small canvas. */
export function createCarbonWeaveTexture(size = 64): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cells = 4;
  const cell = size / cells;
  for (let x = 0; x < cells; x++) {
    for (let y = 0; y < cells; y++) {
      const light = (x + y) % cells < cells / 2;
      const grad = light
        ? ctx.createLinearGradient(x * cell, 0, (x + 1) * cell, 0)
        : ctx.createLinearGradient(0, y * cell, 0, (y + 1) * cell);
      grad.addColorStop(0, light ? "#2a2c31" : "#141518");
      grad.addColorStop(0.5, light ? "#3a3c42" : "#1b1c20");
      grad.addColorStop(1, light ? "#2a2c31" : "#141518");
      ctx.fillStyle = grad;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export interface RacketPart {
  key: string;
  geometry: BufferGeometry;
  material: Material;
}

export interface RacketBuild {
  parts: RacketPart[];
  dispose: () => void;
}

export function buildRacket(detail: RacketDetail): RacketBuild {
  const d = DETAIL[detail];
  const head = new HeadCurve();

  const weave = createCarbonWeaveTexture();
  const shaftWeave = weave?.clone() ?? null;
  if (shaftWeave) {
    shaftWeave.repeat.set(3, 26);
    shaftWeave.needsUpdate = true;
  }

  const frameMaterial = new MeshPhysicalMaterial({
    color: weave ? "#ffffff" : "#141518",
    map: weave,
    metalness: 0.55,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
  });
  const shaftMaterial = frameMaterial.clone();
  shaftMaterial.map = shaftWeave;
  const accentMaterial = new MeshPhysicalMaterial({
    color: "#10B981",
    emissive: "#10B981",
    emissiveIntensity: 0.35,
    metalness: 0.3,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const stringMaterial = new MeshStandardMaterial({
    color: "#F3F4F6",
    roughness: 0.45,
    metalness: 0,
    transparent: true,
    opacity: 0.6,
  });
  const gripMaterial = new MeshStandardMaterial({ color: "#0d0d0e", roughness: 0.94, metalness: 0 });
  const capMaterial = new MeshPhysicalMaterial({
    color: "#0e0e10",
    roughness: 0.3,
    metalness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });

  const frame = buildFlatTube(head, {
    segments: d.frameSegments,
    radial: d.frameRadial,
    halfWidth: FRAME_HALF_WIDTH,
    halfDepth: FRAME_HALF_DEPTH,
  });
  const armSegments = Math.round(d.frameSegments / 10);
  const arms =
    mergeGeometries([
      buildThroatArm(1, armSegments, d.frameRadial),
      buildThroatArm(-1, armSegments, d.frameRadial),
    ]) ?? new BufferGeometry();

  const bandOpts = {
    segments: Math.round(d.frameSegments / 30),
    radial: d.frameRadial,
    halfWidth: FRAME_HALF_WIDTH * 1.07,
    halfDepth: FRAME_HALF_DEPTH * 1.07,
  };
  const BAND_HALF_SPAN = 0.006;
  const bandCentres = [0.3, 0.7];
  const headBands =
    mergeGeometries(
      bandCentres.map((c) =>
        buildFlatTube(head, { ...bandOpts, t0: c - BAND_HALF_SPAN, t1: c + BAND_HALF_SPAN }),
      ),
    ) ?? new BufferGeometry();

  const gripTop = RACKET_DIMENSIONS.gripLength;
  const shaftBottom = gripTop + HANDLE_CONE_HEIGHT;

  const throatJunction = cylinderBetween(THROAT_Y - 0.018, THROAT_Y + 0.004, SHAFT_TOP_RADIUS, 0.0052, d.round);
  const shaft = cylinderBetween(shaftBottom, THROAT_Y - 0.012, SHAFT_BOTTOM_RADIUS, SHAFT_TOP_RADIUS, d.round);
  const handleCone = cylinderBetween(gripTop, shaftBottom, GRIP_RADIUS * 0.93, SHAFT_BOTTOM_RADIUS * 1.1, d.round);

  const grip = cylinderBetween(BUTT_CAP_HEIGHT, gripTop, GRIP_RADIUS * 1.04, GRIP_RADIUS, 8);
  grip.rotateY(Math.PI / 8);
  const buttCap = cylinderBetween(0, BUTT_CAP_HEIGHT, GRIP_RADIUS * 1.08, GRIP_RADIUS * 1.12, 8);
  buttCap.rotateY(Math.PI / 8);

  const accentRings =
    mergeGeometries([
      cylinderBetween(shaftBottom + 0.004, shaftBottom + 0.011, SHAFT_BOTTOM_RADIUS * 1.18, SHAFT_BOTTOM_RADIUS * 1.18, d.round),
      (() => {
        const ring = cylinderBetween(BUTT_CAP_HEIGHT - 0.0015, BUTT_CAP_HEIGHT + 0.0015, GRIP_RADIUS * 1.13, GRIP_RADIUS * 1.13, 8);
        ring.rotateY(Math.PI / 8);
        return ring;
      })(),
    ]) ?? new BufferGeometry();

  const strings = buildStrings(head, d.mains, d.crosses);

  const parts: RacketPart[] = [
    { key: "frame", geometry: frame, material: frameMaterial },
    { key: "arms", geometry: arms, material: frameMaterial },
    { key: "head-bands", geometry: headBands, material: accentMaterial },
    { key: "throat", geometry: throatJunction, material: frameMaterial },
    { key: "shaft", geometry: shaft, material: shaftMaterial },
    { key: "handle-cone", geometry: handleCone, material: capMaterial },
    { key: "grip", geometry: grip, material: gripMaterial },
    { key: "butt-cap", geometry: buttCap, material: capMaterial },
    { key: "accent-rings", geometry: accentRings, material: accentMaterial },
    { key: "strings", geometry: strings, material: stringMaterial },
  ];

  if (d.wrap) {
    const wrapHeight = gripTop - BUTT_CAP_HEIGHT - 0.008;
    const helix = new HelixCurve(GRIP_RADIUS * 0.99, BUTT_CAP_HEIGHT + 0.004, wrapHeight, GRIP_WRAP_TURNS);
    const wrap = new TubeGeometry(helix, GRIP_WRAP_TURNS * 24, GRIP_WRAP_RADIUS, 5, false);
    parts.push({ key: "grip-wrap", geometry: wrap, material: gripMaterial });
  }

  const textures: Texture[] = [weave, shaftWeave].filter((t): t is CanvasTexture => t !== null);
  const materials = new Set(parts.map((p) => p.material));

  return {
    parts,
    dispose: () => {
      parts.forEach((p) => p.geometry.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
