import { useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import Button from "../components/Button";
import { colors, radius } from "../theme";
import { compareSetup, type Capture, type Shots } from "../vision/types";

type Target = "reference" | "after";
type Step =
  | { kind: "intro" }
  | { kind: "live"; target: Target }
  | { kind: "review"; target: Target; photo: Capture }
  | { kind: "overview" };

interface Props {
  shots: Shots;
  calibrated: boolean;
  initialStep?: "intro" | "overview";
  onCalibrate: () => void;
  onAnalyze: () => void;
  onChange: (s: Shots) => void;
  onClose: () => void;
}

const TIPS: Array<[string, string]> = [
  ["1", "Zet de telefoon vast: tegen een stapel boeken, in een statief of in een houder. Hij mag niet meer bewegen."],
  ["2", "Zet hem recht voor het bord, op de hoogte van de roos (Bull), op ongeveer 1,5 tot 2,5 meter afstand."],
  ["3", "Het hele bord moet in beeld zijn, inclusief de buitenste rand met de cijfers. Gebruik de cirkel op het scherm als hulp."],
  ["4", "Zorg voor gelijkmatig licht zonder schaduw van jezelf of glans op het bord. Loop niet door het beeld bij het fotograferen."],
  ["5", "Maak eerst een foto van het lege bord (referentie). Gooi daarna je darts en maak een nieuwe foto vanaf dezelfde plek."],
];

export default function CameraScreen({ shots, calibrated, initialStep = "intro", onCalibrate, onAnalyze, onChange, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>({ kind: initialStep });
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const camera = useRef<CameraView>(null);

  async function shoot(target: Target) {
    if (!camera.current || busy) return;
    setBusy(true); setError("");
    try {
      const p = await camera.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!p?.uri) throw new Error("no photo");
      setStep({ kind: "review", target, photo: { uri: p.uri, width: p.width, height: p.height, takenAt: Date.now() } });
    } catch {
      setError("De foto kon niet worden gemaakt. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  const startLive = (target: Target) => { setReady(false); setError(""); setStep({ kind: "live", target }); };

  // --- permission gate -------------------------------------------------------
  const needsCamera = step.kind === "live";
  if (needsCamera && !permission) return <Blank />;
  if (needsCamera && !permission!.granted) {
    return (
      <Screen onBack={() => setStep({ kind: "intro" })} title="Toegang tot de camera">
        <Text style={styles.text}>
          Dartscore heeft je camera nodig om het dartbord te bekijken. De beelden worden op je toestel verwerkt en niet verstuurd.
        </Text>
        {permission!.canAskAgain ? (
          <Button label="Camera toestaan" onPress={requestPermission} />
        ) : (
          <Text style={styles.warn}>
            Toegang is geweigerd. Zet de camera aan voor Dartscore in de instellingen van je telefoon of browser en probeer het opnieuw.
          </Text>
        )}
      </Screen>
    );
  }

  // --- intro -----------------------------------------------------------------
  if (step.kind === "intro") {
    return (
      <Screen onBack={onClose} title="Camera instellen">
        <Text style={styles.text}>Zo zet je de camera goed neer:</Text>
        {TIPS.map(([n, t]) => (
          <View key={n} style={styles.tip}>
            <Text style={styles.tipNo}>{n}</Text>
            <Text style={styles.tipText}>{t}</Text>
          </View>
        ))}
        <Text style={styles.privacy}>🔒 Foto’s blijven op je toestel en worden niet geüpload.</Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          <Button label={shots.reference ? "Nieuwe referentiefoto maken" : "Start: foto van het lege bord"} onPress={() => startLive("reference")} />
          {shots.reference && <Button label="Foto na worp maken" variant="ghost" onPress={() => startLive("after")} />}
          {(shots.reference || shots.after) && <Button label="Bekijk foto’s" variant="ghost" onPress={() => setStep({ kind: "overview" })} />}
        </View>
      </Screen>
    );
  }

  // --- live camera -----------------------------------------------------------
  if (step.kind === "live") {
    const t = step.target;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.liveTop}>
          <Pressable onPress={() => setStep({ kind: "intro" })} hitSlop={12}><Text style={styles.back}>‹ Terug</Text></Pressable>
          <Text style={styles.liveTitle}>{t === "reference" ? "Foto van het lege bord" : "Foto na de worp"}</Text>
          <Pressable onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))} hitSlop={12} accessibilityLabel="Camera wisselen">
            <Text style={styles.back}>⟲</Text>
          </Pressable>
        </View>

        <View style={styles.previewWrap}>
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} mode="picture" onCameraReady={() => setReady(true)} />
          <View pointerEvents="none" style={styles.guideWrap}>
            <View style={styles.guide} />
            <View style={styles.crossH} />
            <View style={styles.crossV} />
          </View>
        </View>

        <Text style={styles.hint}>
          {t === "reference"
            ? "Zorg dat het bord leeg is en past in de cirkel. Houd de telefoon stil."
            : "Zelfde plek, zelfde stand. Laat de darts in het bord zitten."}
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.shutterRow}>
          <Pressable
            onPress={() => shoot(t)}
            disabled={!ready || busy}
            accessibilityRole="button"
            accessibilityLabel="Foto maken"
            style={({ pressed }) => [styles.shutter, (!ready || busy) && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --- review ----------------------------------------------------------------
  if (step.kind === "review") {
    const { target, photo } = step;
    return (
      <Screen onBack={() => startLive(target)} title={target === "reference" ? "Referentiefoto" : "Foto na worp"}>
        <Image source={{ uri: photo.uri }} style={styles.reviewImg} resizeMode="contain" accessibilityLabel="Gemaakte foto" />
        <Text style={styles.muted}>{photo.width} × {photo.height} px</Text>
        <Text style={styles.text}>Is het hele bord goed te zien en scherp?</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button label="Opnieuw" variant="ghost" onPress={() => startLive(target)} style={{ flex: 1 }} />
          <Button label="Gebruik foto" onPress={() => { onChange({ ...shots, [target]: photo }); setStep({ kind: "overview" }); }} style={{ flex: 1 }} />
        </View>
      </Screen>
    );
  }

  // --- overview --------------------------------------------------------------
  const warnings = shots.reference && shots.after ? compareSetup(shots.reference, shots.after) : [];
  return (
    <Screen onBack={() => setStep({ kind: "intro" })} title="Foto’s">
      <View style={styles.pair}>
        <Thumb label="Leeg bord" photo={shots.reference} />
        <Thumb label="Na de worp" photo={shots.after} />
      </View>
      {warnings.map((w) => <Text key={w} style={styles.warn}>⚠️ {w}</Text>)}
      {shots.reference && shots.after && warnings.length === 0 && (
        <Text style={styles.ok}>✓ Beide foto’s zijn gemaakt. In de volgende fase herkent de app hieruit de darts.</Text>
      )}
      <View style={{ gap: 10, marginTop: 16 }}>
        {!shots.reference && <Button label="Foto van het lege bord maken" onPress={() => startLive("reference")} />}
        {shots.reference && <Button label={shots.after ? "Nieuwe foto na worp" : "Foto na worp maken"} onPress={() => startLive("after")} />}
        {shots.reference && <Button label="Referentie opnieuw maken" variant="ghost" onPress={() => startLive("reference")} />}
        {shots.reference && <Button label={calibrated ? "Bord opnieuw kalibreren" : "Bord kalibreren (stap 3)"} variant={calibrated ? "ghost" : "primary"} onPress={onCalibrate} />}
        {shots.reference && shots.after && calibrated && <Button label="Darts herkennen" onPress={onAnalyze} />}
        {shots.reference && shots.after && !calibrated && <Text style={styles.muted}>Kalibreer eerst het bord om de darts te herkennen.</Text>}
        <Button label="Foto’s wissen" variant="danger" onPress={() => { onChange({}); setStep({ kind: "intro" }); }} />
        <Button label="Klaar" variant="ghost" onPress={onClose} />
      </View>
    </Screen>
  );
}

function Thumb({ label, photo }: { label: string; photo?: Capture }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.thumbLabel}>{label}</Text>
      <View style={styles.thumb}>
        {photo ? <Image source={{ uri: photo.uri }} style={{ flex: 1 }} resizeMode="cover" /> : <Text style={styles.muted}>Nog niet gemaakt</Text>}
      </View>
    </View>
  );
}

function Screen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={onBack} hitSlop={10}><Text style={styles.back}>‹ Terug</Text></Pressable>
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const Blank = () => <View style={{ flex: 1, backgroundColor: colors.bg }} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center" },
  back: { color: colors.accent, fontSize: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginVertical: 14 },
  text: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 14 },
  muted: { color: colors.muted, fontSize: 13, textAlign: "center", marginVertical: 6 },
  tip: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  tipNo: { color: colors.accentText, backgroundColor: colors.accent, width: 24, height: 24, borderRadius: 12, textAlign: "center", fontWeight: "800", lineHeight: 24, overflow: "hidden" },
  tipText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 },
  privacy: { color: colors.muted, fontSize: 13, marginTop: 8 },
  warn: { color: colors.warn, fontSize: 14, lineHeight: 20, marginTop: 10 },
  ok: { color: colors.accent, fontSize: 14, lineHeight: 20, marginTop: 10 },
  error: { color: colors.danger, textAlign: "center", marginBottom: 6 },
  liveTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 },
  liveTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  previewWrap: { flex: 1, marginHorizontal: 12, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000", maxHeight: 640, alignSelf: "stretch" },
  guideWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  guide: { width: "86%", aspectRatio: 1, borderRadius: 999, borderWidth: 2, borderColor: colors.accent, opacity: 0.9 },
  crossH: { position: "absolute", width: 28, height: 2, backgroundColor: colors.accent },
  crossV: { position: "absolute", width: 2, height: 28, backgroundColor: colors.accent },
  hint: { color: colors.muted, textAlign: "center", fontSize: 13, paddingHorizontal: 24, marginTop: 10 },
  shutterRow: { alignItems: "center", paddingVertical: 14 },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.text, alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.text },
  reviewImg: { width: "100%", aspectRatio: 3 / 4, backgroundColor: "#000", borderRadius: radius.md },
  pair: { flexDirection: "row", gap: 12 },
  thumbLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  thumb: { aspectRatio: 3 / 4, backgroundColor: colors.card, borderRadius: radius.md, overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
