import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Button from "./Button";
import Sheet from "./Sheet";
import { colors, radius } from "../theme";
import { editTurn, type Evaluation, type GameState } from "../engine/game";

interface Props {
  visible: boolean;
  game: GameState;
  evaluation: Evaluation;
  onClose: () => void;
  onChange: (next: GameState) => void;
}

export default function HistorySheet({ visible, game, evaluation, onClose, onChange }: Props) {
  const [editing, setEditing] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [dbl, setDbl] = useState(false);
  const [error, setError] = useState("");

  const rows = [...evaluation.results].reverse();

  function startEdit(i: number) {
    setEditing(i);
    setValue(String(game.turns[i].score));
    setDbl(game.turns[i].lastDartDouble);
    setError("");
  }

  function save() {
    if (editing === null) return;
    const score = Number(value);
    if (value.trim() === "" || !Number.isInteger(score)) return setError("Vul een geheel getal in.");
    const r = editTurn(game, editing, { score, lastDartDouble: dbl });
    if (!r.ok) return setError(r.error);
    onChange(r.state);
    setEditing(null);
  }

  return (
    <Sheet visible={visible} title={editing === null ? "Geschiedenis" : `Beurt ${editing + 1} corrigeren`} onClose={() => { setEditing(null); onClose(); }}>
      {editing === null ? (
        rows.length === 0 ? (
          <Text style={styles.muted}>Er zijn nog geen beurten gespeeld.</Text>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => String(r.turnIndex)}
            renderItem={({ item: r }) => (
              <Pressable style={styles.row} onPress={() => startEdit(r.turnIndex)} accessibilityHint="Tik om te corrigeren">
                <Text style={styles.no}>{r.turnIndex + 1}</Text>
                <Text style={styles.name} numberOfLines={1}>{game.config.players[r.playerIndex]}</Text>
                <Text style={[styles.score, r.kind === "bust" && { color: colors.danger }]}>
                  {r.kind === "bust" ? `Bust (${r.rawScore})` : r.rawScore}
                </Text>
                <Text style={styles.left}>{r.kind === "finish" ? "🏆" : r.remainingAfter}</Text>
              </Pressable>
            )}
            ListFooterComponent={<Text style={styles.hint}>Tik op een beurt om de score te corrigeren.</Text>}
          />
        )
      ) : (
        <View>
          <Text style={styles.muted}>{game.config.players[editing % game.config.players.length]} — nieuwe score voor deze beurt:</Text>
          <TextInput
            value={value}
            onChangeText={(t) => setValue(t.replace(/[^0-9]/g, "").slice(0, 3))}
            keyboardType="number-pad"
            style={styles.input}
            autoFocus
            accessibilityLabel="Nieuwe score"
          />
          {game.config.doubleOut && (
            <View style={styles.switchRow}>
              <Text style={styles.name}>Laatste dart was een dubbel</Text>
              <Switch value={dbl} onValueChange={setDbl} trackColor={{ true: colors.accent }} />
            </View>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <Button label="Annuleren" variant="ghost" onPress={() => setEditing(null)} style={{ flex: 1 }} />
            <Button label="Opslaan" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  no: { color: colors.muted, width: 32, fontSize: 14 },
  name: { color: colors.text, flex: 1, fontSize: 16 },
  score: { color: colors.text, fontSize: 16, fontWeight: "700", marginRight: 16 },
  left: { color: colors.muted, width: 52, textAlign: "right", fontSize: 15 },
  muted: { color: colors.muted, fontSize: 15, marginBottom: 12 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 12, textAlign: "center" },
  input: {
    backgroundColor: "#1C2430", color: colors.text, fontSize: 32, fontWeight: "800", textAlign: "center",
    borderRadius: radius.md, paddingVertical: 12, borderWidth: 1, borderColor: colors.border,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  error: { color: colors.danger, marginTop: 10, fontSize: 14 },
});
