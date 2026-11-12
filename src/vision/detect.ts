import { toGray, boxBlur, resizeNearest, type RgbaImage } from "./image";
import { scoreAt, type Score } from "./geometry";
import type { BoardMapping } from "./calibration";
import type { Pt } from "./homography";

export interface FoundDart {
  /** Tip position in image pixels (of the reference photo). */
  tip: Pt;
  /** Tip position on the board in mm. */
  board: Pt;
  score: Score;
  confidence: number; // 0..1
  area: number;
}

export interface DetectionResult {
  darts: FoundDart[];
  warnings: string[];
  /** Diagnostics for tuning. */
  info: { threshold: number; blobs: number; boardRadiusPx: number };
}

export interface DetectOptions {
  maxDarts?: number;
  /** Only look this far from the board centre (mm); darts' flights stick out of the scoring area. */
  regionMm?: number;
}

const REGION_MM = 235;

/**
 * Compare a photo of the empty board with a photo after throwing and find the dart tips.
 * Pure function on pixel arrays: no UI, no camera. Assumes the camera did not move between photos.
 */
export function detectDarts(refIn: RgbaImage, afterIn: RgbaImage, map: BoardMapping, opts: DetectOptions = {}): DetectionResult {
  const maxDarts = opts.maxDarts ?? 3;
  const regionMm = opts.regionMm ?? REGION_MM;
  const warnings: string[] = [];
  const ref = refIn;
  const after = resizeNearest(afterIn, ref.width, ref.height);
  const W = ref.width, H = ref.height, N = W * H;

  // 1) board radius in px and region mask
  const c0 = map.toImage([0, 0]);
  const edge = map.toImage([170, 0]);
  const boardRadiusPx = Math.max(10, Math.hypot(edge[0] - c0[0], edge[1] - c0[1]));
  const inRegion = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const b = map.toBoard([x, y]);
    if (Math.hypot(b[0], b[1]) <= regionMm) inRegion[y * W + x] = 1;
  }

  // 2) blur each colour channel (a grey dart on a red ring has almost no luma contrast, but a clear red-channel one)
  const chan = (img: RgbaImage, c: number) => {
    const f = new Float32Array(N);
    for (let i = 0; i < N; i++) f[i] = img.data[i * 4 + c];
    return boxBlur(boxBlur(f, W, H, 1), W, H, 1);
  };
  const ch1 = [0, 1, 2].map((c) => chan(ref, c));
  const ch2 = [0, 1, 2].map((c) => chan(after, c));
  const g1 = boxBlur(boxBlur(toGray(ref), W, H, 1), W, H, 1);
  const g2 = boxBlur(boxBlur(toGray(after), W, H, 1), W, H, 1);

  // 3) match brightness/contrast of the two photos (auto-exposure, lamps) using the board region
  let n = 0, m1 = 0, m2 = 0;
  for (let i = 0; i < N; i += 3) if (inRegion[i]) { m1 += g1[i]; m2 += g2[i]; n++; }
  if (n === 0) return { darts: [], warnings: ["Het bord ligt buiten beeld. Kalibreer opnieuw."], info: { threshold: 0, blobs: 0, boardRadiusPx } };
  m1 /= n; m2 /= n;
  let v1 = 0, v2 = 0;
  for (let i = 0; i < N; i += 3) if (inRegion[i]) { v1 += (g1[i] - m1) ** 2; v2 += (g2[i] - m2) ** 2; }
  const gain = v2 > 1e-6 ? Math.min(2, Math.max(0.5, Math.sqrt(v1 / v2))) : 1;

  // 4) difference (largest change over the three channels) + robust threshold
  const diff = new Float32Array(N);
  const samples: number[] = [];
  for (let i = 0; i < N; i++) {
    let d = 0;
    for (let c = 0; c < 3; c++) {
      const adj = (ch2[c][i] - m2) * gain + m1; // same exposure correction for every channel
      d = Math.max(d, Math.abs(adj - (ch1[c][i] - 0)));
    }
    diff[i] = d;
    if (inRegion[i] && i % 3 === 0) samples.push(d);
  }
  samples.sort((a, b) => a - b);
  const med = samples[Math.floor(samples.length / 2)] ?? 0;
  const dev = samples.map((s) => Math.abs(s - med)).sort((a, b) => a - b);
  const mad = dev[Math.floor(dev.length / 2)] ?? 0;
  const threshold = med + Math.max(6 * 1.4826 * mad, 22);

  let mask: Uint8Array = new Uint8Array(N);
  for (let i = 0; i < N; i++) mask[i] = inRegion[i] && diff[i] > threshold ? 1 : 0;
  mask = dilate(erode(mask, W, H), W, H);

  // 5) connected components
  const minArea = 0.003 * boardRadiusPx * boardRadiusPx;
  const maxArea = 0.35 * boardRadiusPx * boardRadiusPx;
  const label = new Int32Array(N);
  type Blob = { px: number[]; area: number };
  const blobs: Blob[] = [];
  const stack: number[] = [];
  for (let s = 0; s < N; s++) {
    if (!mask[s] || label[s]) continue;
    const id = blobs.length + 1;
    const px: number[] = [];
    stack.push(s); label[s] = id;
    while (stack.length) {
      const p = stack.pop()!;
      px.push(p);
      const x = p % W, y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (mask[q] && !label[q]) { label[q] = id; stack.push(q); }
      }
    }
    blobs.push({ px, area: px.length });
  }
  const candidates = blobs.filter((b) => b.area >= minArea && b.area <= maxArea);

  // 6) per blob: principal axis -> tip
  const found: FoundDart[] = [];
  for (const b of candidates) {
    let sx = 0, sy = 0;
    for (const p of b.px) { sx += p % W; sy += Math.floor(p / W); }
    const cx = sx / b.area, cy = sy / b.area;
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of b.px) {
      const dx = (p % W) - cx, dy = Math.floor(p / W) - cy;
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    sxx /= b.area; syy /= b.area; sxy /= b.area;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy;
    const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = Math.max(1e-6, tr / 2 - disc);
    const elong = Math.sqrt(l1 / l2);
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const ax = Math.cos(ang), ay = Math.sin(ang);

    let tip: Pt = [cx, cy];
    if (elong >= 2) {
      // Flights stick out towards the camera, so they project further from the board centre than the tip.
      // The tip is therefore the extreme pixel along the axis that is closest to the board centre.
      let lo = Infinity, hi = -Infinity, pLo = 0, pHi = 0;
      for (const p of b.px) {
        const t = ((p % W) - cx) * ax + (Math.floor(p / W) - cy) * ay;
        if (t < lo) { lo = t; pLo = p; }
        if (t > hi) { hi = t; pHi = p; }
      }
      const a: Pt = [pLo % W, Math.floor(pLo / W)], z: Pt = [pHi % W, Math.floor(pHi / W)];
      const da = Math.hypot(a[0] - c0[0], a[1] - c0[1]), dz = Math.hypot(z[0] - c0[0], z[1] - c0[1]);
      const end = da <= dz ? a : z, other = da <= dz ? z : a;
      // Blur and morphology grow the blob a few pixels past the real tip: pull the tip back along the axis.
      const len = Math.hypot(other[0] - end[0], other[1] - end[1]) || 1;
      const inset = Math.min(0.024 * boardRadiusPx, len / 3);
      tip = [end[0] + ((other[0] - end[0]) / len) * inset, end[1] + ((other[1] - end[1]) / len) * inset];
    }
    const board = map.toBoard(tip);
    const rr = Math.hypot(board[0], board[1]);
    if (rr > 190) continue; // a bright reflection or a hand outside the scoring area
    const conf = Math.max(0.2, Math.min(0.95, 0.35 + 0.15 * Math.min(elong, 4) - (rr > 172 ? 0.2 : 0)));
    found.push({ tip, board, score: scoreAt(board[0], board[1]), confidence: conf, area: b.area });
  }

  found.sort((a, b) => b.area - a.area);
  if (found.length > maxDarts) warnings.push(`Er zijn ${found.length} voorwerpen gevonden; alleen de ${maxDarts} grootste worden getoond. Controleer het bord.`);
  const darts = found.slice(0, maxDarts);
  if (darts.length === 0) warnings.push("Geen darts gevonden. Controleer of de darts in het bord zitten, of de camera niet is bewogen en of het licht gelijk is.");
  if (darts.length > 0 && darts.length < maxDarts) warnings.push(`Er ${darts.length === 1 ? "is 1 dart" : `zijn ${darts.length} darts`} gevonden. Klopt dat?`);
  const areas = darts.map((d) => d.area).sort((a, b) => a - b);
  if (areas.length && areas[areas.length - 1] > 2.2 * areas[0] && areas.length > 1) {
    warnings.push("Eén voorwerp is veel groter dan de andere. Mogelijk raken twee darts elkaar.");
  }
  if (darts.some((d) => d.confidence < 0.5)) warnings.push("Bij sommige darts is de positie onzeker. Controleer de score.");
  return { darts, warnings, info: { threshold, blobs: candidates.length, boardRadiusPx } };
}

function erode(m: Uint8Array, w: number, h: number): Uint8Array {
  const o = new Uint8Array(m.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (m[i] && m[i - 1] && m[i + 1] && m[i - w] && m[i + w]) o[i] = 1;
  }
  return o;
}
function dilate(m: Uint8Array, w: number, h: number): Uint8Array {
  const o = new Uint8Array(m.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (m[i] || m[i - 1] || m[i + 1] || m[i - w] || m[i + w]) o[i] = 1;
  }
  return dilate1(o, w, h);
}
// one extra dilation so thin darts stay connected after the opening
function dilate1(m: Uint8Array, w: number, h: number): Uint8Array {
  const o = new Uint8Array(m.length);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (m[i] || m[i - 1] || m[i + 1] || m[i - w] || m[i + w]) o[i] = 1;
  }
  return o;
}
