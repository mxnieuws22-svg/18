import { canCheckout } from "./rules";

interface Dart { label: string; value: number; isDouble: boolean }

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const TRIPLES = range(20).map((n): Dart => ({ label: `T${n}`, value: n * 3, isDouble: false }));
const DOUBLES = range(20).map((n): Dart => ({ label: `D${n}`, value: n * 2, isDouble: true }));
const SINGLES = range(20).map((n): Dart => ({ label: `${n}`, value: n, isDouble: false }));
const OUTER: Dart = { label: "25", value: 25, isDouble: false };
const BULL: Dart = { label: "Bull", value: 50, isDouble: true };

/** Preferred order for non-final darts (scoring darts first). */
const SETUP: Dart[] = [
  ...[20, 19, 18, 17, 16, 15].map((n) => TRIPLES[n - 1]),
  BULL, OUTER,
  ...[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => SINGLES[n - 1]),
  ...[14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => TRIPLES[n - 1]),
];

/** Preferred finishing doubles (commonly comfortable ones first). */
const FINISH_DOUBLES: Dart[] = [20, 16, 18, 10, 8, 12, 14, 6, 4, 2, 17, 19, 15, 13, 11, 9, 7, 5, 3, 1]
  .map((n) => DOUBLES[n - 1]);
const FINISH: Dart[] = [BULL, ...FINISH_DOUBLES];
const FINISH_ANY: Dart[] = [...FINISH, ...SETUP];

/**
 * Suggest a route to finish, e.g. ["T20", "T20", "Bull"].
 * Returns null when no finish with ≤ 3 darts exists.
 */
export function suggestCheckout(remaining: number, doubleOut: boolean): string[] | null {
  if (remaining < 1 || remaining > 170) return null;
  if (doubleOut && !canCheckout(remaining)) return null;
  const last = doubleOut ? FINISH : FINISH_ANY;

  for (const l of last) {
    if (l.value === remaining) return [l.label];
  }
  // Two darts: prefer a comfortable finishing double, then the best setup dart.
  for (const l of last) {
    for (const a of SETUP) {
      if (a.value + l.value === remaining) return [a.label, l.label];
    }
  }
  for (const a of SETUP) {
    for (const b of SETUP) {
      for (const l of last) {
        if (a.value + b.value + l.value === remaining) return [a.label, b.label, l.label];
      }
    }
  }
  return null;
}
