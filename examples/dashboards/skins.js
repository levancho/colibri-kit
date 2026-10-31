// Theme ("skin") switcher. Contract shared with the collaborative themes track:
//   themes/collab/index.json  -> [{ "id": "aurora", "name": "Aurora", "file": "aurora.css", "author": "..." }]
//   themes/collab/<file>.css  -> rules scoped to  html[data-skin="<id>"] { --c-hue: ...; --chart-1: ...; ... }
// No skin = plain Colibri CSS tokens. Light/dark stays on data-theme and works with every skin.
const BASE = new URL("../../themes/collab/", import.meta.url);
const FALLBACK = [ // stubs so switching works before real collab themes land
  { id: "stub-ember", name: "Ember (stub)", css: `html[data-skin=ember-stub],html[data-skin=stub-ember]{--c-hue:35;--c-chroma:.17;--c-radius:4px;--c-radius-l:6px;--chart-1:oklch(66% .17 35);--chart-2:oklch(72% .13 80);--chart-3:oklch(60% .12 10);--chart-4:oklch(70% .08 120)}` },
  { id: "stub-mint", name: "Mint (stub)", css: `html[data-skin=stub-mint]{--c-hue:165;--c-chroma:.12;--c-radius:16px;--c-radius-l:24px;--chart-1:oklch(65% .13 165);--chart-2:oklch(70% .12 220);--chart-3:oklch(75% .12 120);--chart-4:oklch(65% .1 280);--c-font:ui-rounded,system-ui,sans-serif}` },
];
async function list() {
  try { const r = await fetch(new URL("index.json", BASE)); if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) return j; } } catch {}
  return FALLBACK;
}
function load(t) {
  if (document.querySelector(`[data-skin-css="${t.id}"]`)) return;
  const el = t.css ? Object.assign(document.createElement("style"), { textContent: t.css }) : Object.assign(document.createElement("link"), { rel: "stylesheet", href: new URL(t.file, BASE).href });
  el.dataset.skinCss = t.id; document.head.append(el);
}
export function setSkin(id, themes) {
  const t = themes.find((x) => x.id === id);
  if (t) { load(t); document.documentElement.dataset.skin = id; } else delete document.documentElement.dataset.skin;
  localStorage.setItem("colibri-skin", id || "");
}
export async function initSkinPicker(select) {
  const themes = await list();
  select.innerHTML = `<option value="">No theme (plain Colibri)</option>` + themes.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
  const saved = new URLSearchParams(location.search).get("skin") ?? localStorage.getItem("colibri-skin") ?? "";
  select.value = themes.some((t) => t.id === saved) ? saved : ""; setSkin(select.value, themes);
  select.addEventListener("change", () => setSkin(select.value, themes));
}
export function initScheme(btn) {
  const saved = localStorage.getItem("colibri-scheme"); if (saved) document.documentElement.dataset.theme = saved;
  btn.addEventListener("click", () => { const dark = (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    document.documentElement.dataset.theme = dark ? "light" : "dark"; localStorage.setItem("colibri-scheme", document.documentElement.dataset.theme); });
}
