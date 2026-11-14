// OKLCH → sRGB. React Native has no oklch(), light-dark() or color-mix(), so the palette that Colibri CSS
// leaves to the browser is computed here. Pure functions, no React Native imports: they also run in Node.
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);

function oklabToLinear(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const toLab = (L, C, H) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
/**
 * [r, g, b] in 0..255 for an OKLCH colour (L 0..1, C about 0..0.4, H in degrees).
 * Colours outside sRGB are clipped per channel, which is what browsers do with oklch() today,
 * so a hue gives the same colours here as in Colibri CSS.
 */
export function oklchToRgb(L, C, H) {
  return oklabToLinear(...toLab(L, C, H)).map((x) => Math.round(gamma(clamp01(x)) * 255));
}

const hex2 = (n) => n.toString(16).padStart(2, "0");
/** "#rrggbb", or "rgba(r, g, b, a)" when alpha is below 1. */
export function oklch(L, C, H, alpha = 1) {
  const [r, g, b] = oklchToRgb(L, C, H);
  return alpha >= 1 ? `#${hex2(r)}${hex2(g)}${hex2(b)}` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mixes two OKLCH triples in OKLab, like color-mix(in oklab, a p%, b). Returns an OKLCH triple. */
export function mix(a, b, amount) {
  const [la, aa, ba] = toLab(...a), [lb, ab, bb] = toLab(...b);
  const L = la * amount + lb * (1 - amount), A = aa * amount + ab * (1 - amount), B = ba * amount + bb * (1 - amount);
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
