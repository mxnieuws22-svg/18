import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { evaluate, type GameState } from "../engine/game";
import { summarize } from "../engine/summary";

/**
 * Offline-first sync: finished games go into a local outbox and are uploaded when possible.
 * Upload is an upsert on the game id, so retries never create duplicates.
 */
const OUTBOX_KEY = "darts.outbox.v1";
const ME = 0; // the account holder is always player 1

interface Queued { userId: string; game: GameState }

async function readOutbox(): Promise<Queued[]> {
  try { return JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) ?? "[]"); } catch { return []; }
}
const writeOutbox = (q: Queued[]) => AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(q)).catch(() => {});

export function isFinished(game: GameState): boolean {
  return evaluate(game).winner !== null;
}

export function toRow(userId: string, game: GameState) {
  const s = summarize(game, ME);
  const ev = evaluate(game);
  return {
    id: game.id,
    user_id: userId,
    played_at: game.startedAt,
    start_score: game.config.startScore,
    double_out: game.config.doubleOut,
    players: game.config.players,
    winner: ev.winner,
    turns: game.turns,
    my_won: s.won,
    my_points: s.points,
    my_turns: s.turns,
    my_highest: s.highest,
    my_100: s.over100,
    my_140: s.over140,
    my_180: s.maximums,
    my_busts: s.busts,
    my_best_finish: s.bestFinish,
  };
}

export async function enqueueFinished(userId: string, game: GameState): Promise<void> {
  if (!isFinished(game)) return;
  const q = (await readOutbox()).filter((x) => x.game.id !== game.id);
  q.push({ userId, game });
  await writeOutbox(q);
  await flushOutbox(userId);
}

/** Try to upload everything queued for this user. Safe to call often. */
export async function flushOutbox(userId: string): Promise<void> {
  if (!supabase) return;
  const q = await readOutbox();
  const rest: Queued[] = [];
  for (const item of q) {
    if (item.userId !== userId) { rest.push(item); continue; }
    try {
      const { error } = await supabase.from("games").upsert(toRow(userId, item.game));
      if (error) rest.push(item);
    } catch { rest.push(item); }
  }
  await writeOutbox(rest);
}

export interface CloudGame {
  id: string;
  played_at: string;
  start_score: number;
  double_out: boolean;
  players: string[];
  my_won: boolean;
  my_points: number;
  my_turns: number;
  my_highest: number;
  my_100: number;
  my_140: number;
  my_180: number;
  my_busts: number;
  my_best_finish: number | null;
}

export async function fetchGames(limit = 200): Promise<CloudGame[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("games")
    .select("id,played_at,start_score,double_out,players,my_won,my_points,my_turns,my_highest,my_100,my_140,my_180,my_busts,my_best_finish")
    .order("played_at", { ascending: false }).limit(limit);
  return error ? null : (data as CloudGame[]);
}

export interface Career {
  games: number;
  wins: number;
  average: number;
  highest: number;
  over100: number;
  over140: number;
  maximums: number;
  bestFinish: number | null;
}

export function career(games: CloudGame[]): Career {
  const points = games.reduce((s, g) => s + g.my_points, 0);
  const turns = games.reduce((s, g) => s + g.my_turns, 0);
  const finishes = games.map((g) => g.my_best_finish).filter((x): x is number => x !== null);
  return {
    games: games.length,
    wins: games.filter((g) => g.my_won).length,
    average: turns ? points / turns : 0,
    highest: games.reduce((m, g) => Math.max(m, g.my_highest), 0),
    over100: games.reduce((s, g) => s + g.my_100, 0),
    over140: games.reduce((s, g) => s + g.my_140, 0),
    maximums: games.reduce((s, g) => s + g.my_180, 0),
    bestFinish: finishes.length ? Math.max(...finishes) : null,
  };
}
