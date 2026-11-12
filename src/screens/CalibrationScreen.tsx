import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import BoardOverlay from "../components/BoardOverlay";
import { colors, radius } from "../theme";
import { CALIBRATION_LABELS } from "../vision/geometry";
import { createMapping, pointsFromCircle, type Calibration } from "../vision/calibration";
import { findBoard } from "../vision/boardFinder";
import { loadRgba } from "../vision/loader";
import { refineCalibration } from "../vision/refine";
import type { RgbaImage } from "../vision/image";
import type { Capture } from "../vision/types";
import type { Pt } from "../vision/homography";

interface Props {
  reference: Capture;
  existing: Calibration | null;
  onSave: (c: Calibration) => void;
  onBack: () => void;
}

export default function CalibrationScreen({ reference, existing, onSave, onBack }: Props) {
  const [aspect, setAspect] = useState(reference.width / reference.height);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [pts, setPts] = useState<Pt[]>(existing ? existing.points.map((p) => [...p] as Pt) : []); // normalised
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const imgCache = useRef<RgbaImage | null>(null);

  useEffect(() => { Image.getSize(reference.uri, (w, h) => h > 0 && setAspect(w / h), () => {}); }, [reference.uri]);

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const px = useMemo(() => pts.map(([x, y]) => [x * size.w, y * size.h] as Pt), [pts, size]);
  const mapping = useMemo(() => {
    if (pts.length !== 4 || !size.w) return null;
    return createMapping({ points: pts as Calibration["points"], savedAt: 0 }, size.w, size.h);
  }, [pts, size]);

  /** Tap position inside the photo: native gives locationX/Y, the web gives clientX/Y (relative to the element). */
  function tapPosition(e: any): Pt | null {
    const ne = e?.nativeEvent ?? {};
    let x: number | undefined = ne.locationX, y: number | undefined = ne.locationY;
    const el = e?.currentTarget;
    if (typeof ne.clientX === "number" && el?.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      x = ne.clientX - r.left; y = ne.clientY - r.top;
    }
    if (typeof x !== "number" || typeof y !== "number" || Number.isNaN(x) || Number.isNaN(y) || !size.w) return null;
    return [Math.min(1, Math.max(0, x / size.w)), Math.min(1, Math.max(0, y / size.h))];
  }

  function tap(e: unknown) {
    const p = tapPosition(e);
    if (!p) return;
    setNote("");
    if (pts.length < 4) return setPts([...pts, p]);
    // all four placed: move the nearest point
    let bi = 0, bd = Infinity;
    pts.forEach((q, i) => { const d = Math.hypot((q[0] - p[0]) * size.w, (q[1] - p[1]) * size.h); if (d < bd) { bd = d; bi = i; } });
    setPts(pts.map((q, i) => (i === bi ? p : q)));
  }

  async function getImage(): Promise<RgbaImage> {
    if (!imgCache.current) imgCache.current = await loadRgba(reference.uri, 480);
    return imgCache.current;
  }

  async function suggest() {
    setBusy(true); setNote("");
    await new Promise((r) => setTimeout(r, 30)); // let the spinner render first
    try {
      const img = await getImage();
      const f = findBoard(img);
      if (!f) { setNote("Het bord werd niet gevonden. Tik de punten zelf aan."); }
      else {
        const guess = pointsFromCircle(f.cx, f.cy, f.r, img.width, img.height);
        const fine = refineCalibration(img, { points: guess, savedAt: 0 });
        setPts(fine.points as Pt[]);
        setNote("Voorstel geplaatst en afgesteld op de ringen. Controleer of de lijnen precies op de ringranden liggen; verplaats een punt door erop te tikken.");
      }
    } catch {
      setNote("De foto kon niet worden geanalyseerd. Tik de punten zelf aan.");
    }
    setBusy(false);
  }

  async function fineTune() {
    if (pts.length !== 4) return;
    setBusy(true); setNote("");
    await new Promise((r) => setTimeout(r, 30));
    try {
      const img = await getImage();
      const fine = refineCalibration(img, { points: pts as Calibration["points"], savedAt: 0 });
      setPts(fine.points as Pt[]);
      setNote("Afgesteld op de ringranden. Klopt het nog niet, verplaats dan een punt en probeer opnieuw.");
    } catch {
      setNote("Fijn afstellen is niet gelukt.");
    }
    setBusy(false);
  }

  const next = pts.length < 4 ? pts.length : -1;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={onBack} hitSlop={10}><Text style={styles.back}>‹ Terug</Text></Pressable>
        <Text style={styles.title}>Bord kalibreren</Text>
        <Text style={styles.text}>
          {next >= 0
            ? `Punt ${next + 1} van 4: tik op de buitenrand van de dubbelring (de buitenste gekleurde ring), op de lijn ${CALIBRATION_LABELS[next]}.`
            : "Controleer of de lijnen precies op de ringen van je bord liggen. Tik op een punt om het te verplaatsen."}
        </Text>

        <Pressable onPress={tap} style={[styles.photo, { aspectRatio: aspect }]} onLayout={onLayout} accessibilityLabel="Foto van het lege bord. Tik om punten te plaatsen">
          <Image source={{ uri: reference.uri }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
          {size.w > 0 && <BoardOverlay width={size.w} height={size.h} mapping={mapping} points={px} />}
        </Pressable>

        {!!note && <Text style={styles.note}>{note}</Text>}
        {pts.length === 4 && !mapping && <Text style={styles.warn}>Deze punten geven geen geldig bord. Controleer de volgorde (boven, rechts, onder, links).</Text>}

        <View style={{ gap: 10, marginTop: 14 }}>
          <Button label={busy ? "Bezig…" : "Automatisch voorstel"} variant="ghost" disabled={busy} onPress={suggest} />
          {pts.length === 4 && <Button label={busy ? "Bezig…" : "Fijn afstellen op de ringen"} variant="ghost" disabled={busy} onPress={fineTune} />}
          <Button label="Laatste punt ongedaan maken" variant="ghost" disabled={pts.length === 0} onPress={() => setPts(pts.slice(0, -1))} />
          <Button label="Opnieuw beginnen" variant="ghost" disabled={pts.length === 0} onPress={() => { setPts([]); setNote(""); }} />
          <Button label="Opslaan" disabled={!mapping} onPress={() => onSave({ points: pts as Calibration["points"], savedAt: Date.now(), aspect })} />
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
  text: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  photo: { width: "100%", backgroundColor: "#000", borderRadius: radius.md, overflow: "hidden" },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  warn: { color: colors.warn, fontSize: 13, marginTop: 8 },
});
