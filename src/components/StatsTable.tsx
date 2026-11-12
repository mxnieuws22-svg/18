import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { PlayerStats } from "../engine/game";

const COLS: Array<[string, (s: PlayerStats) => string]> = [
  ["Gem. per beurt", (s) => s.average.toFixed(1)],
  ["Beurten", (s) => String(s.turns)],
  ["Hoogste beurt", (s) => String(s.highest)],
  ["100+", (s) => String(s.over100)],
  ["140+", (s) => String(s.over140)],
  ["180", (s) => String(s.maximums)],
  ["Busts", (s) => String(s.busts)],
];

export default function StatsTable({ stats }: { stats: PlayerStats[] }) {
  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.label, styles.head]} />
        {stats.map((s, i) => <Text key={i} style={[styles.cell, styles.head]} numberOfLines={1}>{s.name}</Text>)}
      </View>
      {COLS.map(([label, fn]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          {stats.map((s, i) => <Text key={i} style={styles.cell}>{fn(s)}</Text>)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.muted, flex: 1.6, fontSize: 14 },
  cell: { color: colors.text, flex: 1, textAlign: "center", fontSize: 15, fontWeight: "600" },
  head: { color: colors.accent, fontWeight: "800" },
});
