import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import type { Pt } from "../vision/homography";
import type { BoardMapping } from "../vision/calibration";
import { overlayLines } from "../vision/calibration";
import { colors } from "../theme";

interface Marker { at: Pt; label: string; color?: string }

interface Props {
  width: number;
  height: number;
  mapping?: BoardMapping | null;
  /** Calibration points to show (image pixels at the displayed size). */
  points?: Pt[];
  markers?: Marker[];
}

/** Draws the board's rings/wires, the tapped calibration points and dart markers on top of a photo. */
export default function BoardOverlay({ width, height, mapping, points = [], markers = [] }: Props) {
  const lines = mapping ? overlayLines(mapping) : null;
  const toStr = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <Svg width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
      {lines?.rings.map((r, i) => (
        <Polyline key={`r${i}`} points={toStr(r)} fill="none" stroke={colors.accent} strokeWidth={i >= 4 ? 1.6 : 1} opacity={0.85} />
      ))}
      {lines?.wires.map((w, i) => (
        <Line key={`w${i}`} x1={w[0][0]} y1={w[0][1]} x2={w[1][0]} y2={w[1][1]} stroke={colors.accent} strokeWidth={0.6} opacity={0.5} />
      ))}
      {points.map((p, i) => (
        <Circle key={`p${i}`} cx={p[0]} cy={p[1]} r={9} fill="rgba(251,191,36,0.25)" stroke={colors.warn} strokeWidth={2} />
      ))}
      {points.map((p, i) => (
        <SvgText key={`t${i}`} x={p[0]} y={p[1] + 4} fill={colors.warn} fontSize={12} fontWeight="700" textAnchor="middle">{i + 1}</SvgText>
      ))}
      {markers.map((m, i) => (
        <Circle key={`m${i}`} cx={m.at[0]} cy={m.at[1]} r={6} fill={m.color ?? colors.danger} stroke="#fff" strokeWidth={1.5} />
      ))}
      {markers.map((m, i) => (
        <SvgText key={`l${i}`} x={m.at[0] + 10} y={m.at[1] - 8} fill="#fff" stroke="#000" strokeWidth={0.6} fontSize={13} fontWeight="700">{m.label}</SvgText>
      ))}
    </Svg>
  );
}
