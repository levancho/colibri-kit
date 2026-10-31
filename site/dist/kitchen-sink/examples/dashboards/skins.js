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
export function setPack(id) { id ? (root.dataset.kitTheme = id) : delete root.dataset.kitTheme; localStorage.setItem("colibri-kit-theme", id); }
export function initPackPicker(select) {
  select.innerHTML = PACKS.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  const q = new URLSearchParams(location.search).get("theme");
  select.value = q ?? localStorage.getItem("colibri-kit-theme") ?? ""; if (!PACKS.some((p) => p.id === select.value)) select.value = "";
  setPack(select.value); select.addEventListener("change", () => setPack(select.value));
}
export function initScheme(btn) {
  const saved = localStorage.getItem("colibri-scheme"); if (saved) root.dataset.theme = saved;
  btn.addEventListener("click", () => { const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = cur === "dark" ? "light" : "dark"; localStorage.setItem("colibri-scheme", root.dataset.theme); });
}
// Colour is separate from theme: a hue override that layers on top of whichever full theme pack is active.
export function initHue(input, out) {
  const apply = (v) => { if (v === "") { root.style.removeProperty("--c-hue"); input.value = 255; } else root.style.setProperty("--c-hue", v);
    if (out) out.textContent = v === "" ? "pack" : v; localStorage.setItem("colibri-hue", v); };
  apply(localStorage.getItem("colibri-hue") ?? "");
  input.addEventListener("input", () => apply(input.value));
  input.addEventListener("dblclick", () => apply(""));
}
