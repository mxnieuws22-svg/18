import test from "node:test";
import assert from "node:assert/strict";
import { renderBoard, makeCamera } from "./synth";
import { refineCalibration } from "./refine";
import { createMapping, type Calibration } from "./calibration";
import { scoreAt, boardPoint } from "./geometry";

const W = 480, H = 640;
let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

/** Mean error in mm when mapping known board points through a calibration vs the truth. */
function errMm(truthCal: Calibration, cal: Calibration): number {
  const t = createMapping(truthCal, W, H)!, m = createMapping(cal, W, H)!;
  let sum = 0, n = 0;
  for (const r of [60, 103, 134, 166]) for (let a = 0; a < 360; a += 30) {
    const bp = boardPoint(r, a);
    const b = m.toBoard(t.toImage(bp));
    sum += Math.hypot(b[0] - bp[0], b[1] - bp[1]); n++;
  }
  return sum / n;
}

for (const [name, keystone] of [["frontal", 0], ["tilted", 0.05]] as const) {
  test(`refinement pulls sloppy taps onto the rings (${name})`, () => {
    const { mapping, cal } = makeCamera(W, H, keystone, 0.02, -0.01);
    const img = renderBoard({ width: W, height: H, mapping, noise: 4, seed: 21 });
    let before = 0, after = 0; const runs = 6;
    for (let k = 0; k < runs; k++) {
      const sloppy: Calibration = { ...cal, points: cal.points.map(([x, y]) => [x + (rnd() - 0.5) * 24 / W, y + (rnd() - 0.5) * 24 / H]) as Calibration["points"] };
      const fixed = refineCalibration(img, sloppy);
      before += errMm(cal, sloppy); after += errMm(cal, fixed);
    }
    before /= runs; after /= runs;
    assert.ok(after < before * 0.6, `before ${before.toFixed(1)} mm, after ${after.toFixed(1)} mm`);
    assert.ok(after < 4.0, `after ${after.toFixed(2)} mm is too large`);
  });
}

test("a refined calibration scores darts correctly where raw taps would not", () => {
  const { mapping, cal } = makeCamera(W, H, 0.02);
  const img = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 5 });
  const sloppy: Calibration = { ...cal, points: cal.points.map(([x, y]) => [x + 9 / W, y - 8 / H]) as Calibration["points"] };
  const fixed = refineCalibration(img, sloppy);
  const target = boardPoint(103, 36); // T-ring, middle
  const lab = (c: Calibration) => { const m = createMapping(c, W, H)!; const b = m.toBoard(mapping.toImage(target)); return scoreAt(b[0], b[1]).label; };
  assert.equal(lab(fixed), scoreAt(target[0], target[1]).label);
});
