import { mountDevicePreview } from "../device-preview.js";
{ const top = document.querySelector(".dash-top"); if (top) { const slot = document.createElement("span"); slot.className = "dp-slot"; top.append(slot); mountDevicePreview(slot); } }
import { mount } from "./charts.js";
import { initPackPicker, initScheme, initHue } from "./skins.js";
import { highlightAll } from "../code-highlight.js";
mount();
initPackPicker(document.getElementById("pack"));
initScheme(document.getElementById("scheme"));
initHue(document.getElementById("hue"), document.getElementById("hue-out"));
import { initDashboard } from "./demo.js?v=visual-2";
initDashboard();
// Range changes select the same underlying sample series, never invent new data.
for (const seg of document.querySelectorAll(".seg[data-target]")) {
  const el = document.getElementById(seg.dataset.target), source = JSON.parse(el.dataset.values);
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const n = Number(b.dataset.n);
    el.dataset.values = JSON.stringify(Array.isArray(source[0]) ? source.map(s => s.slice(-n)) : source.slice(-n));
    mount(el.parentElement);
    el.dispatchEvent(new Event("chartchange"));
  });
}
// HTML | FreeMarker | React tabs
for (const [index, box] of [...document.querySelectorAll(".code-tabs")].entries()) {
  const tabs = [...box.querySelectorAll("[role=tab]")], panels = [...box.querySelectorAll("[role=tabpanel]")];
  tabs.forEach((t, i) => {
    t.id = `source-${index}-tab-${i}`; panels[i].id = `source-${index}-panel-${i}`;
    t.setAttribute("aria-controls", panels[i].id); panels[i].setAttribute("aria-labelledby", t.id);
    t.tabIndex = i === 0 ? 0 : -1;
  });
  tabs.forEach((t, i) => t.addEventListener("click", () => { tabs.forEach((x, j) => { x.setAttribute("aria-selected", i === j); panels[j].hidden = i !== j; x.tabIndex = i === j ? 0 : -1; }); }));
  box.querySelector("[role=tablist]").addEventListener("keydown", (e) => { const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1; if (n >= 0) { e.preventDefault(); tabs[n].focus(); tabs[n].click(); } });
}
highlightAll();
