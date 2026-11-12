import { judgeTurn, type JudgementKind, type StartScore } from "./rules";

export interface GameConfig {
  startScore: StartScore;
  doubleOut: boolean;
  players: string[]; // 1–4 names
}

/** What the user entered for one turn. */
export interface Turn {
  score: number;
  /** Only relevant for a double-out finish attempt. */
  lastDartDouble: boolean;
}

export interface GameState {
  config: GameConfig;
  turns: Turn[];
}

export interface TurnResult {
  turnIndex: number;
  playerIndex: number;
  rawScore: number;
  /** Points that counted (0 on bust). */
  counted: number;
  kind: JudgementKind;
  remainingBefore: number;
  remainingAfter: number;
}

export interface Evaluation {
  remaining: number[];
  results: TurnResult[];
  winner: number | null;
  currentPlayer: number;
  error?: string;
}

export const MAX_PLAYERS = 4;

export function createGame(config: GameConfig): GameState {
  return { config, turns: [] };
}

/** Replay all turns from scratch. Single source of truth: makes undo/edit trivial and safe. */
export function evaluate(state: GameState): Evaluation {
  const { config, turns } = state;
  const n = config.players.length;
  const remaining = config.players.map(() => config.startScore as number);
  const results: TurnResult[] = [];
  let winner: number | null = null;

  for (let i = 0; i < turns.length; i++) {
    if (winner !== null) {
      return { remaining, results, winner, currentPlayer: winner, error: "Er zijn beurten na het einde van het spel." };
    }
    const p = i % n;
    const t = turns[i];
    const j = judgeTurn(remaining[p], t.score, config.doubleOut, t.lastDartDouble);
    if (j.kind === "invalid") {
      return {
        remaining, results, winner,
        currentPlayer: i % n,
        error: `Beurt ${i + 1}: ${j.reason ?? "ongeldige score"}`,
      };
    }
    const before = remaining[p];
    remaining[p] = j.after;
    results.push({
      turnIndex: i,
      playerIndex: p,
      rawScore: t.score,
      counted: j.kind === "bust" ? 0 : t.score,
      kind: j.kind,
      remainingBefore: before,
      remainingAfter: j.after,
    });
    if (j.kind === "finish") winner = p;
  }
  return { remaining, results, winner, currentPlayer: winner ?? turns.length % n };
}

export type Change = { ok: true; state: GameState } | { ok: false; error: string };

function validate(next: GameState): Change {
  const ev = evaluate(next);
  return ev.error ? { ok: false, error: ev.error } : { ok: true, state: next };
}

export function addTurn(state: GameState, turn: Turn): Change {
  if (evaluate(state).winner !== null) return { ok: false, error: "Het spel is afgelopen." };
  return validate({ ...state, turns: [...state.turns, turn] });
}

export function undoLastTurn(state: GameState): GameState {
  return { ...state, turns: state.turns.slice(0, -1) };
}

/** Correct an earlier turn. Rejected if it would make the rest of the game inconsistent. */
export function editTurn(state: GameState, index: number, turn: Turn): Change {
  if (index < 0 || index >= state.turns.length) return { ok: false, error: "Beurt bestaat niet." };
  const turns = state.turns.slice();
  turns[index] = turn;
  return validate({ ...state, turns });
}

export interface PlayerStats {
  name: string;
  turns: number;
  /** Average points per turn (bust counts as 0). */
  average: number;
  highest: number;
  busts: number;
  over100: number;
  over140: number;
  maximums: number;
}

export function computeStats(state: GameState, ev: Evaluation = evaluate(state)): PlayerStats[] {
  return state.config.players.map((name, p) => {
    const mine = ev.results.filter((r) => r.playerIndex === p);
    const total = mine.reduce((s, r) => s + r.counted, 0);
    return {
      name,
      turns: mine.length,
      average: mine.length ? total / mine.length : 0,
      highest: mine.reduce((m, r) => Math.max(m, r.counted), 0),
      busts: mine.filter((r) => r.kind === "bust").length,
      over100: mine.filter((r) => r.counted >= 100).length,
      over140: mine.filter((r) => r.counted >= 140).length,
      maximums: mine.filter((r) => r.counted === 180).length,
    };
  });
}
