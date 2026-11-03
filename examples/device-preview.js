// Device preview: a segmented Desktop / Tablet / Phone switcher that re-renders THIS page inside a real iframe
// of the chosen width, so media queries AND container queries respond exactly as on a device.
//   import { mountDevicePreview } from "./device-preview.js"; mountDevicePreview(document.querySelector(".toolbar"));
export const DEVICES = [
  { id: "desktop", label: "Desktop", w: 0, h: 0, icon: '<rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>' },
  { id: "tablet", label: "Tablet", w: 768, h: 1024, icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>' },
  { id: "phone", label: "Phone", w: 390, h: 844, icon: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>' },
];
const KEY = "colibri.devicePreview";
const framed = new URLSearchParams(location.search).has("dp-frame");
if (framed) document.documentElement.classList.add("dp-framed");
const CSS = `.dp-bar{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--dp-line,color-mix(in srgb,currentColor 18%,transparent));border-radius:10px;background:var(--dp-bg,color-mix(in srgb,currentColor 5%,transparent))}
.dp-bar button{display:inline-grid;place-items:center;inline-size:34px;block-size:30px;padding:0;border:0;border-radius:7px;background:none;color:inherit;opacity:.6;cursor:pointer;transition:background .15s,opacity .15s}
.dp-bar button:hover{opacity:1}.dp-bar button[aria-checked=true]{opacity:1;background:var(--dp-on,color-mix(in srgb,currentColor 12%,transparent));box-shadow:0 1px 2px #0002}
.dp-bar button:focus-visible{outline:2px solid currentColor;outline-offset:1px}.dp-bar svg{inline-size:18px;block-size:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dp-size{font:500 11px/1 ui-monospace,monospace;opacity:.65;margin-inline-start:4px;white-space:nowrap}
.dp-stage{position:fixed;inset:var(--dp-top,56px) 0 0 0;z-index:60;display:grid;justify-items:center;align-content:start;overflow:auto;padding:16px;background:color-mix(in srgb,Canvas 70%,GrayText 30%)}
.dp-stage iframe{display:block;max-inline-size:100%;border:0;border-radius:18px;background:Canvas;box-shadow:0 0 0 10px #111,0 20px 50px #0006}
html.dp-framed .dp-bar,html.dp-framed .dp-size{display:none!important}
@media (width < 700px){.dp-bar{display:none}}`;
export function mountDevicePreview(host, { top, storageKey = KEY } = {}) {
  if (!host || framed) return null;
  if (!document.getElementById("dp-css")) { const s = document.createElement("style"); s.id = "dp-css"; s.textContent = CSS; document.head.append(s); }
  const bar = document.createElement("div"); bar.className = "dp-bar"; bar.setAttribute("role", "radiogroup"); bar.setAttribute("aria-label", "Preview width");
  bar.innerHTML = DEVICES.map((d) => `<button type="button" role="radio" data-device="${d.id}" aria-checked="false" aria-label="${d.label}${d.w ? ` (${d.w}px)` : ""}" title="${d.label}${d.w ? ` · ${d.w}×${d.h}` : ""}"><svg viewBox="0 0 24 24" aria-hidden="true">${d.icon}</svg></button>`).join("");
  const size = document.createElement("span"); size.className = "dp-size"; size.setAttribute("aria-live", "polite");
  host.prepend(bar, size);
  let stage = null;
  const set = (id, focus) => {
    const d = DEVICES.find((x) => x.id === id) || DEVICES[0];
    bar.querySelectorAll("button").forEach((b) => { const on = b.dataset.device === d.id; b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    try { localStorage.setItem(storageKey, d.id); } catch {}
    size.textContent = d.w ? `${d.w}×${d.h}` : "";
    if (!d.w) { stage?.remove(); stage = null; document.documentElement.style.overflow = ""; return; }
    if (!stage) { stage = document.createElement("div"); stage.className = "dp-stage"; stage.innerHTML = '<iframe title="Device preview"></iframe>'; document.body.append(stage);
      const t = top ?? Math.round((host.closest("header") || host).getBoundingClientRect().bottom); stage.style.setProperty("--dp-top", `${t}px`); }
    const f = stage.querySelector("iframe"), u = new URL(location.href); u.searchParams.set("dp-frame", "1");
    if (f.dataset.src !== u.href) { f.src = u.href; f.dataset.src = u.href; }
    f.style.inlineSize = `${d.w}px`; f.style.blockSize = `min(${d.h}px, calc(100vh - ${stage.style.getPropertyValue("--dp-top")} - 32px))`;
    document.documentElement.style.overflow = "hidden";
  };
  bar.addEventListener("click", (e) => { const b = e.target.closest("[data-device]"); if (b) set(b.dataset.device); });
  bar.addEventListener("keydown", (e) => { const ids = DEVICES.map((d) => d.id), cur = ids.indexOf(bar.querySelector("[aria-checked=true]")?.dataset.device);
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (k) { e.preventDefault(); set(ids[(cur + k + ids.length) % ids.length], true); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && stage) set("desktop"); });
  let saved = "desktop"; try { saved = localStorage.getItem(storageKey) || "desktop"; } catch {}
  set(saved);
  return { set };
}
