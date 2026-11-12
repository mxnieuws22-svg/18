import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import BoardOverlay from "../components/BoardOverlay";
import { colors, radius } from "../theme";
import { createMapping, type Calibration } from "../vision/calibration";
import { detectDarts, type DetectionResult } from "../vision/detect";
import { loadRgba } from "../vision/loader";
import type { Shots } from "../vision/types";
import type { Pt } from "../vision/homography";

interface Props {
  shots: Shots;
  calibration: Calibration;
  onBack: () => void;
}

interface Done { result: DetectionResult; width: number; height: number; ms: number }

export default function AnalyzeScreen({ shots, calibration, onBack }: Props) {
  const [state, setState] = useState<{ kind: "busy" } | { kind: "error"; msg: string } | ({ kind: "done" } & Done)>({ kind: "busy" });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const run = useCallback(async () => {
    setState({ kind: "busy" });
    await new Promise((r) => setTimeout(r, 30));
    try {
      const t0 = Date.now();
      const [ref, after] = await Promise.all([loadRgba(shots.reference!.uri), loadRgba(shots.after!.uri)]);
      const map = createMapping(calibration, ref.width, ref.height);
      if (!map) return setState({ kind: "error", msg: "De kalibratie is ongeldig. Kalibreer het bord opnieuw." });
      const result = detectDarts(ref, after, map);
      setState({ kind: "done", result, width: ref.width, height: ref.height, ms: Date.now() - t0 });
    } catch {
      setState({ kind: "error", msg: "De foto’s konden niet worden verwerkt. Maak ze opnieuw." });
    }
  }, [shots, calibration]);

  useEffect(() => { run(); }, [run]);

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const done = state.kind === "done" ? state : null;
  const overlayMap = useMemo(() => (size.w ? createMapping(calibration, size.w, size.h) : null), [calibration, size]);
  const markers = useMemo(() => {
    if (!done || !size.w) return [];
    return done.result.darts.map((d, i) => ({
      at: [(d.tip[0] / done.width) * size.w, (d.tip[1] / done.height) * size.h] as Pt,
      label: `${i + 1}: ${d.score.label}`,
      color: d.confidence >= 0.5 ? colors.danger : colors.warn,
    }));
  }, [done, size]);

  const total = done?.result.darts.reduce((s, d) => s + d.score.value, 0) ?? 0;
  const aspect = shots.after ? shots.after.width / shots.after.height : 0.75;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.back} onPress={onBack}>‹ Terug</Text>
        <Text style={styles.title}>Herkende darts</Text>

        <View style={[styles.photo, { aspectRatio: aspect }]} onLayout={onLayout}>
          <Image source={{ uri: shots.after!.uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
          {size.w > 0 && <BoardOverlay width={size.w} height={size.h} mapping={overlayMap} markers={markers} />}
          {state.kind === "busy" && <View style={styles.busy}><ActivityIndicator color={colors.accent} size="large" /><Text style={styles.busyText}>Foto’s vergelijken…</Text></View>}
        </View>

        {state.kind === "error" && <Text style={styles.error}>{state.msg}</Text>}

        {done && (
          <>
            <View style={styles.list}>
              {done.result.darts.length === 0 && <Text style={styles.muted}>Geen darts gevonden.</Text>}
              {done.result.darts.map((d, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowLabel}>Dart {i + 1}</Text>
                  <Text style={styles.rowScore}>{d.score.label}</Text>
                  <Text style={styles.rowValue}>{d.score.value}</Text>
                  <Text style={[styles.rowConf, d.confidence < 0.5 && { color: colors.warn }]}>{d.confidence < 0.5 ? "onzeker" : "zeker"}</Text>
                </View>
              ))}
              {done.result.darts.length > 0 && (
                <View style={styles.row}><Text style={styles.rowLabel}>Totaal</Text><Text style={styles.rowScore} /><Text style={[styles.rowValue, { color: colors.accent }]}>{total}</Text><Text style={styles.rowConf} /></View>
              )}
            </View>
            {done.result.warnings.map((w) => <Text key={w} style={styles.warn}>⚠️ {w}</Text>)}
            <Text style={styles.muted}>Verwerkt op je toestel in {(done.ms / 1000).toFixed(1)} s. In de volgende fase kun je dit bevestigen of aanpassen en toepassen op het spel.</Text>
          </>
        )}

        <View style={{ gap: 10, marginTop: 16 }}>
          <Button label="Opnieuw analyseren" variant="ghost" onPress={run} disabled={state.kind === "busy"} />
          <Button label="Klaar" onPress={onBack} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40, maxWidth: 560, width: "100%", alignSelf: "center" },
  back: { color: colors.accent, fontSize: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginVertical: 14 },
  photo: { width: "100%", backgroundColor: "#000", borderRadius: radius.md, overflow: "hidden" },
  busy: { ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const), backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 10 },
  busyText: { color: colors.text, fontSize: 15 },
  list: { marginTop: 14, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.muted, flex: 1.2, fontSize: 14 },
  rowScore: { color: colors.text, flex: 1, fontSize: 20, fontWeight: "800" },
  rowValue: { color: colors.text, flex: 0.8, fontSize: 18, fontWeight: "700", textAlign: "right" },
  rowConf: { color: colors.muted, flex: 1, fontSize: 12, textAlign: "right" },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 },
  warn: { color: colors.warn, fontSize: 14, lineHeight: 20, marginTop: 10 },
  error: { color: colors.danger, fontSize: 14, marginTop: 12 },
});
