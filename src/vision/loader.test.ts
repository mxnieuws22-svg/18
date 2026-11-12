import test from "node:test";
import assert from "node:assert/strict";
import { base64ToBytes } from "./base64";

test("base64 decoding matches Buffer", () => {
  for (const len of [0, 1, 2, 3, 4, 5, 100, 257]) {
    const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + 11) & 255);
    const b64 = Buffer.from(bytes).toString("base64");
    assert.deepEqual(Array.from(base64ToBytes(b64)), Array.from(bytes), `len ${len}`);
    assert.deepEqual(Array.from(base64ToBytes("data:image/jpeg;base64," + b64)), Array.from(bytes));
  }
});
