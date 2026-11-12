import test from "node:test";
import assert from "node:assert/strict";
import { compareSetup, type Capture } from "./types";

const cap = (w: number, h: number, t = 0): Capture => ({ uri: "x", width: w, height: h, takenAt: t });

test("same setup gives no warnings", () => {
  assert.deepEqual(compareSetup(cap(3000, 4000), cap(3000, 4000, 1000)), []);
});
test("rotated phone warns", () => {
  assert.equal(compareSetup(cap(3000, 4000), cap(4000, 3000)).length, 1);
});
test("different aspect ratio warns", () => {
  assert.equal(compareSetup(cap(3000, 4000), cap(3000, 5300)).length, 1);
});
test("old reference warns", () => {
  assert.equal(compareSetup(cap(3000, 4000, 0), cap(3000, 4000, 7 * 3600 * 1000)).length, 1);
});
