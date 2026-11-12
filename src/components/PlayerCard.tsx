import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import type { PlayerStats } from "../engine/game";

interface Props {
  name: string;
  remaining: number;
  active: boolean;
  isWinner: boolean;
  stats: PlayerStats;
  lastTurn?: { score: number; bust: boolean };
  compact: boolean;
}

export default function PlayerCard({ name, remaining, active, isWinner, stats, lastTurn, compact }: Props) {
  return (
    <View style={[styles.card, active && styles.active, compact && styles.compact]}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>{isWinner ? "🏆 " : active ? "▶ " : ""}{name}</Text>
        <Text style={styles.sub}>Gem. {stats.average.toFixed(1)}</Text>
      </View>
      <Text style={[styles.remaining, compact && { fontSize: 44 }]}>{remaining}</Text>
      <Text style={[styles.sub, lastTurn?.bust && { color: colors.danger }]}>
        {lastTurn ? (lastTurn.bust ? `Bust (${lastTurn.score})` : `Laatste: ${lastTurn.score}`) : "Nog niet gegooid"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, minWidth: "46%", backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 14, borderWidth: 2, borderColor: "transparent",
  },
  compact: { padding: 10 },
  active: { borderColor: colors.accent, backgroundColor: colors.cardActive },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: colors.text, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  remaining: { color: colors.text, fontSize: 60, fontWeight: "800", marginVertical: 2, fontVariant: ["tabular-nums"] },
  sub: { color: colors.muted, fontSize: 13 },
});
