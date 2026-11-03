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
export function setPack(id) { preferences.apply?.(id,true); }
export function initPackPicker(select) {
  const {custom,customId}=preferences;
  const packs=custom?[...PACKS,{id:customId,name:(custom.name||'Colibria palette')+' (saved)'}]:PACKS;
  select.replaceChildren(...packs.map(p=>new Option(p.name,p.id)));
  select.value=preferences.pack;
  select.addEventListener('change',()=>setPack(select.value));
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
  input.value=read(key("hue"))||preferences.hue||255;
  if(out)out.textContent=input.value;
  input.addEventListener("input", () => apply(input.value));
  input.addEventListener("dblclick", () => apply(""));
}
