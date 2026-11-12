import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import ConfirmDouble from "../components/ConfirmDouble";
import HistorySheet from "../components/HistorySheet";
import Keypad from "../components/Keypad";
import PlayerCard from "../components/PlayerCard";
import Sheet from "../components/Sheet";
import StatsTable from "../components/StatsTable";
import { colors, radius } from "../theme";
import { addTurn, computeStats, evaluate, undoLastTurn, type GameState } from "../engine/game";
import { judgeTurn, needsDoubleQuestion } from "../engine/rules";
import { suggestCheckout } from "../engine/checkout";

interface Props {
  game: GameState;
  onChange: (g: GameState) => void;
  onRematch: () => void;
  onExit: () => void;
}

const QUICK = [26, 41, 45, 60, 85, 100, 140, 180];

export default function GameScreen({ game, onChange, onRematch, onExit }: Props) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");
  const [askDouble, setAskDouble] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [winnerDismissed, setWinnerDismissed] = useState(false);

  const { config } = game;
  const ev = useMemo(() => evaluate(game), [game]);
  const stats = useMemo(() => computeStats(game, ev), [game, ev]);
  const cp = ev.currentPlayer;
  const remaining = ev.remaining[cp];
  const over = ev.winner !== null;

  const score = entry === "" ? null : Number(entry);
  const preview = score === null ? null : judgeTurn(remaining, score, config.doubleOut, true);
  const asksDouble = score !== null && needsDoubleQuestion(remaining, score, config.doubleOut);
  const checkout = !over ? suggestCheckout(remaining, config.doubleOut) : null;

  function setEntryValue(next: string) {
    setError("");
    if (next.length > 3 || Number(next) > 180) return;
    setEntry(next.replace(/^0(?=\d)/, ""));
  }

  function commit(total: number, lastDartDouble: boolean) {
    const r = addTurn(game, { score: total, lastDartDouble });
    if (!r.ok) return setError(r.error);
    onChange(r.state);
    setEntry("");
    setError("");
    setWinnerDismissed(false);
  }

  function submit() {
    if (score === null || over) return;
    if (preview?.kind === "invalid") return setError(preview.reason ?? "Ongeldige score");
    if (asksDouble) return setAskDouble(score);
    commit(score, false);
  }

  const lastOf = (p: number) => {
    const r = [...ev.results].reverse().find((x) => x.playerIndex === p);
    return r ? { score: r.rawScore, bust: r.kind === "bust" } : undefined;
  };

  const status =
    score === null ? null
    : preview?.kind === "invalid" ? { text: preview.reason!, color: colors.danger }
    : asksDouble ? { text: "Uitgooien? Je wordt nog gevraagd naar de dubbel", color: colors.accent }
    : preview?.kind === "bust" ? { text: `Bust — ${preview.reason}`, color: colors.danger }
    : preview?.kind === "finish" ? { text: "Uitgegooid!", color: colors.accent }
    : { text: `Rest na beurt: ${preview?.after}`, color: colors.muted };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Text style={styles.title}>{config.startScore}{config.doubleOut ? " · dubbel uit" : ""}</Text>
          <Text style={styles.muted}>Beurt {Math.floor(game.turns.length / config.players.length) + 1}</Text>
        </View>
        <View style={styles.topBtns}>
          <Chip label="Geschiedenis" onPress={() => setShowHistory(true)} grow />
          <Chip label="Statistieken" onPress={() => setShowStats(true)} grow />
          <Chip label="Stoppen" onPress={() => setShowQuit(true)} grow />
        </View>

        <View style={styles.players}>
          {config.players.map((name, p) => (
            <PlayerCard
              key={p}
              name={name}
              remaining={ev.remaining[p]}
              active={!over && p === cp}
              isWinner={ev.winner === p}
              stats={stats[p]}
              lastTurn={lastOf(p)}
              compact={config.players.length > 2}
            />
          ))}
        </View>

        {!over && (
          <>
            <Text style={styles.turnOf}>{config.players[cp]} is aan de beurt</Text>
            {checkout && <Text style={styles.checkout}>Uitgooi-tip: {checkout.join("  ›  ")}</Text>}

            <View style={styles.entryBox}>
              <Text style={[styles.entry, entry === "" && { color: colors.border }]}>{entry === "" ? "0" : entry}</Text>
              <Text style={[styles.status, status && { color: status.color }, !!error && { color: colors.danger }]}>{error || status?.text || "Voer de score van de beurt in"}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {QUICK.map((q) => <Chip key={q} label={String(q)} onPress={() => setEntryValue(String(q))} />)}
            </ScrollView>

            <Keypad
              onDigit={(d) => setEntryValue(entry + d)}
              onBackspace={() => setEntryValue(entry.slice(0, -1))}
              onSubmit={submit}
              submitDisabled={score === null || preview?.kind === "invalid"}
            />

            <Button
              label="Laatste beurt ongedaan maken"
              variant="ghost"
              disabled={game.turns.length === 0}
              onPress={() => { onChange(undoLastTurn(game)); setEntry(""); setError(""); }}
              style={{ marginTop: 12 }}
            />
          </>
        )}

        {over && (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Button label="Uitslag bekijken" onPress={() => setWinnerDismissed(false)} />
            <Button label="Laatste beurt ongedaan maken" variant="ghost" onPress={() => onChange(undoLastTurn(game))} />
          </View>
        )}
      </ScrollView>

      <ConfirmDouble
        visible={askDouble !== null}
        remaining={remaining}
        onCancel={() => setAskDouble(null)}
        onAnswer={(d) => { const t = askDouble!; setAskDouble(null); commit(t, d); }}
      />
      <HistorySheet visible={showHistory} game={game} evaluation={ev} onClose={() => setShowHistory(false)} onChange={onChange} />
      <Sheet visible={showStats} title="Statistieken" onClose={() => setShowStats(false)}>
        <StatsTable stats={stats} />
      </Sheet>
      <Sheet visible={showQuit} title="Spel stoppen?" onClose={() => setShowQuit(false)}>
        <Text style={styles.sheetText}>Je spel wordt bewaard op dit toestel; je kunt later doorgaan.</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button label="Terug" variant="ghost" onPress={() => setShowQuit(false)} style={{ flex: 1 }} />
          <Button label="Naar menu" onPress={() => { setShowQuit(false); onExit(); }} style={{ flex: 1 }} />
        </View>
      </Sheet>
      <Sheet visible={over && !winnerDismissed} title={`🏆 ${ev.winner !== null ? config.players[ev.winner] : ""} wint!`} onClose={() => setWinnerDismissed(true)}>
        <StatsTable stats={stats} />
        <View style={{ gap: 10, marginTop: 18 }}>
          <Button label="Nog een keer (zelfde spelers)" onPress={onRematch} />
          <Button label="Nieuw spel" variant="ghost" onPress={onExit} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Chip({ label, onPress, grow }: { label: string; onPress: () => void; grow?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, grow && { flex: 1, marginRight: 0 }, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, paddingBottom: 32, maxWidth: 560, width: "100%", alignSelf: "center" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 13 },
  topBtns: { flexDirection: "row", gap: 8, marginBottom: 14 },
  players: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  turnOf: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 16 },
  checkout: { color: colors.warn, fontSize: 14, marginTop: 4, fontWeight: "600" },
  entryBox: { alignItems: "center", paddingVertical: 10 },
  entry: { color: colors.text, fontSize: 56, fontWeight: "800", fontVariant: ["tabular-nums"] },
  status: { fontSize: 14, minHeight: 20, textAlign: "center", color: colors.muted },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center", marginRight: 6, backgroundColor: colors.card,
  },
  chipText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  sheetText: { color: colors.text, fontSize: 16, lineHeight: 23, marginBottom: 18 },
});
