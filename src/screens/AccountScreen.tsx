import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Sheet from "../components/Sheet";
import { career, fetchGames, flushOutbox, type CloudGame } from "../state/sync";
import { useAuth } from "../state/auth";
import { colors, radius } from "../theme";

export default function AccountScreen({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const [games, setGames] = useState<CloudGame[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!auth.user) return;
    await flushOutbox(auth.user.id);
    const g = await fetchGames();
    setFailed(g === null);
    setGames(g ?? []);
  }, [auth.user]);

  useEffect(() => { load(); }, [load]);

  const c = games ? career(games) : null;
  const tiles: Array<[string, string]> = c ? [
    ["Spellen", String(c.games)],
    ["Gewonnen", c.games ? `${c.wins} (${Math.round((c.wins / c.games) * 100)}%)` : "0"],
    ["Gem. per beurt", c.average.toFixed(1)],
    ["Hoogste beurt", String(c.highest)],
    ["100+", String(c.over100)],
    ["140+", String(c.over140)],
    ["180", String(c.maximums)],
    ["Beste uitgooi", c.bestFinish ? String(c.bestFinish) : "–"],
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.back} onPress={onBack}>‹ Terug</Text>
        <Text style={styles.title}>{auth.username ?? "Account"}</Text>
        <Text style={styles.muted}>{auth.user?.email}</Text>

        <Text style={styles.label}>Mijn statistieken</Text>
        {games === null ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} /> : (
          <View style={styles.grid}>
            {tiles.map(([l, v]) => (
              <View key={l} style={styles.tile}><Text style={styles.tileValue}>{v}</Text><Text style={styles.tileLabel}>{l}</Text></View>
            ))}
          </View>
        )}
        {failed && <Text style={styles.warn}>Kon de online gegevens niet laden. Probeer het later opnieuw.</Text>}

        <Text style={styles.label}>Laatste spellen</Text>
        {games && games.length === 0 && !failed && <Text style={styles.muted}>Nog geen afgeronde spellen. Speel een spel uit en het verschijnt hier.</Text>}
        {games?.slice(0, 20).map((g) => (
          <View key={g.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{g.start_score}{g.double_out ? " · dubbel uit" : ""} · {g.my_won ? "Gewonnen" : "Verloren"}</Text>
              <Text style={styles.muted}>{new Date(g.played_at).toLocaleDateString("nl-NL")} · tegen {g.players.slice(1).join(", ") || "—"}</Text>
            </View>
            <Text style={styles.avg}>{g.my_turns ? (g.my_points / g.my_turns).toFixed(1) : "–"}</Text>
          </View>
        ))}

        <View style={{ gap: 10, marginTop: 28 }}>
          <Button label="Uitloggen" variant="ghost" onPress={async () => { await auth.signOut(); onBack(); }} />
          <Button label="Account verwijderen" variant="danger" onPress={() => setConfirmDelete(true)} />
        </View>
      </ScrollView>

      <Sheet visible={confirmDelete} title="Account verwijderen?" onClose={() => setConfirmDelete(false)}>
        <Text style={styles.sheetText}>Je account en al je online bewaarde spellen en statistieken worden definitief gewist. Dit kan niet ongedaan worden gemaakt.</Text>
        {!!error && <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text>}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button label="Annuleren" variant="ghost" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} />
          <Button label="Definitief wissen" variant="danger" style={{ flex: 1 }}
            onPress={async () => { const r = await auth.deleteAccount(); if (r.ok) onBack(); else setError(r.error); }} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center" },
  back: { color: colors.accent, fontSize: 16, marginBottom: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 24, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "48.5%", backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  tileValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  tileLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  avg: { color: colors.accent, fontSize: 18, fontWeight: "800" },
  warn: { color: colors.warn, fontSize: 13, marginTop: 8 },
  sheetText: { color: colors.text, fontSize: 16, lineHeight: 23, marginBottom: 18 },
});
