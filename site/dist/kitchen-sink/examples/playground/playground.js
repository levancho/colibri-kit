// Colibri Themes Studio: every control writes attributes/tokens onto the preview iframe's <html>; export mirrors it.
import { highlightAll } from "../code-highlight.js";
const PACKS = [
  { id: "", name: "Colibri", note: "neutral default", bg: "#f4f4f5", card: "#fff", acc: "#18181b", r: "6px", sh: "0 1px 2px #0002" },
  { id: "glacier", name: "Glacier", note: "crisp · editorial", bg: "#eef3fb", card: "#fff", acc: "#2563eb", r: "3px", sh: "0 1px 1px #0f172a22" },
  { id: "ember", name: "Ember", note: "warm · soft · round", bg: "#fbf1e7", card: "#fffaf5", acc: "#ea580c", r: "10px", sh: "0 4px 10px -4px #9a341266" },
  { id: "midnight", name: "Midnight", note: "dark · neon · glass", bg: "#0b0d17", card: "#161a2c", acc: "#8b5cf6", r: "7px", sh: "0 0 0 1px #8b5cf655,0 6px 16px -6px #8b5cf6aa" },
];
const HUES = [["auto", null], ["Indigo", 265], ["Blue", 245], ["Cyan", 210], ["Teal", 180], ["Green", 150], ["Amber", 75], ["Orange", 45], ["Crimson", 15], ["Pink", 350], ["Plum", 320], ["Violet", 290], ["Iris", 275], ["Lime", 125], ["Gold", 90], ["Ruby", 5], ["Sky", 225], ["Mint", 165]];
const DEF = { pack: "glacier", hue: null, gray: "auto", scheme: "light", radius: "pack", scaling: "100", panel: "solid", font: "pack", motion: "pack", device: "desktop" };
let S = { ...DEF, ...JSON.parse(localStorage.getItem("colibri-studio") || "{}") };
try { const q = new URLSearchParams(location.hash.slice(1)); for (const k of Object.keys(DEF)) if (q.has(k)) S[k] = q.get(k) === "null" ? null : q.get(k); if (S.hue != null) S.hue = +S.hue; } catch {}
const $ = (s) => document.querySelector(s), pv = $("#pv");

// controls
$("#packs").innerHTML = PACKS.map((p) => `<button type="button" role="radio" class="pack" data-pack="${p.id}" style="--p-bg:${p.bg};--p-card:${p.card};--p-acc:${p.acc};--p-r:${p.r};--p-sh:${p.sh}"><div class="sw"><b></b><s></s></div><strong>${p.name}</strong><small>${p.note}</small></button>`).join("");
$("#hues").innerHTML = HUES.map(([n, h]) => `<button type="button" role="radio" class="${h == null ? "auto" : ""}" data-hue="${h ?? ""}" title="${n === "auto" ? "Pack default" : n}" aria-label="${n === "auto" ? "Pack default colour" : n}" style="--c:oklch(62% .17 ${h ?? 0})"></button>`).join("");
document.querySelectorAll(".seg[data-opts]").forEach((g) => { g.innerHTML = g.dataset.opts.split(",").map((o) => { const [v, l] = o.split(":"); return `<button type="button" role="radio" data-v="${v}">${l}</button>`; }).join(""); });
const set = (k, v) => { S[k] = v; save(); apply(); };
$("#packs").onclick = (e) => { const b = e.target.closest("[data-pack]"); if (b) set("pack", b.dataset.pack); };
$("#hues").onclick = (e) => { const b = e.target.closest("[data-hue]"); if (b) set("hue", b.dataset.hue === "" ? null : +b.dataset.hue); };
$("#hue").oninput = (e) => set("hue", +e.target.value);
document.querySelectorAll(".seg[data-k]").forEach((g) => (g.onclick = (e) => { const b = e.target.closest("[data-v]"); if (b) set(g.dataset.k, b.dataset.v); }));
$("#font").onchange = (e) => set("font", e.target.value);
$("#dev").onclick = (e) => { const b = e.target.closest("[data-d]"); if (b) set("device", b.dataset.d); };
$("#reset").onclick = () => { S = { ...DEF }; save(); apply(); };
$("#chrome").onclick = () => { const r = document.documentElement; r.dataset.chrome = r.dataset.chrome === "dark" ? "light" : "dark"; localStorage.setItem("colibri-studio-chrome", r.dataset.chrome); };
document.documentElement.dataset.chrome = localStorage.getItem("colibri-studio-chrome") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
$("#share").onclick = async () => { const q = new URLSearchParams(Object.entries(S).map(([k, v]) => [k, String(v)])); history.replaceState(null, "", "#" + q); await navigator.clipboard?.writeText(location.href).catch(() => {}); $("#share").textContent = "Link copied"; setTimeout(() => ($("#share").textContent = "Copy link"), 1400); };
let lang = "html";
document.querySelector(".ctabs").addEventListener("click", (e) => { const b = e.target.closest("[data-l]"); if (!b) return; lang = b.dataset.l; document.querySelectorAll(".ctabs [data-l]").forEach((x) => x.setAttribute("aria-selected", String(x === b))); renderCode(); });
$("#copy").onclick = async () => { await navigator.clipboard?.writeText($("#out code").textContent).catch(() => {}); $("#copy").textContent = "Copied"; setTimeout(() => ($("#copy").textContent = "Copy"), 1200); };
$("#toggle").onclick = () => { const c = $("#code"), o = c.dataset.open !== "true"; c.dataset.open = String(o); $("#toggle").textContent = o ? "Hide code" : "Show code"; $("#toggle").setAttribute("aria-expanded", String(o)); };
function save() { localStorage.setItem("colibri-studio", JSON.stringify(S)); }

// theme model → attributes + tokens
function model() {
  const dark = S.scheme === "dark" || (S.pack === "midnight" && S.scheme !== "light" && false);
  const attrs = { "data-theme": S.scheme };
  if (S.pack) attrs["data-kit-theme"] = S.pack;
  if (S.gray !== "auto") attrs["data-ui-gray"] = S.gray;
  if (S.scaling !== "100") attrs["data-ui-scaling"] = S.scaling;
  if (S.panel !== "solid") attrs["data-ui-panel"] = S.panel;
  if (S.motion === "off") attrs["data-ui-motion"] = "off";
  const tok = {};
  if (S.hue != null) { const h = S.hue; Object.assign(tok, { "--c-hue": h, "--ui-primary": dark ? `oklch(72% .15 ${h})` : `oklch(55% .19 ${h})`, "--ui-primary-foreground": dark ? `oklch(18% .03 ${h})` : "#fff", "--ui-ring": `oklch(70% .14 ${h})`, "--ui-accent": dark ? `oklch(28% .05 ${h})` : `oklch(96% .025 ${h})` }); }
  if (S.radius !== "pack") { const r = +S.radius; Object.assign(tok, { "--ui-radius": r + "px", "--ui-radius-sm": Math.max(0, Math.min(r, 999) - 2) + "px", "--ui-radius-lg": (r >= 999 ? 22 : r + 4) + "px" }); }
  if (S.font !== "pack") tok["--ui-font"] = S.font;
  if (S.motion === "calm") Object.assign(tok, { "--ui-motion-duration": "260ms", "--ui-motion-distance": "6px" });
  if (S.motion === "lively") Object.assign(tok, { "--ui-motion-duration": "420ms", "--ui-motion-distance": "18px", "--ui-motion-ease": "cubic-bezier(.34,1.56,.64,1)" });
  return { attrs, tok };
}
function apply() {
  const { attrs, tok } = model(), d = pv.contentDocument, r = d?.documentElement;
  if (r) {
    for (const a of ["data-theme", "data-kit-theme", "data-ui-gray", "data-ui-scaling", "data-ui-panel", "data-ui-motion"]) attrs[a] ? r.setAttribute(a, attrs[a]) : r.removeAttribute(a);
    r.removeAttribute("style"); for (const [k, v] of Object.entries(tok)) r.style.setProperty(k, String(v)); r.style.colorScheme = S.scheme;
    d.body.style.fontFamily = tok["--ui-font"] || "";
    d.querySelectorAll("[data-ui=segmented-control],[data-ui=tab-nav]").forEach((el) => el.dispatchEvent(new Event("resize")));
    pv.contentWindow.dispatchEvent(new Event("resize"));
  }
  // controls state
  document.querySelectorAll("[data-pack]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.pack === (S.pack || ""))));
  document.querySelectorAll("[data-hue]").forEach((b) => b.setAttribute("aria-checked", String((b.dataset.hue === "" ? null : +b.dataset.hue) === S.hue)));
  $("#hue").value = S.hue ?? 255; $("#hue-o").textContent = S.hue == null ? "pack default" : S.hue + "°";
  document.querySelectorAll(".seg[data-k]").forEach((g) => g.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.v === String(S[g.dataset.k])))));
  $("#font").value = S.font;
  document.querySelectorAll("#dev [data-d]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.d === S.device)));
  $("#frame").dataset.device = S.device;
  const p = PACKS.find((x) => x.id === (S.pack || ""));
  $("#sum").textContent = `${p.name} · ${S.hue == null ? "pack colour" : "hue " + S.hue + "°"} · ${S.scheme} · radius ${S.radius} · ${S.scaling}% · ${S.panel} · motion ${S.motion}`;
  renderCode();
}
const q = (v) => String(v).replace(/"/g, "&quot;");
function renderCode() {
  const { attrs, tok } = model();
  const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  const tokCss = Object.entries(tok).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  const styleAttr = Object.keys(tok).length ? ` style="${q(Object.entries(tok).map(([k, v]) => `${k}:${v}`).join(";"))}"` : "";
  const links = `  <link rel="stylesheet" href="/colibri/themes/colibri.css">\n  <link rel="stylesheet" href="/colibri/themes/packs/index.css">\n  <link rel="stylesheet" href="/colibri/themes/motion.css">\n  <script type="module" src="/colibri/src/core/auto.js"></script>`;
  const sample = `<div data-ui="card">\n  <div data-ui="segmented-control" data-default-value="week" aria-label="Range">\n    <button data-ui-part="item" data-value="day">Day</button>\n    <button data-ui-part="item" data-value="week">Week</button>\n  </div>\n  <button data-ui="button">Save</button>\n</div>`;
  let src;
  if (lang === "html") src = `<!doctype html>\n<html ${attrStr}${styleAttr}>\n<head>\n${links}\n</head>\n<body class="ui-root">\n${sample.replace(/^/gm, "  ")}\n</body>\n</html>`;
  else if (lang === "ftl") src = `[#-- Colibri theme settings (put in your layout macro) --]\n[#assign theme = {\n${Object.entries(attrs).map(([k, v]) => `  "${k}": "${v}"`).join(",\n")}\n}]\n[#assign tokens = "${Object.entries(tok).map(([k, v]) => `${k}:${v}`).join(";").replace(/"/g, "'")}"]\n<html[#list theme as k, v] ${"${k}"}="${"${v}"}"[/#list][#if tokens?has_content] style="${"${tokens}"}"[/#if]>\n<head>\n${links}\n</head>\n<body class="ui-root">\n${sample.replace(/^/gm, "  ")}\n</body>\n</html>`;
  else if (lang === "react") src = `import "@colibri-kit/ui/themes/colibri.css";\nimport "@colibri-kit/ui/themes/packs/index.css";\nimport { useEffect } from "react";\nimport { UI, Part } from "@colibri-kit/ui/react";\n\nconst THEME = ${JSON.stringify(attrs, null, 2).replace(/\n/g, "\n")};\nconst TOKENS = ${JSON.stringify(tok, null, 2)};\n\nexport function ColibriTheme({ children }) {\n  useEffect(() => {\n    const r = document.documentElement;\n    for (const [k, v] of Object.entries(THEME)) r.setAttribute(k, v);\n    for (const [k, v] of Object.entries(TOKENS)) r.style.setProperty(k, String(v));\n  }, []);\n  return children;\n}\n\nexport function Example() {\n  return (\n    <UI kind="card">\n      <UI kind="segmented-control" data-default-value="week" aria-label="Range">\n        <Part name="item" as="button" value="day">Day</Part>\n        <Part name="item" as="button" value="week">Week</Part>\n      </UI>\n      <button data-ui="button">Save</button>\n    </UI>\n  );\n}`;
  else src = `/* Colibri theme tokens — drop in after colibri.css */\n:root {\n${tokCss || "  /* pack defaults: nothing to override */"}\n}\n/* attributes on <html>: ${attrStr} */`;
  const out = $("#out"); out.dataset.lang = lang === "css" ? "css" : lang; out.innerHTML = "<pre><code></code></pre>"; out.querySelector("code").textContent = src; highlightAll(out);
}
pv.addEventListener("load", apply); apply();
