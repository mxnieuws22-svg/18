import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Field from "../components/Field";
import { useAuth, type AuthResult } from "../state/auth";
import { colors } from "../theme";

type Mode = "login" | "signup" | "verify" | "forgot" | "reset";

export default function AuthScreen({ initialMode = "login", onDone, onBack }: { initialMode?: "login" | "signup"; onDone: () => void; onBack: () => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function run(fn: () => Promise<AuthResult & { needsCode?: boolean }>, next?: (r: any) => void) {
    setBusy(true); setError(""); setInfo("");
    const r = await fn();
    setBusy(false);
    if (!r.ok) return setError(r.error);
    next?.(r);
  }

  const go = (m: Mode) => { setMode(m); setError(""); setInfo(""); setCode(""); };

  const titles: Record<Mode, string> = {
    login: "Inloggen", signup: "Account maken", verify: "Bevestig je e-mail",
    forgot: "Wachtwoord vergeten", reset: "Nieuw wachtwoord",
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} hitSlop={10}><Text style={styles.back}>‹ Terug</Text></Pressable>
          <Text style={styles.title}>{titles[mode]}</Text>

          {mode === "login" && (
            <>
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
              <Field label="Wachtwoord" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
              <Button label={busy ? "Bezig…" : "Inloggen"} disabled={busy || !email || !password}
                onPress={() => run(() => auth.signIn(email, password), onDone)} />
              <Link label="Wachtwoord vergeten?" onPress={() => go("forgot")} />
              <Link label="Nog geen account? Maak er een" onPress={() => go("signup")} />
            </>
          )}

          {mode === "signup" && (
            <>
              <Field label="Gebruikersnaam" value={username} onChangeText={setUsername} maxLength={16} />
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
              <Field label="Wachtwoord (min. 8 tekens)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
              <Button label={busy ? "Bezig…" : "Account maken"} disabled={busy || !email || !password || !username}
                onPress={() => run(() => auth.signUp(email, password, username), (r) => (r.needsCode ? go("verify") : onDone()))} />
              <Link label="Al een account? Inloggen" onPress={() => go("login")} />
            </>
          )}

          {mode === "verify" && (
            <>
              <Text style={styles.text}>We hebben een code gestuurd naar {email}. Vul die hieronder in.</Text>
              <Field label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 8))} keyboardType="number-pad" />
              <Button label={busy ? "Bezig…" : "Bevestigen"} disabled={busy || code.length < 6}
                onPress={() => run(() => auth.verifySignup(email, code), onDone)} />
              <Link label="Terug" onPress={() => go("signup")} />
            </>
          )}

          {mode === "forgot" && (
            <>
              <Text style={styles.text}>Vul je e-mailadres in. Je krijgt een code om een nieuw wachtwoord te kiezen.</Text>
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
              <Button label={busy ? "Bezig…" : "Code versturen"} disabled={busy || !email}
                onPress={() => run(() => auth.sendResetCode(email), () => go("reset"))} />
              <Link label="Terug naar inloggen" onPress={() => go("login")} />
            </>
          )}

          {mode === "reset" && (
            <>
              <Text style={styles.text}>Vul de code uit je e-mail in en kies een nieuw wachtwoord.</Text>
              <Field label="Code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 8))} keyboardType="number-pad" />
              <Field label="Nieuw wachtwoord (min. 8 tekens)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
              <Button label={busy ? "Bezig…" : "Opslaan"} disabled={busy || code.length < 6 || !password}
                onPress={() => run(() => auth.resetPassword(email, code, password), onDone)} />
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!info && <Text style={styles.text}>{info}</Text>}
          <View style={{ height: 24 }} />
          <Text style={styles.note}>Je kunt ook zonder account spelen. Met een account bewaar je je spellen en statistieken online.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 12 }}><Text style={styles.link}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40, maxWidth: 520, width: "100%", alignSelf: "center" },
  back: { color: colors.accent, fontSize: 16, marginBottom: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", marginBottom: 22 },
  text: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  link: { color: colors.accent, fontSize: 15, textAlign: "center" },
  error: { color: colors.danger, fontSize: 14, marginTop: 12, textAlign: "center" },
  note: { color: colors.muted, fontSize: 12, textAlign: "center", lineHeight: 18 },
});
