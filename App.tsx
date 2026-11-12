import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SetupScreen from "./src/screens/SetupScreen";
import GameScreen from "./src/screens/GameScreen";
import AuthScreen from "./src/screens/AuthScreen";
import AccountScreen from "./src/screens/AccountScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import CameraScreen from "./src/screens/CameraScreen";
import CalibrationScreen from "./src/screens/CalibrationScreen";
import AnalyzeScreen from "./src/screens/AnalyzeScreen";
import type { Calibration } from "./src/vision/calibration";
import type { Shots } from "./src/vision/types";
import { createGame, type GameConfig, type GameState } from "./src/engine/game";
import { loadCalibration, loadGame, loadGuest, saveCalibration, saveGame, saveGuest } from "./src/state/storage";
import { AuthProvider, useAuth } from "./src/state/auth";
import { enqueueFinished, flushOutbox, isFinished } from "./src/state/sync";
import { colors } from "./src/theme";

type Screen = "main" | "auth" | "account" | "camera" | "calibrate" | "analyze";

function Root() {
  const auth = useAuth();
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>("main");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [guest, setGuest] = useState(false);
  const [camStart, setCamStart] = useState<"intro" | "overview">("intro");
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [shots, setShots] = useState<Shots>({}); // camera photos: session memory only, never uploaded
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    Promise.all([loadGame(), loadGuest(), loadCalibration()]).then(([g, guestChoice, cal]) => { setSaved(g); setGuest(guestChoice); setCalibration(cal); setReady(true); });
  }, []);

  // When logged in: upload anything queued, and any finished game still waiting on this device.
  useEffect(() => {
    if (!userId || !ready) return;
    (async () => {
      if (saved && isFinished(saved)) await enqueueFinished(userId, saved);
      else await flushOutbox(userId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ready]);

  const update = useCallback((g: GameState | null) => {
    setGame(g);
    saveGame(g); // autosave after every change
    if (g) setSaved(g);
  }, []);

  /** A finished game is uploaded when the player leaves it (so undoing a win never reaches the cloud). */
  const leave = useCallback((g: GameState | null) => {
    if (g && userId && isFinished(g)) enqueueFinished(userId, g);
  }, [userId]);

  if (!ready || auth.loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  }

  if (game) {
    return (
      <GameScreen
        game={game}
        onChange={update}
        onRematch={() => { leave(game); update(createGame(game.config)); }}
        onExit={() => { leave(game); setGame(null); if (isFinished(game)) { setSaved(null); saveGame(null); } }}
      />
    );
  }
  if (screen === "auth") {
    return <AuthScreen initialMode={authMode} onDone={() => setScreen("main")} onBack={() => setScreen("main")} />;
  }
  if (screen === "calibrate" && shots.reference) {
    return (
      <CalibrationScreen
        reference={shots.reference}
        existing={calibration}
        onBack={() => { setCamStart("overview"); setScreen("camera"); }}
        onSave={(c) => { setCalibration(c); saveCalibration(c); setCamStart("overview"); setScreen("camera"); }}
      />
    );
  }
  if (screen === "analyze" && shots.reference && shots.after && calibration) {
    return <AnalyzeScreen shots={shots} calibration={calibration} onBack={() => { setCamStart("overview"); setScreen("camera"); }} />;
  }
  if (screen === "camera" || screen === "calibrate" || screen === "analyze") {
    return (
      <CameraScreen
        shots={shots}
        calibrated={!!calibration}
        initialStep={camStart}
        onCalibrate={() => setScreen("calibrate")}
        onAnalyze={() => setScreen("analyze")}
        onChange={setShots}
        onClose={() => { setCamStart("intro"); setScreen("main"); }}
      />
    );
  }
  if (screen === "account" && auth.user) return <AccountScreen onBack={() => setScreen("main")} />;

  // Visitors land here first: create an account, log in, or (offline-friendly) continue as guest.
  if (auth.configured && !auth.user && !guest) {
    return (
      <WelcomeScreen
        onSignup={() => { setAuthMode("signup"); setScreen("auth"); }}
        onLogin={() => { setAuthMode("login"); setScreen("auth"); }}
        onGuest={() => { setGuest(true); saveGuest(true); }}
      />
    );
  }

  return (
    <SetupScreen
      username={auth.username}
      accountsEnabled={auth.configured}
      onCamera={() => { setCamStart("intro"); setScreen("camera"); }}
      onAccount={() => { if (auth.user) setScreen("account"); else { setAuthMode("login"); setScreen("auth"); } }}
      hasSavedGame={!!saved && saved.turns.length > 0 && !isFinished(saved)}
      onStart={(cfg: GameConfig) => update(createGame(cfg))}
      onResume={() => saved && setGame(saved)}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider><Root /></AuthProvider>
    </SafeAreaProvider>
  );
}
