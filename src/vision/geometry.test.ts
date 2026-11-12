import test from "node:test";
import assert from "node:assert/strict";
import { scoreAt, boardPoint, RADII, SEGMENTS } from "./geometry";
import { solveHomography, applyH, invert, type Pt } from "./homography";
import { createMapping } from "./calibration";
import { CALIBRATION_BOARD_POINTS } from "./geometry";

const at = (r: number, a: number) => { const [x, y] = boardPoint(r, a); return scoreAt(x, y); };

test("segments around the board", () => {
  SEGMENTS.forEach((n, i) => assert.equal(at(130, i * 18).number, n, `segment ${i}`));
  assert.equal(at(130, 0).label, "20");
  assert.equal(at(130, 90).label, "6");
  assert.equal(at(130, 180).label, "3");
  assert.equal(at(130, 270).label, "11");
});
test("rings", () => {
  assert.equal(at(103, 0).label, "T20");
  assert.equal(at(166, 0).label, "D20");
  assert.equal(at(166, 18 * 14).label, "D8");
  assert.equal(at(10, 33).label, "25");
  assert.equal(at(3, 200).label, "Bull");
  assert.equal(at(175, 0).label, "–");
  assert.equal(at(50, 0).value, 20);
  assert.equal(at(103, 18 * 3).value, 12); // T4
});
test("wire boundaries are on the right side of segment edges", () => {
  assert.equal(at(130, 8.9).number, 20);
  assert.equal(at(130, 9.1).number, 1);
  assert.equal(at(130, 350.9).number, 5);
  assert.equal(at(130, 351.1).number, 20);
});
test("homography round trip", () => {
  const src: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const dst: Pt[] = [[10, 20], [110, 30], [100, 140], [5, 120]];
  const H = solveHomography(src, dst)!;
  src.forEach((p, i) => { const q = applyH(H, p); assert.ok(Math.hypot(q[0] - dst[i][0], q[1] - dst[i][1]) < 1e-6); });
  const Hi = invert(H)!;
  const back = applyH(Hi, applyH(H, [0.3, 0.7]));
  assert.ok(Math.hypot(back[0] - 0.3, back[1] - 0.7) < 1e-9);
  assert.equal(solveHomography([[0,0],[1,1],[2,2],[3,3]], dst), null);
});
test("calibration maps tapped points back to board", () => {
  // simulate a tilted camera: normalised image points of the 4 calibration marks
  const cal = { points: [[0.5, 0.1], [0.88, 0.5], [0.52, 0.92], [0.12, 0.48]] as any, savedAt: 0 };
  const m = createMapping(cal, 640, 800)!;
  assert.ok(m);
  CALIBRATION_BOARD_POINTS.forEach((bp, i) => {
    const img = m.toImage(bp);
    assert.ok(Math.abs(img[0] - cal.points[i][0] * 640) < 1e-6);
    const back = m.toBoard(img);
    assert.ok(Math.hypot(back[0] - bp[0], back[1] - bp[1]) < 1e-6);
  });
  const centre = m.toImage([0, 0]);
  assert.ok(centre[0] > 200 && centre[0] < 440);
  void RADII;
});
