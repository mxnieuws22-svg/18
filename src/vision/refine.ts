import { boxBlur, downscale, toGray, type RgbaImage } from "./image";
import { RADII, boardPoint } from "./geometry";
import { createMapping, type BoardMapping, type Calibration } from "./calibration";
import type { Pt } from "./homography";

const RINGS: Array<[number, number]> = [
  [RADII.trebleInner, 0.9], [RADII.trebleOuter, 0.9], [RADII.doubleInner, 1], [RADII.doubleOuter, 1], [RADII.outerBull, 0.4],
];
const BETWEEN_MM = [60, 134];
const ANGLES = 96;

/**
 * Fine-tune the four calibration points so the projected board rings land exactly on the ring edges in the
 * photo. The user's taps (or the automatic suggestion) are only a few pixels off, so a local search that moves
 * each point a little and keeps what improves the edge alignment converges to sub-pixel precision.
 * Unlike the straight-on suggestion, this also handles a tilted camera (full perspective).
 */
export function refineCalibration(input: RgbaImage, cal: Calibration): Calibration {
  const img = downscale(input, 480);
  const W = img.width, H = img.height;
  const gray = boxBlur(toGray(img), W, H, 1);
  const mag = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    mag[i] = Math.hypot(gray[i + 1] - gray[i - 1], gray[i + W] - gray[i - W]);
  }
  const maps = [boxBlur(boxBlur(mag, W, H, 3), W, H, 3), boxBlur(boxBlur(mag, W, H, 1), W, H, 1), mag];

  const samples: Array<Array<Pt>> = [];
  const groups: number[] = []; // weight per ring (negative = "between" penalty)
  for (const [mm, w] of RINGS) { samples.push(Array.from({ length: ANGLES }, (_, a) => boardPoint(mm, (a / ANGLES) * 360))); groups.push(w); }
  for (const mm of BETWEEN_MM) { samples.push(Array.from({ length: ANGLES }, (_, a) => boardPoint(mm, (a / ANGLES) * 360))); groups.push(-0.8); }

  const scoreOf = (map: Float32Array, m: BoardMapping | null): number => {
    if (!m) return -Infinity;
    let total = 0;
    for (let g = 0; g < samples.length; g++) {
      let s = 0, n = 0;
      for (const p of samples[g]) {
        const [x, y] = m.toImage(p);
        const xi = Math.round(x), yi = Math.round(y);
        if (xi >= 1 && yi >= 1 && xi < W - 1 && yi < H - 1) { s += map[yi * W + xi]; n++; }
      }
      if (n < ANGLES * 0.8) return -Infinity;
      total += groups[g] * (s / n);
    }
    return total;
  };

  const start: Pt[] = cal.points.map(([x, y]) => [x * W, y * H] as Pt);
  let cur: Pt[] = start.map((p) => [...p] as Pt);
  const toCal = (pts: Pt[]): Calibration => ({ ...cal, points: pts.map(([x, y]) => [x / W, y / H] as Pt) as Calibration["points"] });
  const mapOf = (pts: Pt[]) => createMapping(toCal(pts), W, H);
  const maxMove = 0.03 * W; // taps are expected within ~±6 px; never wander onto a neighbouring ring

  // Candidate moves: shift/scale/rotate the whole board together (these correlated moves are what a single
  // point can't do alone), plus nudging each point individually for perspective.
  const moves = (pts: Pt[], step: number): Pt[][] => {
    const out: Pt[][] = [];
    const cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) out.push(pts.map((p) => [p[0] + dx * step, p[1] + dy * step] as Pt));
    for (const k of [1 + 0.004 * step, 1 - 0.004 * step]) out.push(pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k] as Pt));
    for (const a of [0.0015 * step, -0.0015 * step]) {
      const c = Math.cos(a), sn = Math.sin(a);
      out.push(pts.map((p) => [cx + (p[0] - cx) * c - (p[1] - cy) * sn, cy + (p[0] - cx) * sn + (p[1] - cy) * c] as Pt));
    }
    for (let i = 0; i < 4; i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cand = pts.map((p) => [...p] as Pt);
      cand[i] = [cand[i][0] + dx * step, cand[i][1] + dy * step];
      out.push(cand);
    }
    return out;
  };

  const passes: Array<{ map: Float32Array; steps: number[]; rounds: number }> = [
    { map: maps[0], steps: [4, 2], rounds: 12 },
    { map: maps[1], steps: [1.5, 0.75], rounds: 12 },
    { map: maps[2], steps: [0.5, 0.25], rounds: 8 },
  ];
  for (const { map, steps, rounds } of passes) {
    let best = scoreOf(map, mapOf(cur));
    for (const step of steps) {
      for (let round = 0; round < rounds; round++) {
        let improved = false;
        for (const cand of moves(cur, step)) {
          if (cand.some((p, i) => Math.hypot(p[0] - start[i][0], p[1] - start[i][1]) > maxMove)) continue;
          const s = scoreOf(map, mapOf(cand));
          if (s > best + 1e-6) { best = s; cur = cand; improved = true; }
        }
        if (!improved) break;
      }
    }
  }
  return { ...toCal(cur), savedAt: cal.savedAt };
}
