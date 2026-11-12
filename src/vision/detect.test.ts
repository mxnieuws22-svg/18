import test from "node:test";
import assert from "node:assert/strict";
import { renderBoard, makeCamera } from "./synth";
import { detectDarts } from "./detect";
import { boardPoint, scoreAt } from "./geometry";

const W = 480, H = 640;
const labels = (r: ReturnType<typeof detectDarts>) => r.darts.map((d) => d.score.label).sort();
const target = (rad: number, ang: number) => boardPoint(rad, ang);

for (const [name, keystone] of [["frontal", 0], ["tilted", 0.07]] as const) {
  test(`detects three darts (${name})`, () => {
    const { mapping } = makeCamera(W, H, keystone);
    const wanted = [target(103, 0), target(130, 18 * 1 + 2), target(166, 18 * 13)]; // T20, 1, D16
    const expected = wanted.map((p) => scoreAt(p[0], p[1]).label).sort();
    assert.deepEqual(expected, ["1", "D16", "T20"]);
    const ref = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 1 });
    const after = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 2, darts: wanted.map((board) => ({ board })) });
    const res = detectDarts(ref, after, mapping);
    assert.deepEqual(labels(res), expected, JSON.stringify(res.darts.map((d) => [d.score.label, d.board.map(Math.round)])));
  });
}

test("copes with a brightness change between photos", () => {
  const { mapping } = makeCamera(W, H, 0.03);
  const wanted = [target(103, 18 * 4), target(60, 18 * 9 + 3)];
  const expected = wanted.map((p) => scoreAt(p[0], p[1]).label).sort();
  const ref = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 3 });
  const after = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 4, gain: 1.12, offset: 9, darts: wanted.map((board) => ({ board })) });
  assert.deepEqual(labels(detectDarts(ref, after, mapping)), expected);
});

test("no darts gives a warning, not a crash", () => {
  const { mapping } = makeCamera(W, H);
  const ref = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 5 });
  const after = renderBoard({ width: W, height: H, mapping, noise: 3, seed: 6 });
  const res = detectDarts(ref, after, mapping);
  assert.equal(res.darts.length, 0);
  assert.ok(res.warnings.length > 0);
});
