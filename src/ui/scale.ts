import type { Mode } from "../types/index.js";

const HANDSET_WIDTH = 200;
const GAP = 36;

/** Starting scale picked from the viewport size. */
export function defaultScale(): number {
  const { innerWidth: w, innerHeight: h } = window;
  if (w < 480) return 1.5;
  if (h >= 980) return 2;
  if (h >= 720) return 1.5;
  return 1;
}

/** The chosen scale, reduced if two handsets would not fit side by side. */
export function effectiveScale(mode: Mode, chosen: number, stageWidth: number): number {
  if (mode !== "both" || stageWidth <= 0) return chosen;
  const fit = Math.floor(((stageWidth - GAP) / (2 * HANDSET_WIDTH)) * 20) / 20;
  return Math.max(1, Math.min(chosen, fit));
}
