// Icon: an outline icon set drawn for Colibri on a 24 × 24 grid. Every icon is one stroked path (round caps and
// joins, 1.75 wide by default) that stays inside a 2-unit margin, so icons line up with each other and with text.
// The shapes are built here from circles, rounded rectangles and short strokes; nothing is taken from another set.
import { createElement as h, memo } from "react";
import { Path, Svg } from "react-native-svg";
import { useTheme } from "@colibri-kit/native-core";
import { toneColor } from "./shared.js";

const n = (value) => String(Math.round(value * 100) / 100);
/** A circle as two arcs. */
const O = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${n(r * 2)} 0a${r} ${r} 0 1 0 ${n(-r * 2)} 0z`;
/** A rounded rectangle. */
const B = (x, y, w, hgt, r) => `M${n(x + r)} ${n(y)}h${n(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n(hgt - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${n(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${n(-(hgt - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}z`;
/** A dot the width of the stroke: a stroke too short to see, with round caps. */
const DOT = (x, y) => `M${n(x)} ${n(y - 0.05)}v.1`;
const RING = O(12, 12, 8.75);
const at = (cx, cy, r, degrees) => { const a = (degrees * Math.PI) / 180; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
/** A closed polygon through points given as [radius, degrees] around (cx, cy). */
const around = (cx, cy, points) => points.map(([r, degrees], index) => { const [x, y] = at(cx, cy, r, degrees); return `${index ? "L" : "M"}${n(x)} ${n(y)}`; }).join("") + "z";

// A cog: eight teeth around a hub.
const COG = (() => {
  const points = [];
  for (let tooth = 0; tooth < 8; tooth++) { const a = tooth * 45; points.push([7, a - 14.5], [9.4, a - 9], [9.4, a + 9], [7, a + 14.5]); }
  return around(12, 12, points) + O(12, 12, 3);
})();
// A five-pointed star, lowered a little so that it sits in the middle of the box.
const STAR = around(12, 12.9, Array.from({ length: 10 }, (_, index) => [index % 2 ? 4.5 : 9.6, index * 36]));
const RAYS = Array.from({ length: 8 }, (_, index) => { const [x1, y1] = at(12, 12, 6.9, index * 45), [x2, y2] = at(12, 12, 9.25, index * 45); return `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`; }).join("");
// Two chain links on the rising diagonal: each is a capsule with its near end left open.
const LINK = (() => {
  const k = Math.SQRT1_2, u = [k, -k], v = [k, k], r = 3.35, far = 5.1, near = 1.15, stub = 2;
  const p = (along, across, flip) => { const x = u[0] * along + v[0] * across, y = u[1] * along + v[1] * across; return `${n(12 + (flip ? -x : x))} ${n(12 + (flip ? -y : y))}`; };
  const one = (flip) => `M${p(near - r, 0, flip)}A${r} ${r} 0 0 0 ${p(near, r, flip)}L${p(far, r, flip)}A${r} ${r} 0 0 0 ${p(far, -r, flip)}L${p(far - stub, -r, flip)}`;
  return one(false) + one(true);
})();
// A four-pointed star with hollowed sides.
const spark = (cx, cy, r) => { const k = r * 0.18; return `M${n(cx)} ${n(cy - r)}C${n(cx + k)} ${n(cy - k * 2.2)} ${n(cx + k * 2.2)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}C${n(cx + k * 2.2)} ${n(cy + k)} ${n(cx + k)} ${n(cy + k * 2.2)} ${n(cx)} ${n(cy + r)}C${n(cx - k)} ${n(cy + k * 2.2)} ${n(cx - k * 2.2)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}C${n(cx - k * 2.2)} ${n(cy - k)} ${n(cx - k)} ${n(cy - k * 2.2)} ${n(cx)} ${n(cy - r)}z`; };

const ICONS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  "chevron-left": "M14.5 6l-6 6 6 6",
  "chevron-right": "M9.5 6l6 6-6 6",
  "chevron-up": "M6 14.5l6-6 6 6",
  "chevron-down": "M6 9.5l6 6 6-6",
  "arrow-left": "M19 12H5M11 6l-6 6 6 6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up": "M12 19V5M6 11l6-6 6 6",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  search: O(10.75, 10.75, 6.75) + "M15.6 15.6L20.5 20.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  "more-horizontal": O(5.25, 12, 0.9) + O(12, 12, 0.9) + O(18.75, 12, 0.9),
  "more-vertical": O(12, 5.25, 0.9) + O(12, 12, 0.9) + O(12, 18.75, 0.9),
  home: "M3.5 11.2L12 3.8l8.5 7.4M5.75 9.4v9.1a1.75 1.75 0 0 0 1.75 1.75h9a1.75 1.75 0 0 0 1.75-1.75V9.4M9.75 20.25V14.5h4.5v5.75",
  user: O(12, 7.75, 3.75) + "M4.75 20.25a7.25 7.25 0 0 1 14.5 0",
  users: O(9, 8, 3.4) + "M2.75 20.25a6.25 6.25 0 0 1 12.5 0M15.6 4.75a3.4 3.4 0 0 1 0 6.5M17.9 14.6a6.25 6.25 0 0 1 3.35 5.65",
  settings: COG,
  bell: "M12 3v1.75M6.25 16.75V11a5.75 5.75 0 0 1 11.5 0v5.75l1.5 1.75H4.75zM9.9 20.6a2.3 2.3 0 0 0 4.2 0",
  mail: B(3, 5.25, 18, 13.5, 2.25) + "M3.6 7.6L12 13.5l8.4-5.9",
  calendar: B(3.5, 5, 17, 15.5, 2.25) + "M3.5 10h17M8 3v4M16 3v4",
  clock: RING + "M12 7.25V12l3.25 2",
  heart: "M12 20.25s-8.25-4.6-8.25-10.4a4.55 4.55 0 0 1 8.25-2.65 4.55 4.55 0 0 1 8.25 2.65c0 5.8-8.25 10.4-8.25 10.4z",
  star: STAR,
  trash: "M4 6.5h16M9.25 6.5v-2a1.25 1.25 0 0 1 1.25-1.25h3a1.25 1.25 0 0 1 1.25 1.25v2M6 6.5l.75 12.1a1.75 1.75 0 0 0 1.75 1.65h7a1.75 1.75 0 0 0 1.75-1.65L18 6.5M10 10.5v6M14 10.5v6",
  edit: "M4 20l.9-4.6L16.2 4.1a2.6 2.6 0 0 1 3.7 3.7L8.6 19.1zM14 6.3l3.7 3.7",
  copy: B(8.5, 8.5, 12, 12, 2.25) + "M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3",
  share: "M12 14.5v-11M7.75 7.5L12 3.25l4.25 4.25M8 11H6.75a2.25 2.25 0 0 0-2.25 2.25v5.25a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-5.25A2.25 2.25 0 0 0 17.25 11H16",
  download: "M12 3.75v11M7.5 10.5L12 15l4.5-4.5M4.25 16.5v1.75a2.25 2.25 0 0 0 2.25 2.25h11a2.25 2.25 0 0 0 2.25-2.25V16.5",
  upload: "M12 15V4M7.5 8.25L12 3.75l4.5 4.5M4.25 16.5v1.75a2.25 2.25 0 0 0 2.25 2.25h11a2.25 2.25 0 0 0 2.25-2.25V16.5",
  link: LINK,
  "external-link": "M11 6H6.5a2.25 2.25 0 0 0-2.25 2.25v9.25a2.25 2.25 0 0 0 2.25 2.25h9.25A2.25 2.25 0 0 0 18 17.5V13M14.25 4.25h5.5v5.5M19.5 4.5L11 13",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" + O(12, 12, 2.9),
  "eye-off": "M4 4l16 16M10.2 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.7 3.5M6.6 7.4C3.9 9.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.4-1.1M9.95 9.95a2.9 2.9 0 0 0 4.1 4.1",
  lock: B(4.75, 10.5, 14.5, 10, 2.25) + "M8 10.5V8a4 4 0 0 1 8 0v2.5",
  unlock: B(4.75, 10.5, 14.5, 10, 2.25) + "M8 10.5V8a4 4 0 0 1 7.75-1.4",
  info: RING + "M12 11.25v5.25" + DOT(12, 7.9),
  "alert-triangle": "M10.45 4.35L2.7 17.6a1.8 1.8 0 0 0 1.55 2.7h15.5a1.8 1.8 0 0 0 1.55-2.7L13.55 4.35a1.8 1.8 0 0 0-3.1 0zM12 9.5v4.5" + DOT(12, 17),
  "alert-circle": RING + "M12 7.5v5.25" + DOT(12, 16.1),
  "check-circle": RING + "M8 12.4l2.75 2.75L16 9.5",
  "x-circle": RING + "M9 9l6 6M15 9l-6 6",
  filter: "M3.75 5h16.5l-6.5 7.75v5.5l-3.5 1.75v-7.25z",
  sort: "M8 5v14M4.25 15.25L8 19l3.75-3.75M16 19V5M12.25 8.75L16 5l3.75 3.75",
  refresh: "M19.75 12a7.75 7.75 0 1 1-2.3-5.5M19.75 3.5v4.25H15.5",
  send: "M20.5 3.5L3.25 10.25l6.9 3.6 3.6 6.9zM20.5 3.5L10.15 13.85",
  image: B(3.25, 4.5, 17.5, 15, 2.25) + O(8.6, 9.6, 1.6) + "M3.6 17.2l4.9-4.6 3.9 3.6 2.6-2.3 5.4 4.8",
  file: "M13.5 3.25H7.75A2.25 2.25 0 0 0 5.5 5.5v13a2.25 2.25 0 0 0 2.25 2.25h8.5a2.25 2.25 0 0 0 2.25-2.25V8.25zM13.5 3.25V6.5a1.75 1.75 0 0 0 1.75 1.75h3.25",
  folder: "M3.25 7a2.25 2.25 0 0 1 2.25-2.25h3.6L11.5 7.5h7a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-13a2.25 2.25 0 0 1-2.25-2.25z",
  camera: "M3.25 9.25A2.25 2.25 0 0 1 5.5 7h2.1l1.5-2.5h5.8L16.4 7h2.1a2.25 2.25 0 0 1 2.25 2.25v8a2.25 2.25 0 0 1-2.25 2.25h-13a2.25 2.25 0 0 1-2.25-2.25z" + O(12, 13, 3.4),
  "map-pin": "M12 21.25s-6.75-5.7-6.75-11.25a6.75 6.75 0 0 1 13.5 0c0 5.55-6.75 11.25-6.75 11.25z" + O(12, 10, 2.5),
  phone: "M5.3 3.5h2.9l1.7 4.3-2.2 1.5a11.5 11.5 0 0 0 7 7l1.5-2.2 4.3 1.7v2.9a1.9 1.9 0 0 1-2.1 1.9C10.4 20 4 13.6 3.4 5.6a1.9 1.9 0 0 1 1.9-2.1z",
  "credit-card": B(2.5, 5, 19, 14, 2.5) + "M2.5 10h19M6.25 15h3.5",
  "shopping-cart": "M2.5 3.75h2.6l2.65 11.5h10l2-8H6" + O(9, 19.1, 1.15) + O(16.5, 19.1, 1.15),
  tag: "M3.5 5.5a2 2 0 0 1 2-2h5.4a2 2 0 0 1 1.4.6l8.1 8.1a2 2 0 0 1 0 2.8l-5.4 5.4a2 2 0 0 1-2.8 0l-8.1-8.1a2 2 0 0 1-.6-1.4z" + O(8, 8, 1.1),
  bookmark: "M6.25 5.5A2.25 2.25 0 0 1 8.5 3.25h7a2.25 2.25 0 0 1 2.25 2.25v15.25L12 16.5l-5.75 4.25z",
  sun: O(12, 12, 3.9) + RAYS,
  moon: "M20.2 14.1A8.5 8.5 0 1 1 9.9 3.8a7 7 0 0 0 10.3 10.3z",
  play: "M7 5.4v13.2a1 1 0 0 0 1.5.85l10.9-6.6a1 1 0 0 0 0-1.7L8.5 4.55A1 1 0 0 0 7 5.4z",
  pause: B(6.25, 4.75, 4, 14.5, 1.25) + B(13.75, 4.75, 4, 14.5, 1.25),
  mic: B(8.75, 2.75, 6.5, 11.5, 3.25) + "M5.25 11a6.75 6.75 0 0 0 13.5 0M12 17.75v3.5M8.75 21.25h6.5",
  paperclip: "M19.6 11.4l-7.9 7.9a4.6 4.6 0 0 1-6.5-6.5l8.5-8.5a3.1 3.1 0 0 1 4.4 4.4l-8.3 8.3a1.55 1.55 0 0 1-2.2-2.2l7.5-7.5",
  sparkles: spark(10, 13.5, 7.5) + spark(18.25, 5.75, 3.25),
  terminal: B(3, 4.5, 18, 15, 2.25) + "M7 9.25l3 2.75-3 2.75M12.75 15h4.25",
  code: "M8.5 6.5L3 12l5.5 5.5M15.5 6.5L21 12l-5.5 5.5",
};

/** Every name Icon accepts, in catalogue order. */
export const iconNames = Object.freeze(Object.keys(ICONS));

/**
 * One outline icon. size is the side in points (default 24); the stroke scales with it.
 * Colour: color wins, then tone (accent | ok | warn | bad | muted), else the text colour of the theme.
 * With label the icon is an image with that name for screen readers; without it the icon is decoration and hidden
 * from them. An unknown name draws an empty box of the same size.
 * To use one where the main entry takes an icon: icon={({ color, size }) => h(Icon, { name: "home", color, size })}.
 */
export const Icon = memo(function Icon({ name, size = 24, tone, color, strokeWidth = 1.75, label, style, testID }) {
  const theme = useTheme(), stroke = color ?? toneColor(theme, tone) ?? theme.colors.fg, d = Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : null;
  const a11y = label ? { accessible: true, accessibilityRole: "image", accessibilityLabel: label }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", "aria-hidden": true };
  return h(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: "none", testID, style, ...a11y },
    d ? h(Path, { d, fill: "none", stroke, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" }) : null);
});
