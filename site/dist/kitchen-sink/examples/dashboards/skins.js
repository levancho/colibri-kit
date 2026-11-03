// Theme switcher for dashboards. Uses the Colibri Kit theme-pack contract (themes/packs):
//   <link href="themes/packs/index.css">  +  <html data-kit-theme="glacier|ember|midnight">
// No attribute = plain Colibri tokens. Light/dark stays on data-theme and composes with any pack.
export const PACKS = [
  { id: "", name: "None (plain Colibri)" },
  { id: "glacier", name: "Glacier" },
  { id: "ember", name: "Ember" },
  { id: "midnight", name: "Midnight" },
];
const root = document.documentElement;
const preferences = window.ColibriDemoTheme || {scope:"gallery",pack:"",hue:""};
const key = name => `colibri-demo:${preferences.scope}:${name}`;
const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Themes still work in memory. */ } };
export function setPack(id) { id ? (root.dataset.kitTheme = id) : delete root.dataset.kitTheme; const gen = window.ColibriBridge?.store.get()?.gen; if (!gen || id !== gen.slug) write(key("pack"), id); }
export function initPackPicker(select) {
  // a theme made in the Colibria Kit Theme Generator (via the bridge) shows up as its own pack
  const gen = window.ColibriBridge?.store.get()?.gen, packs = gen ? [...PACKS, { id: gen.slug, name: gen.name + " (generated)" }] : PACKS;
  select.replaceChildren(...packs.map(p => new Option(p.name, p.id)));
  const q = new URLSearchParams(location.search).get("theme");
  select.value = gen && root.dataset.kitTheme === gen.slug ? gen.slug : q ?? read(key("pack")) ?? preferences.pack; if (!packs.some((p) => p.id === select.value)) select.value = "";
  setPack(select.value); select.addEventListener("change", () => setPack(select.value));
}
export function initScheme(btn) {
  const saved = read(key("scheme")); if (saved) root.dataset.theme = saved;
  btn.addEventListener("click", () => { const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = cur === "dark" ? "light" : "dark"; write(key("scheme"), root.dataset.theme); });
}
// Colour is separate from theme: a hue override that layers on top of whichever full theme pack is active.
export function initHue(input, out) {
  const apply = (v) => { if (v === "") { root.style.removeProperty("--c-hue"); input.value = 255; } else root.style.setProperty("--c-hue", v);
    if (out) out.textContent = v === "" ? "pack" : v; write(key("hue"), v); };
  apply(read(key("hue")) ?? preferences.hue);
  input.addEventListener("input", () => apply(input.value));
  input.addEventListener("dblclick", () => apply(""));
}
