import { evaluate, type GameState } from "./game";

/** Per-player numbers for one finished (or running) game; stored with the game in the cloud. */
export interface PlayerSummary {
  points: number;
  turns: number;
  highest: number;
  over100: number;
  over140: number;
  maximums: number;
  busts: number;
  bestFinish: number | null;
  won: boolean;
}

export function summarize(game: GameState, player: number): PlayerSummary {
  const ev = evaluate(game);
  const mine = ev.results.filter((r) => r.playerIndex === player);
  const finish = mine.find((r) => r.kind === "finish");
  return {
    points: mine.reduce((s, r) => s + r.counted, 0),
    turns: mine.length,
    highest: mine.reduce((m, r) => Math.max(m, r.counted), 0),
    over100: mine.filter((r) => r.counted >= 100).length,
    over140: mine.filter((r) => r.counted >= 140).length,
    maximums: mine.filter((r) => r.counted === 180).length,
    busts: mine.filter((r) => r.kind === "bust").length,
    bestFinish: finish ? finish.remainingBefore : null,
    won: ev.winner === player,
  };
}
