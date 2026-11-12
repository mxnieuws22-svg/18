import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import { colors } from "../theme";

interface Props {
  onLogin: () => void;
  onSignup: () => void;
  onGuest: () => void;
}

export default function WelcomeScreen({ onLogin, onSignup, onGuest }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Dartscore</Text>
          <Text style={styles.sub}>Houd je scores bij, bewaar je spellen en volg je gemiddelde.</Text>
        </View>
        <View style={{ gap: 12 }}>
          <Button label="Account maken" onPress={onSignup} />
          <Button label="Inloggen" variant="ghost" onPress={onLogin} />
          <Pressable onPress={onGuest} style={{ paddingVertical: 14 }} accessibilityRole="button">
            <Text style={styles.guest}>Doorgaan zonder account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: "space-between", maxWidth: 520, width: "100%", alignSelf: "center" },
  hero: { flex: 1, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 72 },
  title: { color: colors.text, fontSize: 40, fontWeight: "800", marginTop: 8 },
  sub: { color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: "center", marginTop: 12, maxWidth: 320 },
  guest: { color: colors.muted, fontSize: 15, textAlign: "center", textDecorationLine: "underline" },
});
