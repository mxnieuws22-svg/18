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
 * Phase 3 plugs in here: compare the two photos and return where darts landed.
 * Kept as an interface now so a better detector (OpenCV, a trained model, ...) can be swapped in later
 * without touching the screens or the game rules.
 */
export interface DetectedDart {
  /** Position in the 'after' photo, in pixels. */
  x: number;
  y: number;
  confidence: number; // 0..1
}
export interface DartDetector {
  detect(reference: Capture, after: Capture): Promise<DetectedDart[]>;
}

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
