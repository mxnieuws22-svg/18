import AsyncStorage from "@react-native-async-storage/async-storage";
import { newId, type GameState, type GameConfig } from "../engine/game";

// Everything stays on the device; the app works fully offline.
const GAME_KEY = "darts.game.v1";
const SETUP_KEY = "darts.setup.v1";

export async function saveGame(game: GameState | null): Promise<void> {
  try {
    if (game) await AsyncStorage.setItem(GAME_KEY, JSON.stringify(game));
    else await AsyncStorage.removeItem(GAME_KEY);
  } catch { /* storage failure must never break play */ }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    if (!(g?.config?.players?.length && Array.isArray(g.turns))) return null;
    // games saved by older versions have no id yet
    return { ...g, id: g.id ?? newId(), startedAt: g.startedAt ?? new Date().toISOString() };
  } catch { return null; }
}

export async function saveSetup(cfg: GameConfig): Promise<void> {
  try { await AsyncStorage.setItem(SETUP_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

export async function loadSetup(): Promise<GameConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(SETUP_KEY);
    return raw ? (JSON.parse(raw) as GameConfig) : null;
  } catch { return null; }
}
