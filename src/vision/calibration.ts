import { CALIBRATION_BOARD_POINTS, RADII, boardPoint } from "./geometry";
import { applyH, invert, solveHomography, type Mat3, type Pt } from "./homography";

/** Four tapped image points, normalised to 0..1 (x/width, y/height) so they work at any resolution. */
export interface Calibration {
  points: [Pt, Pt, Pt, Pt];
  savedAt: number;
  /** width/height of the photo the points were tapped on; a different aspect means the camera setup changed. */
  aspect?: number;
}

export interface BoardMapping {
  /** image pixel -> board mm */
  toBoard: (p: Pt) => Pt;
  /** board mm -> image pixel */
  toImage: (p: Pt) => Pt;
}

/** Build the mapping for an image of the given size. null when the points are degenerate. */
export function createMapping(cal: Calibration, width: number, height: number): BoardMapping | null {
  const img: Pt[] = cal.points.map(([x, y]) => [x * width, y * height] as Pt);
  const Hbi = solveHomography(CALIBRATION_BOARD_POINTS, img); // board -> image
  if (!Hbi) return null;
  const Hib: Mat3 | null = invert(Hbi);
  if (!Hib) return null;
  const m: BoardMapping = { toImage: (p) => applyH(Hbi, p), toBoard: (p) => applyH(Hib, p) };
  // sanity: the board must map to a sensible convex-ish area (centre inside the four points' bounding box)
  const c = m.toImage([0, 0]);
  const xs = img.map((p) => p[0]), ys = img.map((p) => p[1]);
  if (c[0] < Math.min(...xs) || c[0] > Math.max(...xs) || c[1] < Math.min(...ys) || c[1] > Math.max(...ys)) return null;
  return m;
}

/** Polylines (in image pixels) of the board's rings and segment wires, for drawing an overlay. */
export function overlayLines(m: BoardMapping): { rings: Pt[][]; wires: Pt[][] } {
  const ring = (r: number): Pt[] => {
    const pts: Pt[] = [];
    for (let a = 0; a <= 360; a += 4) pts.push(m.toImage(boardPoint(r, a)));
    return pts;
  };
  const rings = [RADII.bull, RADII.outerBull, RADII.trebleInner, RADII.trebleOuter, RADII.doubleInner, RADII.doubleOuter].map(ring);
  const wires: Pt[][] = [];
  for (let i = 0; i < 20; i++) {
    const a = i * 18 + 9;
    wires.push([m.toImage(boardPoint(RADII.outerBull, a)), m.toImage(boardPoint(RADII.doubleOuter, a))]);
  }
  return { rings, wires };
}

/**
 * Frontal-view guess of the four calibration points from a circle (pixels of an image of size width x height):
 * centre cx,cy and the radius r of the OUTER edge of the double ring. Returns normalised points.
 */
export function pointsFromCircle(cx: number, cy: number, r: number, width: number, height: number): Calibration["points"] {
  const s = r / RADII.doubleOuter;
  return CALIBRATION_BOARD_POINTS.map(([x, y]) => [(cx + x * s) / width, (cy + y * s) / height] as Pt) as Calibration["points"];
}
