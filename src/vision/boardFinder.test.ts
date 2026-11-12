import test from "node:test";
import assert from "node:assert/strict";
import { renderBoard, makeCamera } from "./synth";
import { findBoard } from "./boardFinder";

test("finds a frontal board: centre and radius", () => {
  const W = 480, H = 640;
  const { mapping } = makeCamera(W, H, 0);
  const img = renderBoard({ width: W, height: H, mapping, noise: 4, seed: 9 });
  const c = mapping.toImage([0, 0]);
  const rTrue = Math.hypot(...(mapping.toImage([170, 0]).map((v, i) => v - c[i]) as [number, number]));
  const f = findBoard(img)!;
  assert.ok(f, "no result");
  assert.ok(Math.hypot(f.cx - c[0], f.cy - c[1]) < 0.06 * rTrue, `centre off: ${f.cx},${f.cy} vs ${c}`);
  assert.ok(Math.abs(f.r - rTrue) < 0.1 * rTrue, `radius off: ${f.r} vs ${rTrue}`);
});

test("finds an off-centre board that is slightly smaller than the guide", () => {
  const W = 480, H = 640;
  const { mapping } = makeCamera(W, H, 0, 0.05, -0.04);
  const img = renderBoard({ width: W, height: H, mapping, noise: 4, seed: 11 });
  const c = mapping.toImage([0, 0]);
  const rTrue = Math.hypot(...(mapping.toImage([170, 0]).map((v, i) => v - c[i]) as [number, number]));
  const f = findBoard(img)!;
  assert.ok(Math.hypot(f.cx - c[0], f.cy - c[1]) < 0.06 * rTrue, `centre off: ${f.cx},${f.cy} vs ${c}`);
  assert.ok(Math.abs(f.r - rTrue) < 0.1 * rTrue, `radius off: ${f.r} vs ${rTrue}`);
});
