// Chart geometry for the svg entry: scales, ticks, curve and arc paths, number formatting, text summaries.
// Pure functions (no React, no React Native), so they also run in Node. Not part of the public API.

const TAU = Math.PI * 2;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** A finite number, or null for anything else (null, undefined, "", NaN): null marks a gap in a line. */
export const finite = (value) => (value == null || value === "" || !Number.isFinite(+value) ? null : +value);
/** Coordinates in a path: two decimals are plenty and keep the strings short. */
const n = (value) => String(Math.round(value * 100) / 100);

// ---------------------------------------------------------------- ticks and scales
const STEPS = [1, 2, 2.5, 5, 10];
/** Rounds away binary noise (0.30000000000000004) without losing real digits. */
const tidy = (value) => +value.toPrecision(12);
/**
 * Round tick values that cover [min, max]: { min, max, step, ticks }. The step is 1, 2, 2.5 or 5 times a power
 * of ten and there are about `count` intervals. zero: true stretches the range to include 0.
 * A flat range (min equals max) still gets a usable axis.
 */
export function niceTicks(min, max, count = 4, zero = false) {
  let low = Number.isFinite(min) ? min : 0, high = Number.isFinite(max) ? max : 0;
  if (low > high) [low, high] = [high, low];
  if (zero) { low = Math.min(0, low); high = Math.max(0, high); }
  if (low === high) {
    if (low === 0) high = 1;
    else if (zero || Math.abs(low) < 1e-12) { if (low > 0) low = 0; else high = 0; }
    else { const pad = Math.abs(low) * 0.1; low -= pad; high += pad; }
  }
  const rough = (high - low) / Math.max(1, count), power = 10 ** Math.floor(Math.log10(rough));
  const step = tidy((STEPS.find((entry) => entry * power >= rough * (1 - 1e-9)) ?? 10) * power);
  const first = Math.floor(low / step + 1e-9), last = Math.ceil(high / step - 1e-9);
  const ticks = Array.from({ length: last - first + 1 }, (_, index) => tidy((first + index) * step));
  return { min: ticks[0], max: ticks[ticks.length - 1], step, ticks };
}

/** Maps a value in [d0, d1] to [r0, r1]. A flat domain maps to the middle of the range. */
export const linear = (d0, d1, r0, r1) => (value) => (d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0));

/** x of point `index` out of `count`, spread edge to edge over [x0, x1]. A single point sits in the middle. */
export const pointX = (index, count, x0, x1) => (count <= 1 ? (x0 + x1) / 2 : x0 + (index / (count - 1)) * (x1 - x0));
/** The index of the point nearest to x: the inverse of pointX. */
export const nearestIndex = (x, count, x0, x1) => (count <= 1 ? 0 : clamp(Math.round(((x - x0) / (x1 - x0)) * (count - 1)), 0, count - 1));
/** Bands for a bar chart: count equal slots over [x0, x1]. Returns { step, at(index) → left edge, index(x) }. */
export function bands(count, x0, x1) {
  const step = count > 0 ? (x1 - x0) / count : 0;
  return { step, at: (index) => x0 + index * step, index: (x) => (count > 0 ? clamp(Math.floor((x - x0) / step), 0, count - 1) : -1) };
}
/** Which labels to draw so that neighbours do not collide: every k-th, with k from the widest label. */
export function labelEvery(count, room, labelWidth) {
  if (count <= 1 || room <= 0) return 1;
  return Math.max(1, Math.ceil((count * labelWidth) / room));
}

// ---------------------------------------------------------------- curves
/**
 * Splits a series into runs of consecutive drawable points: values are numbers or null (a gap).
 * Returns [[{ x, y, index }, …], …]; x(index) and y(value) place a point.
 */
export function runs(values, x, y) {
  const out = []; let run = null;
  values.forEach((value, index) => {
    if (value == null) { run = null; return; }
    if (!run) out.push((run = []));
    run.push({ x: x(index), y: y(value), index });
  });
  return out;
}

const sign = (value) => (value < 0 ? -1 : value > 0 ? 1 : 0);
/**
 * Cubic Bézier segments through the points, as [[c1x, c1y, c2x, c2y, x, y], …] (one per gap between points).
 * smooth: a monotone cubic (Steffen's tangents): the curve never rises above or dips below the two points it
 * joins, so it cannot invent a peak the data does not have. Not smooth: straight segments in the same format.
 * x must increase from point to point.
 */
export function curve(points, smooth = true) {
  const count = points.length, out = [];
  if (count < 2) return out;
  if (!smooth || count === 2) {
    for (let i = 1; i < count; i++) {
      const a = points[i - 1], b = points[i];
      out.push([a.x + (b.x - a.x) / 3, a.y + (b.y - a.y) / 3, a.x + ((b.x - a.x) * 2) / 3, a.y + ((b.y - a.y) * 2) / 3, b.x, b.y]);
    }
    return out;
  }
  const dx = [], slope = [];
  for (let i = 0; i < count - 1; i++) { dx.push(points[i + 1].x - points[i].x); slope.push(dx[i] ? (points[i + 1].y - points[i].y) / dx[i] : 0); }
  const tangent = new Array(count);
  for (let i = 1; i < count - 1; i++) {
    const s0 = slope[i - 1], s1 = slope[i], weighted = (s0 * dx[i] + s1 * dx[i - 1]) / (dx[i - 1] + dx[i]);
    tangent[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(weighted)) || 0;
  }
  // Ends: the tangent that makes the first and last piece a parabola, kept on the side of the secant.
  const end = (s, next) => { const t = (3 * s - next) / 2; return sign(t) !== sign(s) ? 0 : Math.abs(t) > 3 * Math.abs(s) ? 3 * s : t; };
  tangent[0] = end(slope[0], tangent[1]); tangent[count - 1] = end(slope[count - 2], tangent[count - 2]);
  for (let i = 0; i < count - 1; i++) {
    const a = points[i], b = points[i + 1], third = dx[i] / 3;
    out.push([a.x + third, a.y + tangent[i] * third, b.x - third, b.y - tangent[i + 1] * third, b.x, b.y]);
  }
  return out;
}
/** The point at t (0…1) on segment `index` of curve(points): for tests and hit checks. */
export function curvePoint(points, segments, index, t) {
  const a = points[index], [c1x, c1y, c2x, c2y, x, y] = segments[index], u = 1 - t;
  return { x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y };
}
const forward = (segments) => segments.map((s) => `C${n(s[0])} ${n(s[1])} ${n(s[2])} ${n(s[3])} ${n(s[4])} ${n(s[5])}`).join("");
/** The same segments walked from the last point back to the first. */
const backward = (points, segments) => {
  let d = "";
  for (let i = segments.length - 1; i >= 0; i--) { const s = segments[i], a = points[i]; d += `C${n(s[2])} ${n(s[3])} ${n(s[0])} ${n(s[1])} ${n(a.x)} ${n(a.y)}`; }
  return d;
};
/** Path data for a line through the points of one run. Empty for fewer than two points (draw a dot instead). */
export function linePath(points, smooth = true) {
  if (points.length < 2) return "";
  return `M${n(points[0].x)} ${n(points[0].y)}${forward(curve(points, smooth))}`;
}
/**
 * Path data for the area between the line through `points` and a floor: a number (a flat baseline y) or the
 * points of the series below (stacked areas; same x positions).
 */
export function areaPath(points, floor, smooth = true) {
  if (points.length < 2) return "";
  const last = points[points.length - 1], top = `M${n(points[0].x)} ${n(points[0].y)}${forward(curve(points, smooth))}`;
  if (typeof floor === "number") return `${top}L${n(last.x)} ${n(floor)}L${n(points[0].x)} ${n(floor)}Z`;
  const below = floor[floor.length - 1];
  return `${top}L${n(below.x)} ${n(below.y)}${backward(floor, curve(floor, smooth))}Z`;
}

/** A bar from y0 (the base) to y1 (the tip) with the two corners at the tip rounded. Works up and down. */
export function barPath(x, width, y0, y1, radius = 0) {
  const height = Math.abs(y1 - y0), r = Math.max(0, Math.min(radius, width / 2, height)), up = y1 <= y0 ? 1 : -1;
  if (!(height > 0) || !(width > 0)) return "";
  if (!r) return `M${n(x)} ${n(y0)}V${n(y1)}H${n(x + width)}V${n(y0)}Z`;
  const turn = up === 1 ? 1 : 0; // sweep flag: clockwise when the tip is above the base
  return `M${n(x)} ${n(y0)}V${n(y1 + up * r)}A${n(r)} ${n(r)} 0 0 ${turn} ${n(x + r)} ${n(y1)}H${n(x + width - r)}A${n(r)} ${n(r)} 0 0 ${turn} ${n(x + width)} ${n(y1 + up * r)}V${n(y0)}Z`;
}

// ---------------------------------------------------------------- pie and arcs
/** Angles are radians, clockwise from 12 o'clock. */
export const polar = (cx, cy, radius, angle) => ({ x: cx + radius * Math.sin(angle), y: cy - radius * Math.cos(angle) });

/**
 * Lays values around a circle: [{ index, value, start, end, share }] for the values above zero (others are
 * skipped: a pie cannot show nothing or less). The angles of the result add up to the sweep (a full turn by default).
 */
export function pieLayout(values, startAngle = 0, sweep = TAU) {
  const clean = values.map((value) => Math.max(0, finite(value) ?? 0)), total = clean.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return [];
  let seen = 0;
  const out = [];
  clean.forEach((value, index) => {
    if (!(value > 0)) return;
    const start = startAngle + (seen / total) * sweep; seen += value;
    out.push({ index, value, start, end: startAngle + (seen / total) * sweep, share: value / total });
  });
  out[out.length - 1].end = startAngle + sweep; // close the circle exactly, whatever the rounding did
  return out;
}

/** Whole percentages that add up to exactly 100 (largest remainder), so a legend never reads 99% or 101%. */
export function percentages(values) {
  const clean = values.map((value) => Math.max(0, finite(value) ?? 0)), total = clean.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return clean.map(() => 0);
  const exact = clean.map((value) => (value / total) * 100), whole = exact.map(Math.floor);
  let left = 100 - whole.reduce((sum, value) => sum + value, 0);
  exact.map((value, index) => ({ index, rest: value - whole[index] })).sort((a, b) => b.rest - a.rest || a.index - b.index).forEach(({ index }) => { if (left > 0 && clean[index] > 0) { whole[index]++; left--; } });
  return whole;
}

/**
 * Path data for one slice of a pie (inner 0) or a ring. gap is the width of the space between two slices in
 * pixels (each slice gives up half), the same at the rim and at the hole; corner rounds the corners and is
 * reduced where a slice is too thin to hold it. A slice that covers the whole circle is drawn as a full ring.
 */
export function slicePath(cx, cy, outer, inner, start, end, gap = 0, corner = 0) {
  const span = end - start;
  if (!(span > 0) || !(outer > 0)) return "";
  inner = clamp(inner, 0, outer);
  if (span >= TAU - 1e-6) {
    const ring = (radius, turn) => `M${n(cx)} ${n(cy - radius)}A${n(radius)} ${n(radius)} 0 1 ${turn} ${n(cx)} ${n(cy + radius)}A${n(radius)} ${n(radius)} 0 1 ${turn} ${n(cx)} ${n(cy - radius)}Z`;
    return ring(outer, 1) + (inner > 0 ? ring(inner, 0) : "");
  }
  const half = Math.min(gap / 2, outer * Math.sin(Math.min(span, Math.PI) / 2) * 0.5), s = Math.sin(Math.min(span, Math.PI) / 2);
  // The largest corner that still leaves the two fillets of an arc apart.
  let rOut = Math.min(corner, (outer - inner) / 2), rIn = inner > 0 ? rOut : 0;
  if (span < Math.PI) { rOut = Math.min(rOut, (outer * s - half) / (1 + s)); if (inner > 0) rIn = Math.min(rIn, s < 1 ? (inner * s - half) / (1 - s) : rIn); }
  rOut = Math.max(0, rOut); rIn = Math.max(0, rIn);
  // In a frame where an edge of the slice lies along +x and the slice is on the +y side: `side` is where the
  // straight edge ends, `arc` where the rim (or the hole) begins, with a fillet of radius r between them.
  const cornerAt = (radius, r, outside) => {
    const reach = outside ? radius - r : radius + r, off = half + r;
    if (!(reach > off)) return null;
    const along = Math.sqrt(reach * reach - off * off);
    return { side: [along, half], arc: [(along * radius) / reach, (off * radius) / reach] };
  };
  // To the page: flip = false for the start edge (slice clockwise of it), true for the end edge.
  const place = ([along, across], angle, flip) => {
    const dir = polar(0, 0, 1, angle), normal = polar(0, 0, 1, angle + Math.PI / 2), k = flip ? -1 : 1;
    return `${n(cx + dir.x * along + normal.x * across * k)} ${n(cy + dir.y * along + normal.y * across * k)}`;
  };
  const out = cornerAt(outer, rOut, true);
  if (!out) return "";
  const outerSpan = span - 2 * Math.atan2(out.arc[1], out.arc[0]), large = outerSpan > Math.PI ? 1 : 0;
  const fillet = (r, point, angle, flip, turn = 1) => (r > 0.01 ? `A${n(r)} ${n(r)} 0 0 ${turn} ${place(point, angle, flip)}` : `L${place(point, angle, flip)}`);
  let d = `M${place(out.side, start, false)}${fillet(rOut, out.arc, start, false)}A${n(outer)} ${n(outer)} 0 ${large} 1 ${place(out.arc, end, true)}${fillet(rOut, out.side, end, true)}`;
  const hole = inner > 0 && inner * s > half + 0.01 ? cornerAt(inner, rIn, false) : null;
  if (hole) {
    const innerSpan = span - 2 * Math.atan2(hole.arc[1], hole.arc[0]);
    d += `L${place(hole.side, end, true)}${fillet(rIn, hole.arc, end, true)}A${n(inner)} ${n(inner)} 0 ${innerSpan > Math.PI ? 1 : 0} 0 ${place(hole.arc, start, false)}${fillet(rIn, hole.side, start, false)}`;
  } else {
    // A point where the two edges meet, on the bisector (kept near the centre for a slice wider than half a turn).
    const tip = polar(cx, cy, half / s, start + span / 2);
    d += `L${n(tip.x)} ${n(tip.y)}`;
  }
  return `${d}Z`;
}

/** Which slice of pieLayout() holds the point (x, y), or -1. inner and outer bound the ring. */
export function sliceAt(slices, cx, cy, inner, outer, x, y) {
  const dx = x - cx, dy = y - cy, distance = Math.hypot(dx, dy);
  if (distance < inner || distance > outer || !slices.length) return -1;
  const first = slices[0].start, angle = (((Math.atan2(dx, -dy) - first) % TAU) + TAU) % TAU + first;
  const hit = slices.find((slice) => angle >= slice.start && angle < slice.end);
  return hit ? hit.index : -1;
}

/** An open arc (for a stroke) from angle a0 to a1, clockwise from 12 o'clock. */
export function arcPath(cx, cy, radius, a0, a1) {
  const span = a1 - a0;
  if (!(span > 0)) return "";
  if (span >= TAU - 1e-6) { const top = polar(cx, cy, radius, a0), bottom = polar(cx, cy, radius, a0 + Math.PI); return `M${n(top.x)} ${n(top.y)}A${n(radius)} ${n(radius)} 0 1 1 ${n(bottom.x)} ${n(bottom.y)}A${n(radius)} ${n(radius)} 0 1 1 ${n(top.x)} ${n(top.y)}`; }
  const from = polar(cx, cy, radius, a0), to = polar(cx, cy, radius, a1);
  return `M${n(from.x)} ${n(from.y)}A${n(radius)} ${n(radius)} 0 ${span > Math.PI ? 1 : 0} 1 ${n(to.x)} ${n(to.y)}`;
}

// ---------------------------------------------------------------- words and numbers
const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
/** 1284 → "1,284", 15300 → "15.3k", 2400000 → "2.4M", 0.256 → "0.26". Used for axes, tooltips and summaries. */
export function formatNumber(value) {
  if (value == null || !Number.isFinite(+value)) return "–";
  const number = +value, size = Math.abs(number);
  if (size >= 1e9) return `${+(number / 1e9).toFixed(1)}B`;
  if (size >= 1e6) return `${+(number / 1e6).toFixed(1)}M`;
  if (size >= 1e4) return `${+(number / 1e3).toFixed(1)}k`;
  const [whole, fraction] = String(+number.toFixed(size >= 100 ? 1 : 2)).split(".");
  return (whole.startsWith("-") ? "−" + group(whole.slice(1)) : group(whole)) + (fraction ? `.${fraction}` : "");
}

/** One sentence per series: how many values, first, last, lowest and highest. `rows` keeps it short for long data. */
export function describeSeries(kind, title, labels, series, format, emptyText) {
  const head = `${title ? `${title}. ` : ""}${kind}`;
  const parts = series.map((entry, index) => {
    const points = entry.values.map((value, i) => ({ value, label: labels[i] })).filter((point) => point.value != null);
    if (!points.length) return null;
    const name = entry.name ?? (series.length > 1 ? `Series ${index + 1}` : null), first = points[0], last = points[points.length - 1];
    const low = points.reduce((a, b) => (b.value < a.value ? b : a)), high = points.reduce((a, b) => (b.value > a.value ? b : a));
    if (points.length === 1) return `${name ? `${name}: ` : ""}${format(first.value)} (${first.label})`;
    return `${name ? `${name}: ` : ""}${points.length} values from ${format(first.value)} (${first.label}) to ${format(last.value)} (${last.label}), lowest ${format(low.value)} (${low.label}), highest ${format(high.value)} (${high.label})`;
  }).filter(Boolean);
  return parts.length ? `${head}. ${parts.join(". ")}.` : `${head}. ${emptyText}.`;
}
/** "Pie chart. Search: 4,820 (45%); Direct: …". At most 12 parts are read out. */
export function describeParts(kind, title, labels, values, format, emptyText) {
  const head = `${title ? `${title}. ` : ""}${kind}`, shares = percentages(values);
  const rows = labels.map((label, index) => ({ label, value: values[index], share: shares[index] })).filter((row) => row.value > 0);
  if (!rows.length) return `${head}. ${emptyText}.`;
  return `${head}. ${rows.slice(0, 12).map((row) => `${row.label}: ${format(row.value)} (${row.share}%)`).join("; ")}${rows.length > 12 ? `; and ${rows.length - 12} more` : ""}.`;
}
