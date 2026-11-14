// The Colibri palette and scales for React Native. Same token names and the same formulas as
// packages/colibri-css/src/20-tokens.css: change hue (and chroma) and every colour follows.
import { oklch, mix } from "./color.js";

const BLACK = [0, 0, 0];
// [light, dark] as [L, C, H]; H is filled in from the theme hue unless given.
const PALETTE = (h, c) => ({
  bg: [[0.995, 0.003, h], [0.17, 0.01, h]],
  surface: [[1, 0, 0], [0.21, 0.012, h]],
  sunken: [[0.965, 0.006, h], [0.14, 0.01, h]],
  fg: [[0.22, 0.02, h], [0.95, 0.01, h]],
  muted: [[0.5, 0.02, h], [0.72, 0.015, h]],
  line: [[0.91, 0.008, h], [0.3, 0.012, h]],
  accent: [[0.5, c, h], [0.72, c, h]],
  brandFg: [[0.99, 0.01, h], [0.18, 0.02, h]],
  ok: [[0.45, 0.14, 150], [0.75, 0.15, 150]],
  warn: [[0.45, 0.15, 75], [0.82, 0.15, 80]],
  bad: [[0.47, 0.19, 25], [0.72, 0.18, 25]],
});

export const space = { "3xs": 2, "2xs": 4, xs: 8, s: 12, m: 16, l: 24, xl: 32, "2xl": 48 };
export const text = { xs: 12, sm: 14, md: 16, lg: 19, xl: 23, "2xl": 29, "3xl": 36 };
const RADII = { sharp: { s: 2, m: 3, l: 4, full: 999 }, soft: { s: 6, m: 10, l: 16, full: 999 }, round: { s: 12, m: 16, l: 24, full: 999 } };
/** Tone words: Colibri CSS says ok | warn | bad; the UI words success | warning | danger (and destructive) are accepted too. */
const TONES = { accent: "accent", ok: "ok", success: "ok", warn: "warn", warning: "warn", bad: "bad", danger: "bad", destructive: "bad" };
export const toneName = (tone) => TONES[tone] ?? null;

const number = (value, fallback, min, max) => (Number.isFinite(+value) ? Math.min(max, Math.max(min, +value)) : fallback);

/**
 * createTheme({ hue: 255, chroma: 0.16, scheme: "light" | "dark", radius: "sharp" | "soft" | "round" })
 * Returns plain values (hex strings and numbers) ready for StyleSheet.
 */
export function createTheme(options = {}) {
  const hue = number(options.hue, 255, 0, 360), chroma = number(options.chroma, 0.16, 0, 0.37);
  const dark = options.scheme === "dark", pick = (pair) => pair[dark ? 1 : 0];
  const raw = Object.fromEntries(Object.entries(PALETTE(hue, chroma)).map(([name, pair]) => [name, pick(pair)]));
  const colors = Object.fromEntries(Object.entries(raw).map(([name, lch]) => [name, oklch(...lch)]));
  colors.accentSoft = oklch(...raw.accent, 0.14);
  colors.accentPressed = oklch(...mix(raw.accent, BLACK, 0.88));
  colors.badPressed = oklch(...mix(raw.bad, BLACK, 0.88));
  colors.overlay = dark ? "rgba(0, 0, 0, 0.6)" : oklch(0.22, 0.02, hue, 0.45);
  colors.shadow = dark ? "#000000" : oklch(0.3, 0.03, hue);
  // Per tone: the colour, a translucent fill (badges), an opaque tint of the surface (callouts)
  // and the other scheme's colour for dark-on-light surfaces such as toasts.
  const tones = {};
  for (const tone of ["accent", "ok", "warn", "bad"]) {
    tones[tone] = { fg: colors[tone], soft: oklch(...raw[tone], tone === "warn" ? 0.18 : tone === "accent" ? 0.14 : 0.15), tint: oklch(...mix(raw[tone], raw.surface, 0.09)),
      inverse: oklch(...PALETTE(hue, chroma)[tone][dark ? 0 : 1]) }; // readable on colors.fg (toasts)
  }
  const radius = RADII[options.radius] ?? RADII.soft;
  const shadowOpacity = dark ? 0.5 : 0.12;
  const shadow = (y, blur, elevation) => ({ shadowColor: colors.shadow, shadowOffset: { width: 0, height: y }, shadowOpacity, shadowRadius: blur, elevation,
    boxShadow: `0 ${y}px ${blur * 2}px ${dark ? "rgba(0, 0, 0, 0.5)" : oklch(0.3, 0.03, hue, 0.12)}` });
  return { scheme: dark ? "dark" : "light", hue, chroma, colors, tones, space, text, radius, touch: 44,
    shadow: { s: shadow(1, 1, 1), m: shadow(4, 7, 4), l: shadow(18, 20, 12) } };
}
