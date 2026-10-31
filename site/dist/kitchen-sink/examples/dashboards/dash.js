import { mount } from "./charts.js";
import { initPackPicker, initScheme, initHue } from "./skins.js";
import { highlightAll } from "../code-highlight.js";
mount();
initPackPicker(document.getElementById("pack"));
initScheme(document.getElementById("scheme"));
initHue(document.getElementById("hue"), document.getElementById("hue-out"));
const shell = document.querySelector(".dash");
document.querySelector(".menu-btn")?.addEventListener("click", () => shell.toggleAttribute("data-open"));
// segmented range buttons: re-plot charts with deterministic pseudo data
const rnd = (seed, n, base, amp) => Array.from({ length: n }, (_, i) => Math.round(base + amp * (Math.sin(i * 0.7 + seed) + Math.sin(i * 0.23 + seed * 2) * 0.6 + i / n)));
for (const seg of document.querySelectorAll(".seg[data-target]")) seg.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  const el = document.getElementById(seg.dataset.target), n = +b.dataset.n, k = (el.dataset.values.match(/\[\[/) ? 2 : 1);
  el.dataset.values = JSON.stringify(k === 2 ? [rnd(n, n, 420, 120), rnd(n + 3, n, 260, 90)] : rnd(n, n, 300, 120)); mount(el.parentElement);
});
// HTML | FreeMarker | React tabs
for (const box of document.querySelectorAll(".code-tabs")) {
  const tabs = [...box.querySelectorAll("[role=tab]")], panels = [...box.querySelectorAll("[role=tabpanel]")];
  tabs.forEach((t, i) => t.addEventListener("click", () => { tabs.forEach((x, j) => { x.setAttribute("aria-selected", i === j); panels[j].hidden = i !== j; }); }));
  box.querySelector("[role=tablist]").addEventListener("keydown", (e) => { const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : -1; if (n >= 0) { tabs[n].focus(); tabs[n].click(); } });
}
highlightAll();
