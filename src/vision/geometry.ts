/**
 * Standard (BDO/WDF) dartboard geometry. Board coordinates are in millimetres with the origin at the
 * centre of the bull, x to the right and y DOWN (like an image), so "up" on the board is -y.
 */

export const RADII = {
  bull: 6.35,
  outerBull: 15.9,
  trebleInner: 99,
  trebleOuter: 107,
  doubleInner: 162,
  doubleOuter: 170,
} as const;

/** Segment numbers clockwise starting at the top. */
export const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const;

export type Ring = "bull" | "outerBull" | "single" | "double" | "triple" | "miss";

export interface Score {
  ring: Ring;
  /** Segment number (undefined for bull/outer bull/miss). */
  number?: number;
  value: number;
  label: string; // "T20", "D16", "20", "25", "Bull", "–"
}

/** Clockwise angle from "up" in degrees, 0..360. */
export function angleDeg(x: number, y: number): number {
  const a = (Math.atan2(x, -y) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
}

export function scoreAt(x: number, y: number): Score {
  const r = Math.hypot(x, y);
  if (r <= RADII.bull) return { ring: "bull", value: 50, label: "Bull" };
  if (r <= RADII.outerBull) return { ring: "outerBull", value: 25, label: "25" };
  if (r > RADII.doubleOuter) return { ring: "miss", value: 0, label: "–" };

  const idx = Math.floor(((angleDeg(x, y) + 9) % 360) / 18);
  const n = SEGMENTS[idx];
  if (r >= RADII.doubleInner) return { ring: "double", number: n, value: n * 2, label: `D${n}` };
  if (r >= RADII.trebleInner && r <= RADII.trebleOuter) return { ring: "triple", number: n, value: n * 3, label: `T${n}` };
  return { ring: "single", number: n, value: n, label: String(n) };
}

/** Board point at radius r (mm) and clockwise angle (degrees from up). */
export function boardPoint(radius: number, angle: number): [number, number] {
  const t = (angle * Math.PI) / 180;
  return [radius * Math.sin(t), -radius * Math.cos(t)];
}

/**
 * The four points the user taps while calibrating: on the outer edge of the double ring, on the wire
 * between two segments. Roughly 90° apart so the perspective can be solved reliably.
 */
export const CALIBRATION_ANGLES = [351, 81, 189, 261] as const; // 20|5, 13|6, 19|3, 8|11 boundaries
export const CALIBRATION_LABELS = [
  "bovenaan, tussen de 20 en de 5",
  "rechts, tussen de 6 en de 13",
  "onderaan, tussen de 3 en de 19",
  "links, tussen de 11 en de 8",
] as const;

export const CALIBRATION_BOARD_POINTS: Array<[number, number]> = CALIBRATION_ANGLES.map((a) =>
  boardPoint(RADII.doubleOuter, a),
);
