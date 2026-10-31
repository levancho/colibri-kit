// Colibri Kit mini charts: dependency-free SVG. Colours come from CSS tokens (currentColor / var(--c-*)), so themes restyle them.
const NS = "http://www.w3.org/2000/svg";
const svg = (w, h, inner, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" preserveAspectRatio="none" class="chart">${inner}</svg>`;
const pts = (data, w, h, pad = 4) => { const max = Math.max(...data), min = Math.min(...data), r = max - min || 1;
  return data.map((v, i) => [pad + (i * (w - 2 * pad)) / (data.length - 1), h - pad - ((v - min) / r) * (h - 2 * pad)]); };
export function sparkline(data, { w = 120, h = 36, label = "trend" } = {}) {
  const p = pts(data, w, h), d = p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join("");
  return svg(w, h, `<path d="${d} L${w - 4} ${h} L4 ${h}Z" fill="var(--chart-fill, var(--c-accent-soft))"/><path d="${d}" fill="none" stroke="var(--chart-1, var(--c-accent))" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`, label);
}
export function area(series, { w = 600, h = 200, label = "area chart" } = {}) {
  const all = series.flat(), max = Math.max(...all) * 1.1; let out = "";
  for (let g = 1; g < 4; g++) out += `<line x1="0" x2="${w}" y1="${(h * g) / 4}" y2="${(h * g) / 4}" stroke="var(--c-line)" vector-effect="non-scaling-stroke" stroke-dasharray="3 4"/>`;
  series.forEach((data, s) => { const p = data.map((v, i) => [(i * w) / (data.length - 1), h - (v / max) * h]);
    const d = p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(""); const c = `var(--chart-${s + 1}, var(--c-accent))`;
    out += `<path d="${d} L${w} ${h} L0 ${h}Z" fill="${c}" opacity=".14"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.25" vector-effect="non-scaling-stroke"/>`; });
  return svg(w, h, out, label);
}
export function bars(data, { w = 600, h = 200, gap = 0.3, label = "bar chart" } = {}) {
  const max = Math.max(...data) * 1.08, bw = w / data.length;
  return svg(w, h, data.map((v, i) => `<rect x="${(i * bw + (bw * gap) / 2).toFixed(1)}" y="${(h - (v / max) * h).toFixed(1)}" width="${(bw * (1 - gap)).toFixed(1)}" height="${((v / max) * h).toFixed(1)}" rx="3" fill="var(--chart-${(i % 2) + 1}, var(--c-accent))"><title>${v}</title></rect>`).join(""), label);
}
export function donut(parts, { size = 140, thick = 18, label = "donut chart" } = {}) {
  const tot = parts.reduce((a, b) => a + b, 0), r = (size - thick) / 2, C = 2 * Math.PI * r; let off = 0;
  const segs = parts.map((v, i) => { const len = (v / tot) * C, s = `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--chart-${i + 1})" stroke-width="${thick}" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += len; return s; });
  return `<svg viewBox="0 0 ${size} ${size}" class="chart donut" role="img" aria-label="${label}"><circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--c-sunken)" stroke-width="${thick}"/>${segs.join("")}</svg>`;
}
export function mount(root = document) {
  for (const el of root.querySelectorAll("[data-chart]")) {
    const kind = el.dataset.chart, data = JSON.parse(el.dataset.values || "[]"), label = el.getAttribute("aria-label") || kind;
    el.innerHTML = ({ sparkline, area, bars, donut })[kind]?.(data, { label }) ?? "";
  }
}
