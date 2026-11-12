import { RADII, SEGMENTS, angleDeg } from "./geometry";
import { createMapping, type BoardMapping, type Calibration } from "./calibration";
import { solveHomography, applyH, type Pt } from "./homography";
import { CALIBRATION_BOARD_POINTS } from "./geometry";
import type { RgbaImage } from "./image";

/** Synthetic dartboard renderer for tests only (not imported by the app). */

const BLACK = [28, 28, 28], CREAM = [232, 214, 168], RED = [196, 32, 36], GREEN = [24, 128, 56];

function boardColor(x: number, y: number): number[] {
  const r = Math.hypot(x, y);
  if (r > 215) return [150, 140, 130]; // wall
  if (r > RADII.doubleOuter + 0.5) return [14, 14, 14]; // number ring
  // wires (thin lines at ring edges and segment boundaries)
  for (const rr of [RADII.bull, RADII.outerBull, RADII.trebleInner, RADII.trebleOuter, RADII.doubleInner, RADII.doubleOuter]) {
    if (Math.abs(r - rr) < 0.5) return [170, 170, 170];
  }
  if (r <= RADII.bull) return RED;
  if (r <= RADII.outerBull) return GREEN;
  const a = angleDeg(x, y);
  const idx = Math.floor(((a + 9) % 360) / 18);
  const edgeDist = Math.abs((((a + 9) % 18) + 18) % 18);
  if (r > RADII.outerBull && (edgeDist < 0.15 || edgeDist > 17.85) && r > 20) return [170, 170, 170];
  const even = idx % 2 === 0;
  const ring = (r >= RADII.doubleInner) || (r >= RADII.trebleInner && r <= RADII.trebleOuter);
  if (ring) return even ? RED : GREEN;
  return even ? BLACK : CREAM;
}

export interface SynthDart { board: Pt; length?: number }
export interface SynthOptions {
  width: number; height: number;
  mapping: BoardMapping;
  darts?: SynthDart[];
  gain?: number; offset?: number; noise?: number;
  seed?: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function renderBoard(o: SynthOptions): RgbaImage {
  const { width: W, height: H, mapping } = o;
  const data = new Uint8Array(W * H * 4);
  const rand = rng(o.seed ?? 1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [bx, by] = mapping.toBoard([x, y]);
    const c = boardColor(bx, by);
    const i = (y * W + x) * 4;
    for (let k = 0; k < 3; k++) {
      const noise = o.noise ? (rand() - 0.5) * 2 * o.noise : 0;
      data[i + k] = Math.max(0, Math.min(255, c[k] * (o.gain ?? 1) + (o.offset ?? 0) + noise));
    }
    data[i + 3] = 255;
  }
  const c0 = mapping.toImage([0, 0]);
  for (const d of o.darts ?? []) {
    const T = mapping.toImage(d.board);
    let ox = T[0] - c0[0], oy = T[1] - c0[1];
    const n = Math.hypot(ox, oy) || 1; ox /= n; oy /= n;
    const len = d.length ?? 0.45 * Math.hypot(...(mapping.toImage([170, 0]).map((v, i) => v - c0[i]) as [number, number]));
    const F: Pt = [T[0] + ox * len, T[1] + oy * len];
    const minX = Math.floor(Math.min(T[0], F[0]) - 10), maxX = Math.ceil(Math.max(T[0], F[0]) + 10);
    const minY = Math.floor(Math.min(T[1], F[1]) - 10), maxY = Math.ceil(Math.max(T[1], F[1]) + 10);
    for (let y = Math.max(0, minY); y < Math.min(H, maxY); y++) for (let x = Math.max(0, minX); x < Math.min(W, maxX); x++) {
      const vx = F[0] - T[0], vy = F[1] - T[1];
      const t = Math.max(0, Math.min(1, ((x - T[0]) * vx + (y - T[1]) * vy) / (vx * vx + vy * vy)));
      const dist = Math.hypot(x - (T[0] + vx * t), y - (T[1] + vy * t));
      const width = t < 0.45 ? 3 : 3 + (t - 0.45) * 14; // thin barrel, wider flight
      if (dist <= width) {
        const i = (y * W + x) * 4;
        const col = t < 0.45 ? [110, 112, 120] : [20, 60, 200];
        data[i] = col[0]; data[i + 1] = col[1]; data[i + 2] = col[2];
      }
    }
  }
  return { width: W, height: H, data };
}

/** A camera looking at the board: a quad of the ±200 mm square, slightly keystoned like a tilted phone. */
export function makeCamera(W: number, H: number, keystone = 0, dx = 0, dy = 0): { mapping: BoardMapping; cal: Calibration } {
  const sq: Pt[] = [[-200, -200], [200, -200], [200, 200], [-200, 200]];
  const m = 0.04 * W, k = keystone * W;
  void dx; void dy;
  const quad: Pt[] = [[W * 0.1 + k + m, H * 0.5 - W * 0.4 + 0], [W * 0.9 - k - m, H * 0.5 - W * 0.4 + 0], [W * 0.9 - m, H * 0.5 + W * 0.4], [W * 0.1 + m, H * 0.5 + W * 0.4]];
  const shifted = quad.map(([x, y]) => [x + dx * W, y + dy * H] as Pt);
  const Hs = solveHomography(sq, shifted)!;
  const pts = CALIBRATION_BOARD_POINTS.map((p) => {
    const q = applyH(Hs, p);
    return [q[0] / W, q[1] / H] as Pt;
  }) as Calibration["points"];
  const cal: Calibration = { points: pts, savedAt: 0 };
  return { mapping: createMapping(cal, W, H)!, cal };
}
void SEGMENTS;
