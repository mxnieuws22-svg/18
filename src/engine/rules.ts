/**
 * Pure darts rules. No React, no storage: easy to test and reusable when
 * camera recognition later supplies scores per dart.
 */

export type StartScore = 301 | 501;

/** Totals that cannot be thrown with three darts. */
export const IMPOSSIBLE_TURN_TOTALS = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179]);
/** Remaining scores that can never be finished with a double-out (≤ 170). */
export const BOGEY_CHECKOUTS = new Set([159, 162, 163, 165, 166, 168, 169]);

export function canCheckout(remaining: number): boolean {
  return remaining >= 2 && remaining <= 170 && !BOGEY_CHECKOUTS.has(remaining);
}

export function isValidTurnTotal(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 180 && !IMPOSSIBLE_TURN_TOTALS.has(score);
}

export type JudgementKind = "ok" | "bust" | "finish" | "invalid";

export interface Judgement {
  kind: JudgementKind;
  reason?: string;
  /** Remaining points after this turn (unchanged on bust/invalid). */
  after: number;
}

/**
 * Decide what a turn does.
 * @param lastDartDouble only matters when a double-out finish is attempted.
 */
export function judgeTurn(
  remaining: number,
  score: number,
  doubleOut: boolean,
  lastDartDouble: boolean,
): Judgement {
  if (!isValidTurnTotal(score)) {
    return { kind: "invalid", reason: "Deze score is niet mogelijk met drie darts.", after: remaining };
  }
  const after = remaining - score;
  if (after < 0) return { kind: "bust", reason: "Meer dan het restant", after: remaining };
  if (doubleOut) {
    if (after === 1) return { kind: "bust", reason: "Restant 1 kan niet worden uitgegooid", after: remaining };
    if (after === 0) {
      if (!canCheckout(remaining)) {
        return { kind: "invalid", reason: `${remaining} kan niet worden uitgegooid.`, after: remaining };
      }
      return lastDartDouble
        ? { kind: "finish", after: 0 }
        : { kind: "bust", reason: "Laatste dart was geen dubbel", after: remaining };
    }
    return { kind: "ok", after };
  }
  return after === 0 ? { kind: "finish", after: 0 } : { kind: "ok", after };
}

/** True when we must ask the user whether the last dart was a double. */
export function needsDoubleQuestion(remaining: number, score: number, doubleOut: boolean): boolean {
  return doubleOut && score === remaining && isValidTurnTotal(score) && canCheckout(remaining);
}
