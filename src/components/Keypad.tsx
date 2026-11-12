import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

interface Props {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function Keypad({ onDigit, onBackspace, onSubmit, submitDisabled, submitLabel = "OK" }: Props) {
  return (
    <View style={styles.grid}>
      {KEYS.map((k) => <Key key={k} label={k} onPress={() => onDigit(k)} />)}
      <Key label="⌫" onPress={onBackspace} muted />
      <Key label="0" onPress={() => onDigit("0")} />
      <Key label={submitLabel} onPress={onSubmit} primary disabled={submitDisabled} />
    </View>
  );
}

function Key({ label, onPress, primary, muted, disabled }: {
  label: string; onPress: () => void; primary?: boolean; muted?: boolean; disabled?: boolean;
}) {
  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.key,
          primary && { backgroundColor: colors.accent },
          muted && { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
          disabled && { opacity: 0.35 },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.keyText, primary && { color: colors.accentText }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  cell: { width: "33.333%", padding: 4 },
  key: {
    height: 54, borderRadius: radius.md, backgroundColor: "#1C2430",
    alignItems: "center", justifyContent: "center",
  },
  keyText: { color: colors.text, fontSize: 24, fontWeight: "700" },
});
