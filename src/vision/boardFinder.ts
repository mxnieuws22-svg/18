import { downscale, toGray, boxBlur, type RgbaImage } from "./image";
import { RADII } from "./geometry";

export interface FoundBoard {
  /** Centre and outer double-ring radius in pixels of the ORIGINAL image. */
  cx: number;
  cy: number;
  r: number;
  /** 0..1: how well the ring pattern matches. Low means "just a guess". */
  confidence: number;
}

const RINGS: Array<[number, number]> = [
  [RADII.trebleInner, 0.9], [RADII.trebleOuter, 0.9], [RADII.doubleInner, 1], [RADII.doubleOuter, 1], [RADII.outerBull, 0.4],
];
const BETWEEN_MM = [60, 134]; // plain single-field radii: should show NO ring edge

/**
 * Suggest where the board is, assuming the camera looks roughly straight at it (circle, not ellipse).
 * Starts from the on-screen guide circle (the user was told to fit the board into it) and searches
 * centre and size for the best alignment of the board's ring edges (treble, double) in the image.
 * Concentric rings are matched, so the straight segment wires do not confuse it.
 * It is only a starting suggestion: the user confirms or corrects it with the four calibration taps.
 */
export function findBoard(input: RgbaImage, guide?: { cx: number; cy: number; r: number }): FoundBoard | null {
  const img = downscale(input, 240);
  const f = input.width / img.width;
  const W = img.width, H = img.height;
  const gray = boxBlur(toGray(img), W, H, 1);
  const mag = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    mag[i] = Math.hypot(gray[i + 1] - gray[i - 1], gray[i + W] - gray[i - W]);
  }
  const g = guide
    ? { cx: guide.cx / f, cy: guide.cy / f, r: guide.r / f }
    : { cx: W / 2, cy: H / 2, r: 0.43 * W };

  const ANG = 72;
  const cosT = new Float32Array(ANG), sinT = new Float32Array(ANG);
  for (let a = 0; a < ANG; a++) { cosT[a] = Math.cos((a / ANG) * 2 * Math.PI); sinT[a] = Math.sin((a / ANG) * 2 * Math.PI); }

  // Multi-scale: a heavily blurred edge map gives wide "basins" so a coarse search still feels the rings
  // from several pixels away; later passes use sharper maps for precision.
  const maps = [boxBlur(boxBlur(mag, W, H, 3), W, H, 3), boxBlur(boxBlur(mag, W, H, 1), W, H, 1), mag];

  const ringMean = (map: Float32Array, cx: number, cy: number, rPx: number): number => {
    let s = 0, n = 0;
    for (let a = 0; a < ANG; a++) {
      const x = Math.round(cx + cosT[a] * rPx), y = Math.round(cy + sinT[a] * rPx);
      if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) { s += map[y * W + x]; n++; }
    }
    return n < ANG * 0.7 ? -1 : s / n;
  };

  const score = (map: Float32Array, cx: number, cy: number, rOuter: number): number => {
    const k = rOuter / RADII.doubleOuter;
    let sc = 0;
    for (const [mm, w] of RINGS) {
      const v = ringMean(map, cx, cy, mm * k);
      if (v < 0) return -Infinity;
      sc += w * v;
    }
    for (const mm of BETWEEN_MM) {
      const v = ringMean(map, cx, cy, mm * k);
      if (v < 0) return -Infinity;
      sc -= 0.8 * v;
    }
    return sc;
  };

  const minSide = Math.min(W, H);
  let best = { cx: g.cx, cy: g.cy, r: g.r, s: -Infinity };
  let c0 = { cx: g.cx, cy: g.cy, r: g.r };
  const plan = [
    { map: maps[0], stepC: 0.015 * minSide, stepR: 0.02 * g.r, spanC: 10, spanR: 16 }, // ±15% centre, ±32% size
    { map: maps[1], stepC: 0.006 * minSide, stepR: 0.008 * g.r, spanC: 3, spanR: 3 },
    { map: maps[2], stepC: 0.002 * minSide, stepR: 0.003 * g.r, spanC: 3, spanR: 3 },
  ];
  for (const { map, stepC, stepR, spanC, spanR } of plan) {
    best = { ...c0, s: -Infinity };
    for (let ix = -spanC; ix <= spanC; ix++) for (let iy = -spanC; iy <= spanC; iy++) for (let ir = -spanR; ir <= spanR; ir++) {
      const cx = c0.cx + ix * stepC, cy = c0.cy + iy * stepC, r = c0.r + ir * stepR;
      if (r < 0.2 * minSide || r > 0.55 * minSide) continue;
      const s = score(map, cx, cy, r);
      if (s > best.s) best = { cx, cy, r, s };
    }
    if (!isFinite(best.s)) return null;
    c0 = { cx: best.cx, cy: best.cy, r: best.r };
  }

  // confidence: ring edges clearly stronger than the plain fields in between
  const k = best.r / RADII.doubleOuter;
  const ringAvg = RINGS.reduce((a, [mm]) => a + Math.max(ringMean(maps[1], best.cx, best.cy, mm * k), 0), 0) / RINGS.length;
  const betweenAvg = BETWEEN_MM.reduce((a, mm) => a + Math.max(ringMean(maps[1], best.cx, best.cy, mm * k), 0), 0) / BETWEEN_MM.length;
  const confidence = Math.max(0, Math.min(1, ringAvg > 0 ? (ringAvg - betweenAvg) / ringAvg : 0));
  return { cx: best.cx * f, cy: best.cy * f, r: best.r * f, confidence };
}
