import test from "node:test";
import assert from "node:assert/strict";
import { createGame, addTurn, evaluate, undoLastTurn, editTurn, computeStats, type GameState } from "./game";
import { judgeTurn, needsDoubleQuestion, canCheckout } from "./rules";
import { suggestCheckout } from "./checkout";

const cfg = (over: Partial<{ startScore: 301 | 501; doubleOut: boolean; players: string[] }> = {}) =>
  createGame({ startScore: 501, doubleOut: true, players: ["A", "B"], ...over });

function play(state: GameState, ...scores: Array<number | [number, boolean]>): GameState {
  for (const s of scores) {
    const [score, dbl] = Array.isArray(s) ? s : [s, false];
    const r = addTurn(state, { score, lastDartDouble: dbl });
    if (!r.ok) throw new Error(r.error);
    state = r.state;
  }
  return state;
}

test("normal scoring alternates players", () => {
  const s = play(cfg(), 100, 60, 45);
  const ev = evaluate(s);
  assert.deepEqual(ev.remaining, [356, 441]);
  assert.equal(ev.currentPlayer, 1);
});

test("bust when exceeding remaining keeps old score", () => {
  const s = play(cfg({ startScore: 301, players: ["A"] }), 180, 100); // 21 left
  assert.equal(evaluate(s).remaining[0], 21);
  const b = play(s, 60); // 60 > 21 -> bust
  assert.equal(evaluate(b).remaining[0], 21);
  assert.equal(evaluate(b).results.at(-1)!.kind, "bust");
});

test("double-out: leaving 1 is bust", () => {
  assert.equal(judgeTurn(40, 39, true, false).kind, "bust");
});

test("double-out: finish needs double", () => {
  assert.equal(judgeTurn(40, 40, true, true).kind, "finish");
  assert.equal(judgeTurn(40, 40, true, false).kind, "bust");
  assert.equal(needsDoubleQuestion(40, 40, true), true);
  assert.equal(needsDoubleQuestion(40, 40, false), false);
});

test("single-out finishes on exactly zero, 1 allowed", () => {
  assert.equal(judgeTurn(41, 40, false, false).kind, "ok");
  assert.equal(judgeTurn(41, 41, false, false).kind, "finish");
});

test("impossible totals and bogey checkouts", () => {
  assert.equal(judgeTurn(300, 179, false, false).kind, "invalid");
  assert.equal(canCheckout(169), false);
  assert.equal(judgeTurn(169, 169, true, true).kind, "invalid");
});

test("winner stops the game", () => {
  let s = play(cfg({ startScore: 301, players: ["A"] }), 180, 81); // 40 left
  assert.equal(evaluate(s).winner, null);
  s = play(s, [40, true]);
  assert.equal(evaluate(s).winner, 0);
  assert.equal(addTurn(s, { score: 10, lastDartDouble: false }).ok, false);
});

test("undo and edit replay correctly", () => {
  let s = play(cfg(), 100, 60, 45, 41);
  s = undoLastTurn(s);
  assert.equal(s.turns.length, 3);
  const e = editTurn(s, 0, { score: 140, lastDartDouble: false });
  assert.ok(e.ok);
  assert.equal(evaluate((e as any).state).remaining[0], 501 - 140 - 45);
});

test("edit that breaks later turns is rejected", () => {
  let s = play(cfg({ startScore: 301, players: ["A"] }), 180, 81, [40, true]);
  // making turn 1 a finish (121 left, double) would leave a turn after the end of the game
  const e = editTurn(s, 1, { score: 121, lastDartDouble: true });
  assert.equal(e.ok, false);
});

test("stats", () => {
  const s = play(cfg({ players: ["A"] }), 180, 100, 60);
  const [st] = computeStats(s);
  assert.equal(st.turns, 3);
  assert.ok(Math.abs(st.average - 113.333) < 0.01);
  assert.equal(st.maximums, 1);
  assert.equal(st.over100, 2);
});

test("checkout suggestions", () => {
  assert.deepEqual(suggestCheckout(170, true), ["T20", "T20", "Bull"]);
  assert.deepEqual(suggestCheckout(40, true), ["D20"]);
  assert.equal(suggestCheckout(169, true), null);
  assert.equal(suggestCheckout(171, true), null);
  const r = suggestCheckout(100, true)!;
  assert.equal(r.length, 2);
  for (let n = 2; n <= 170; n++) {
    if (canCheckout(n)) assert.ok(suggestCheckout(n, true), `no checkout for ${n}`);
  }
});

import { summarize } from "./summary";
test("summary for cloud stats", () => {
  const s = play(cfg({ startScore: 301, players: ["A", "B"] }), 180, 60, 81, 45, [40, true]);
  const a = summarize(s, 0);
  assert.equal(a.won, true);
  assert.equal(a.bestFinish, 40);
  assert.equal(a.maximums, 1);
  assert.equal(a.turns, 3);
  assert.equal(a.points, 180 + 81 + 40);
  assert.equal(summarize(s, 1).won, false);
});
