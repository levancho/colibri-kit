// Widget builder page. The preview is a real <colibri-widget> (from /widgets/embed.js), so what you see is what ships.
import { WIDGETS, LOOK, normalize, compact, defaults, embedSnippet, htmlSnippet } from "./render.js";

const $ = (selector, root = document) => root.querySelector(selector);
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  badge: '<rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="7.5" cy="12" r="1.6"/><path d="M12 12h5"/>',
  cta: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h8M7 12.5h5"/><rect x="7" y="15" width="6" height="2.5" rx="1.2"/>',
  announce: '<path d="M4 10v4l10 4V6L4 10Z"/><path d="M14 9.5a3 3 0 0 1 0 5M7 14.5V18"/>',
  newsletter: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 8 8 5.5L20 8"/>',
  pricing: '<path d="M12 3v18M16 7.5c-.6-1.2-2-2-4-2-2.3 0-4 1.2-4 3 0 4 8.5 2 8.5 6.2 0 1.8-1.9 3-4.5 3-2.2 0-3.8-.9-4.5-2.3"/>',
  testimonial: '<path d="M4 6h16v10H10l-4 3.5V16H4V6Z"/><path d="M8 10h8M8 12.8h5"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2 1-1.2 1.8M12 16.8v.2"/>',
  stats: '<path d="M4 20V11M10 20V4M16 20v-7M21 20H3"/>',
  links: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
};
const SWATCHES = [250, 285, 330, 15, 45, 150, 190, 220];
const NOTES = {
  embed: "Paste this where the widget should appear. It draws in its own sandbox, so it looks the same on every site. Works anywhere you can add HTML.",
  html: "Plain markup and a small style block, no script. Use it on pages that already load Colibri CSS; on other sites, use the embed code.",
};

// ---------------------------------------------------------------- state: one look, one content draft per widget
const encode = (config) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(compact(config))))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (text) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))));
function initial() {
  const hash = location.hash.slice(1);
  if (Object.hasOwn(WIDGETS, hash)) return normalize({ t: hash }); // /widgets/#badge opens that widget
  try { if (hash) return normalize(decode(hash)); } catch { /* a damaged link falls back to the default */ }
  return normalize({ t: "cta" });
}
let state = initial(), mode = "embed";
const drafts = { [state.t]: state.d };

const preview = $("#wb-preview"), fields = $("#wb-fields"), types = $("#wb-types"), status = $("#wb-status");
let hashTimer;
function update() {
  preview.setAttribute("config", JSON.stringify(compact(state)));
  $("#wb-snippet").textContent = mode === "embed" ? embedSnippet(state) : htmlSnippet(state);
  $("#wb-note").textContent = NOTES[mode];
  $("#wb-hue").value = state.hue;
  $("#wb-form").style.setProperty("--wb-hue", state.hue);
  $("#wb-width-field").hidden = state.t === "badge";
  for (const group of document.querySelectorAll(".wb-seg[data-key]")) press(group, state[group.dataset.key]);
  for (const button of types.children) button.setAttribute("aria-pressed", String(button.dataset.value === state.t));
  for (const swatch of $("#wb-swatches").children) swatch.setAttribute("aria-pressed", String(+swatch.dataset.hue === state.hue));
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => history.replaceState(null, "", "#" + encode(state)), 250);
}
function press(group, value) { for (const button of group.children) button.setAttribute("aria-pressed", String(button.dataset.value === value)); }

// ---------------------------------------------------------------- step 1: widget types
for (const [type, widget] of Object.entries(WIDGETS)) {
  const button = el("button", { type: "button", className: "wb-type", innerHTML: icon(ICONS[type]) }, el("span", { textContent: widget.label }));
  button.dataset.value = type;
  types.append(button);
}
types.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.dataset.value === state.t) return;
  drafts[state.t] = state.d;
  state = normalize({ ...state, t: button.dataset.value, d: drafts[button.dataset.value] });
  buildFields(); update();
});

// ---------------------------------------------------------------- step 2: content fields for the chosen widget
function buildFields() {
  $("#wb-blurb").textContent = WIDGETS[state.t].blurb;
  fields.replaceChildren(...WIDGETS[state.t].fields.map((field) => {
    const id = "wb-f-" + field.key;
    let input;
    if (field.type === "select") input = el("select", { id }, ...field.options.map(([value, label]) => el("option", { value, textContent: label })));
    else if (field.type === "textarea") input = el("textarea", { id, rows: field.rows ?? 3 });
    else input = el("input", { id, type: field.type === "url" ? "url" : "text", inputMode: field.type === "url" ? "url" : "text" });
    input.value = state.d[field.key];
    input.dataset.field = field.key;
    const wrap = el("div", { className: "field" }, el("label", { htmlFor: id, textContent: field.label }), input);
    if (field.hint) wrap.append(el("span", { className: "hint", textContent: field.hint }));
    return wrap;
  }));
}
fields.addEventListener("input", (event) => {
  const key = event.target.dataset.field;
  if (!key) return;
  state = normalize({ ...state, d: { ...state.d, [key]: event.target.value } });
  update();
});

// ---------------------------------------------------------------- step 3: look
for (const hue of SWATCHES) {
  const swatch = el("button", { type: "button", className: "wb-swatch" });
  swatch.dataset.hue = hue; swatch.style.setProperty("--h", hue); swatch.setAttribute("aria-label", `Hue ${hue}`);
  $("#wb-swatches").append(swatch);
}
$("#wb-swatches").addEventListener("click", (event) => { const hue = event.target.closest("button")?.dataset.hue; if (hue) { state = normalize({ ...state, hue }); update(); } });
$("#wb-hue").addEventListener("input", (event) => { state = normalize({ ...state, hue: event.target.value }); update(); });
$("#wb-form").addEventListener("click", (event) => {
  const button = event.target.closest(".wb-seg[data-key] button");
  if (button) { state = normalize({ ...state, [button.parentElement.dataset.key]: button.dataset.value }); update(); }
});
$("#wb-form").addEventListener("submit", (event) => event.preventDefault());
$("#wb-shuffle").addEventListener("click", () => {
  const any = (list) => list[Math.floor(Math.random() * list.length)];
  state = normalize({ ...state, hue: Math.floor(Math.random() * 360), radius: any(["sharp", "soft", "round"]), theme: any(["auto", "light", "dark"]) });
  update();
});
$("#wb-reset").addEventListener("click", () => {
  for (const key of Object.keys(drafts)) delete drafts[key];
  state = normalize({ ...LOOK, t: state.t, d: defaults(state.t) });
  buildFields(); update();
});

// ---------------------------------------------------------------- preview stage and code
const stage = $("#wb-stage");
stage.addEventListener("click", (event) => {
  const button = event.target.closest(".wb-seg[data-stage] button");
  if (!button) return;
  stage.dataset[button.parentElement.dataset.stage] = button.dataset.value;
  press(button.parentElement, button.dataset.value);
});
for (const group of stage.querySelectorAll(".wb-seg[data-stage]")) press(group, stage.dataset[group.dataset.stage]);
$("#wb-mode").addEventListener("click", (event) => { const value = event.target.closest("button")?.dataset.value; if (value) { mode = value; press($("#wb-mode"), mode); update(); } });
press($("#wb-mode"), mode);

async function copy(text, button, done) {
  try { await navigator.clipboard.writeText(text); }
  catch { // older browsers and non-secure origins
    const area = el("textarea", { value: text }); area.setAttribute("readonly", ""); area.className = "visually-hidden";
    document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
  }
  const label = button.textContent;
  button.textContent = "Copied ✓"; status.textContent = done;
  setTimeout(() => { button.textContent = label; status.textContent = ""; }, 1800);
}
$("#wb-copy").addEventListener("click", (event) => copy($("#wb-snippet").textContent, event.currentTarget, "Code copied. Paste it into your page."));
$("#wb-share").addEventListener("click", (event) => copy(location.origin + location.pathname + "#" + encode(state), event.currentTarget, "Link copied."));

// Dark-mode toggle in the site header (same storage key as the rest of the site).
$("#theme")?.addEventListener("click", () => {
  const root = document.documentElement, dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("colibri.kit.theme", root.dataset.theme); } catch { /* private mode */ }
});

buildFields(); update();
document.documentElement.dataset.wbReady = "";
