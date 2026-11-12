import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SetupScreen from "./src/screens/SetupScreen";
import GameScreen from "./src/screens/GameScreen";
import { createGame, type GameConfig, type GameState } from "./src/engine/game";
import { loadGame, saveGame } from "./src/state/storage";
import { colors } from "./src/theme";

export default function App() {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    loadGame().then((g) => { setSaved(g); setReady(true); });
  }, []);

  const update = useCallback((g: GameState | null) => {
    setGame(g);
    saveGame(g);          // autosave after every change: a crash never loses a game
    if (g) setSaved(g);
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {game ? (
        <GameScreen
          game={game}
          onChange={update}
          onRematch={() => update(createGame(game.config))}
          onExit={() => { setGame(null); }}
        />
      ) : (
        <SetupScreen
          hasSavedGame={!!saved && saved.turns.length > 0}
          onStart={(cfg: GameConfig) => update(createGame(cfg))}
          onResume={() => saved && setGame(saved)}
        />
      )}
    </SafeAreaProvider>
  );
}
