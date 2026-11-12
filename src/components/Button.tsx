import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({ label, onPress, variant = "primary", disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "danger" && styles.danger,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Text style={[styles.text, variant === "primary" && { color: colors.accentText }, variant === "danger" && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 18, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.accent },
  ghost: { borderWidth: 1, borderColor: colors.border },
  danger: { borderWidth: 1, borderColor: colors.danger },
  text: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
