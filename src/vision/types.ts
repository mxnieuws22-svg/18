/** A photo taken by the app. Stays on the device; never uploaded. */
export interface Capture {
  uri: string;
  width: number;
  height: number;
  takenAt: number; // epoch ms
}

/** Photos of the current session: an empty board and the board after throwing. */
export interface Shots {
  reference?: Capture;
  after?: Capture;
}

/**
 * The detector seam: compare the empty-board photo with the photo after throwing and return the darts.
 * `src/vision/detect.ts` is the first (classic computer-vision) implementation. A better detector
 * (a trained model, a native OpenCV build, ...) can replace it without touching screens or game rules.
 */
export type { FoundDart as DetectedDart, DetectionResult } from "./detect";

export type CaptureWarning = string;

/** Cheap sanity check: both photos must come from the same camera setup. */
export function compareSetup(reference: Capture, after: Capture): CaptureWarning[] {
  const warnings: CaptureWarning[] = [];
  const refPortrait = reference.height >= reference.width;
  const afterPortrait = after.height >= after.width;
  if (refPortrait !== afterPortrait) {
    warnings.push("De telefoon is gedraaid tussen de twee foto’s. Houd dezelfde stand aan (staand of liggend).");
  }
  const refRatio = reference.width / reference.height;
  const afterRatio = after.width / after.height;
  if (Math.abs(refRatio - afterRatio) > 0.02 && refPortrait === afterPortrait) {
    warnings.push("De twee foto’s hebben een andere beeldverhouding. Gebruik dezelfde camera en zoom.");
  }
  if (after.takenAt - reference.takenAt > 6 * 60 * 60 * 1000) {
    warnings.push("De referentiefoto is al lang geleden gemaakt. Maak hem opnieuw als het licht is veranderd.");
  }
  return warnings;
}
