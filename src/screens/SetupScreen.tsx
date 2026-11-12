import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import { colors, radius } from "../theme";
import { MAX_PLAYERS, type GameConfig } from "../engine/game";
import type { StartScore } from "../engine/rules";
import { loadSetup, saveSetup } from "../state/storage";

interface Props {
  username: string | null;
  accountsEnabled: boolean;
  onAccount: () => void;
  hasSavedGame: boolean;
  onStart: (cfg: GameConfig) => void;
  onResume: () => void;
}

export default function SetupScreen({ username, accountsEnabled, onAccount, hasSavedGame, onStart, onResume }: Props) {
  const [startScore, setStartScore] = useState<StartScore>(501);
  const [doubleOut, setDoubleOut] = useState(true);
  const [names, setNames] = useState<string[]>(["", ""]);

  useEffect(() => {
    loadSetup().then((cfg) => {
      if (!cfg) return;
      setStartScore(cfg.startScore);
      setDoubleOut(cfg.doubleOut);
      setNames(cfg.players.map((n) => n));
    });
  }, []);

  const count = names.length;
  const setCount = (n: number) =>
    setNames((cur) => Array.from({ length: n }, (_, i) => cur[i] ?? ""));

  function start() {
    const players = names.map((n, i) => n.trim().slice(0, 16) || (i === 0 && username ? username : `Speler ${i + 1}`));
    const cfg: GameConfig = { startScore, doubleOut, players };
    saveSetup({ ...cfg, players: names });
    onStart(cfg);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.rowBetween}>
            <Text style={styles.logo}>🎯 Dartscore</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 4, marginBottom: 14 }]}>
            <Text style={[styles.sub, { marginBottom: 0 }]}>Nieuw spel</Text>
            {accountsEnabled && (
              <Pressable onPress={onAccount} accessibilityRole="button" style={styles.account}>
                <Text style={styles.accountText}>{username ? `👤 ${username}` : "Inloggen"}</Text>
              </Pressable>
            )}
          </View>

          {hasSavedGame && (
            <Button label="Doorgaan met vorig spel" variant="ghost" onPress={onResume} style={{ marginBottom: 20 }} />
          )}

          <Text style={styles.label}>Spel</Text>
          <View style={styles.segment}>
            {([301, 501] as StartScore[]).map((s) => (
              <Pressable key={s} onPress={() => setStartScore(s)} style={[styles.seg, startScore === s && styles.segOn]} accessibilityRole="button">
                <Text style={[styles.segText, startScore === s && { color: colors.accentText }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.rowBetween, { marginTop: 22 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Dubbel uit</Text>
              <Text style={styles.muted}>Je moet eindigen met een dubbel of de Bull</Text>
            </View>
            <Switch value={doubleOut} onValueChange={setDoubleOut} trackColor={{ true: colors.accent }} />
          </View>

          <Text style={styles.label}>Aantal spelers</Text>
          <View style={styles.segment}>
            {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map((n) => (
              <Pressable key={n} onPress={() => setCount(n)} style={[styles.seg, count === n && styles.segOn]} accessibilityRole="button">
                <Text style={[styles.segText, count === n && { color: colors.accentText }]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Namen</Text>
          {names.map((n, i) => (
            <TextInput
              key={i}
              value={n}
              onChangeText={(t) => setNames((cur) => cur.map((x, j) => (j === i ? t : x)))}
              placeholder={i === 0 && username ? username : `Speler ${i + 1}`}
              placeholderTextColor={colors.muted}
              maxLength={16}
              style={styles.input}
              accessibilityLabel={`Naam speler ${i + 1}`}
            />
          ))}

          {username && <Text style={styles.muted}>Speler 1 telt mee voor jouw statistieken.</Text>}
          <Button label={`Start ${startScore}`} onPress={start} style={{ marginTop: 22 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40, maxWidth: 520, width: "100%", alignSelf: "center" },
  logo: { color: colors.text, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 16, marginTop: 4, marginBottom: 22 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 22, marginBottom: 8 },
  segment: { flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.md, padding: 4, gap: 4 },
  seg: { flex: 1, height: 46, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.text, fontSize: 18, fontWeight: "800" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  account: { paddingHorizontal: 14, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent, justifyContent: "center" },
  accountText: { color: colors.accent, fontWeight: "700", fontSize: 14 },
  optTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  input: {
    backgroundColor: colors.card, color: colors.text, fontSize: 17, borderRadius: radius.md,
    paddingHorizontal: 16, height: 50, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
});
