// Colibri Themes Studio shell: one state object drives the preview frame(s), the Studio chrome and the export.
import { highlightAll } from "../code-highlight.js";
const CS = window.ColibriStudio, { DEF, KEY, HUES } = CS;
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const PACKS = [
  { id: "", name: "Colibri", note: "neutral · balanced", what: "8px radius · inherited type · soft shadows · segmented tabs · open accordion",
    L: ["#f4f4f5", "#fff", "#18181b", "#e4e4e7", "#09090b", "6px", "0 1px 2px #0002"], D: ["#09090b", "#111114", "#fafafa", "#27272a", "#fafafa", "6px", "0 1px 2px #0008"] },
  { id: "glacier", name: "Glacier", note: "crisp · editorial", what: "6px radius · Inter · hairline borders · underline tabs · flat elevation · quick linear motion",
    L: ["#eef3fb", "#fff", "#2563eb", "#dfe6f0", "#0f172a", "3px", "0 1px 1px #0f172a22"], D: ["#0f1520", "#151c28", "#60a5fa", "#263042", "#e5ecf5", "3px", "0 1px 2px #0008"] },
  { id: "ember", name: "Ember", note: "warm · soft · round", what: "14px+ radius · humanist type · warm neutrals · pill tabs · cushioned shadows · springy motion",
    L: ["#fbf1e7", "#fffaf5", "#ea580c", "#f0dcc8", "#3b2416", "11px", "0 4px 10px -4px #9a341266"], D: ["#1c1410", "#261b15", "#fb923c", "#3d2c22", "#f6e7da", "11px", "0 4px 12px -4px #000a"] },
  { id: "midnight", name: "Midnight", note: "dark-first · neon · glass", dark: true, what: "10px radius · Space Grotesk + mono headings · luminous borders · glow · dark only",
    L: ["#0b0c1a", "#121429", "#a78bfa", "#262a4d", "#eceefe", "7px", "0 0 0 1px #8b5cf655,0 6px 16px -6px #8b5cf6aa"] },
];
PACKS[3].D = PACKS[3].L;
let S = CS.load(), past = [], future = [], device = localStorage.getItem("colibri-studio-device") || "desktop", split = localStorage.getItem("colibri-studio-split") === "1", view = localStorage.getItem("colibri-studio-view") || "showcase", lang = "css";
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
// ---------- build controls ----------
function packCards() {
  const dark = CS.resolveScheme({ ...S, pack: "" }) === "dark";
  $("#packs").innerHTML = PACKS.map((p) => { const [bg, card, acc, line, fg, r, sh] = dark ? p.D : p.L;
    return `<button type="button" role="radio" class="pack" data-pack="${p.id}" style="--p-bg:${bg};--p-card:${card};--p-acc:${acc};--p-line:${line};--p-fg:${fg};--p-r:${r};--p-sh:${sh}"><div class="sw"><b><i></i><i></i><i></i></b><s></s><u></u></div><strong>${p.name}${p.dark ? '<span class="tagd">dark</span>' : ""}</strong><small>${p.note}</small></button>`; }).join("");
}
$("#hues").innerHTML = `<button type="button" role="radio" class="auto" data-hue="" title="Pack default" aria-label="Pack default colour"></button>` + HUES.map(([n, h]) => `<button type="button" role="radio" data-hue="${h}" title="${n}" aria-label="${n}" style="--c:oklch(62% .17 ${h})"></button>`).join("").replace(/(<button[^>]*title="Blue"[^>]*><\/button>)$/, "$1");
$$(".seg[data-opts]").forEach((g) => { g.innerHTML = g.dataset.opts.split(",").map((o) => { const [v, l] = o.split(":"); return `<button type="button" role="radio" data-v="${v}">${l}</button>`; }).join(""); });
// ---------- state changes ----------
function set(patch, push = true) {
  const next = { ...S, ...patch };
  if (JSON.stringify(next) === JSON.stringify(S)) return;
  if (push) { past.push(S); if (past.length > 100) past.shift(); future = []; }
  S = next; save(); render();
}
let sliding = null; // sliders: one undo step per drag
function slide(patch) { if (!sliding) { past.push(S); future = []; sliding = true; } S = { ...S, ...patch }; save(); render(); }
addEventListener("pointerup", () => (sliding = null)); addEventListener("keyup", () => (sliding = null));
$("#packs").onclick = (e) => { const b = e.target.closest("[data-pack]"); if (b) set({ pack: b.dataset.pack }); };
$("#hues").onclick = (e) => { const b = e.target.closest("[data-hue]"); if (b) set({ hue: b.dataset.hue === "" ? null : +b.dataset.hue }); };
$("#hue").oninput = (e) => slide({ hue: +e.target.value });
$("#chroma").oninput = (e) => slide({ chroma: +e.target.value, hue: S.hue ?? +$("#hue").value });
$("#tscale").oninput = (e) => slide({ tscale: +e.target.value });
$$(".seg[data-k]").forEach((g) => (g.onclick = (e) => { const b = e.target.closest("[data-v]"); if (b && !b.disabled) set({ [g.dataset.k]: b.dataset.v }); }));
$$("select[data-k]").forEach((s) => (s.onchange = () => set({ [s.dataset.k]: s.value })));
const toggleMode = () => set({ scheme: CS.resolveScheme(S) === "dark" ? "light" : "dark" });
$("#mode").onclick = () => { if (CS.DARK_ONLY[S.pack]) return toast("Midnight is dark-only: pick another pack for light mode"); toggleMode(); };
$("#reset").onclick = () => set({ ...DEF });
$("#undo").onclick = () => { if (!past.length) return toast("Nothing to undo"); future.push(S); S = past.pop(); save(); render(); };
$("#redo").onclick = () => { if (!future.length) return toast("Nothing to redo"); past.push(S); S = future.pop(); save(); render(); };
$("#surprise").onclick = () => { const pick = (a) => a[Math.floor(Math.random() * a.length)];
  set({ pack: pick(PACKS).id, hue: pick([null, ...HUES.map((h) => h[1])]), chroma: pick([0.1, 0.14, 0.17, 0.2, 0.24]), gray: pick(["auto", "slate", "sage", "sand", "mauve"]), radius: pick(["pack", "3", "6", "10", "16", "999"]),
    btn: pick(["pack", "solid", "soft", "classic", "surface"]), acc: pick(["pack", "fat", "boxed", "skinny"]), tabs: pick(["pack", "underline", "pill", "segmented"]), card: pick(["pack", "surface", "outline", "elevated"]), shadow: pick(["subtle", "pack", "deep"]), hfont: pick(["pack", "inter", "grotesk", "serif", "round"]) }); };
$("#panel").onclick = () => { const w = $("#wrap"); w.dataset.panel = w.dataset.panel === "off" ? "on" : "off"; };
// ---------- preview frames ----------
const pvA = $("#pvA"), pvB = $("#pvB");
const opposite = () => (CS.resolveScheme(S) === "dark" ? "light" : "dark");
function push(fr, force) { try { fr.contentWindow?.studioSet?.(S, force); } catch (e) {} }
function pushAll() { push(pvA, null); if (split) push(pvB, CS.DARK_ONLY[S.pack] ? null : opposite()); }
pvA.addEventListener("load", () => { push(pvA, null); pvA.contentWindow.studioView?.(view); });
pvB.addEventListener("load", () => { pushAll(); pvB.contentWindow.studioView?.(view); });
addEventListener("message", (e) => { if (e.data?.studio === "ready") { pushAll(); for (const f of [pvA, pvB]) if (e.source === f.contentWindow) f.contentWindow.studioView?.(view); } });
function setSplit(on) { split = on; localStorage.setItem("colibri-studio-split", on ? "1" : "0"); $("#fB").hidden = !on; $("#split").setAttribute("aria-pressed", String(on)); if (on && !pvB.getAttribute("src")) pvB.src = `preview.html?view=${view}&scheme=${opposite()}`; render(); }
$("#split").onclick = () => setSplit(!split);
$("#views").onclick = (e) => { const b = e.target.closest("[data-v]"); if (b) setView(b.dataset.v); };
function setView(v) { view = v; localStorage.setItem("colibri-studio-view", v); $$("#views [data-v]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v))); for (const f of [pvA, pvB]) try { f.contentWindow?.studioView?.(v); } catch (e) {} }
$("#dev").onclick = (e) => { const b = e.target.closest("[data-d]"); if (!b) return; device = b.dataset.d; localStorage.setItem("colibri-studio-device", device); render(); };
// ---------- render ----------
function render() {
  const scheme = CS.resolveScheme(S), r = document.documentElement, dark = !!CS.DARK_ONLY[S.pack];
  r.dataset.chrome = scheme; r.style.colorScheme = scheme; // Studio chrome follows the theme's appearance
  packCards();
  $$("#packs [data-pack]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.pack === (S.pack || ""))));
  const p = PACKS.find((x) => x.id === (S.pack || ""));
  $("#packnote").innerHTML = `<b>${p.name}</b>: ${p.what}`;
  $$("#hues [data-hue]").forEach((b) => b.setAttribute("aria-checked", String((b.dataset.hue === "" ? null : +b.dataset.hue) === (S.hue == null ? null : +S.hue))));
  $("#hue").value = S.hue ?? 255; $("#hue-o").textContent = S.hue == null ? "pack" : S.hue + "°";
  $("#chroma").value = S.chroma; $("#chroma-o").textContent = S.hue == null ? "pack" : (+S.chroma).toFixed(2);
  $("#tscale").value = S.tscale; $("#tscale-o").textContent = S.tscale + "%";
  $$(".seg[data-k]").forEach((g) => g.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.v === String(g.dataset.k === "scheme" && dark ? "dark" : S[g.dataset.k])))));
  $$("#scheme [data-v]").forEach((b) => (b.disabled = dark && b.dataset.v !== "dark"));
  $("#schemenote").innerHTML = dark ? "<b>Midnight</b> is a dark-only pack, so Light and System are locked. Your light/dark choice is kept for other packs." : S.scheme === "system" ? `Following your OS: currently <b>${scheme}</b>.` : "";
  $$("select[data-k]").forEach((s) => (s.value = S[s.dataset.k]));
  $$("#dev [data-d]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.d === device)));
  $("#frames").dataset.device = device;
  $("#tagA").textContent = split ? scheme : ""; $("#tagB").textContent = split ? (dark ? "dark (pack is dark-only)" : opposite()) : "";
  const look = ["btn", "acc", "tabs", "card", "input"].filter((k) => S[k] !== "pack").map((k) => `${k} ${S[k]}`);
  $("#sum").textContent = [p.name, S.hue == null ? "pack colour" : `${(HUES.find((h) => h[1] === +S.hue) || ["hue"])[0]} ${S.hue}°`, scheme, S.radius === "pack" ? "pack radius" : `r ${S.radius}`, `${S.scaling}%`, ...look].join(" · ");
  pushAll(); renderMine(); renderCode();
}
// ---------- export ----------
function cssFor() {
  const L = CS.model({ ...S, __force: "light" }), D = CS.model({ ...S, __force: "dark" }), cur = CS.model(S);
  const common = {}, dl = {}, dd = {};
  for (const k of new Set([...Object.keys(L.tok), ...Object.keys(D.tok)])) { if (L.tok[k] === D.tok[k]) common[k] = L.tok[k]; else { if (k in L.tok) dl[k] = L.tok[k]; if (k in D.tok) dd[k] = D.tok[k]; } }
  const blk = (sel, o) => (Object.keys(o).length ? `${sel} {\n${Object.entries(o).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n` : "");
  const attrs = Object.entries(cur.attrs).filter(([k]) => k !== "data-theme").map(([k, v]) => `${k}="${v}"`).join(" ");
  const scale = (n, v) => [3, 6, 10, 15, 21, 29, 40, 58, 100].map((p, i) => `  --${n}-${i + 1}: color-mix(in oklab, var(${v}) ${p}%, var(--ui-background));`).concat([88, 62, 25].map((p, i) => `  --${n}-${i + 10}: color-mix(in oklab, var(${v}) ${p}%, var(--ui-foreground));`)).join("\n");
  let css = `/* Colibri theme, made in Colibri Themes Studio (colibri.l3v.ai/studio)\n   Load: themes/colibri.css, themes/packs/index.css, themes/motion.css, themes/knobs.css\n   <html ${attrs || "(no extra attributes)"} data-theme="light|dark">${CS.DARK_ONLY[S.pack] ? "  (Midnight is dark-only)" : ""} */\n`;
  css += blk(":root", common) + blk('html[data-theme="light"]', dl) + blk('html[data-theme="dark"]', dd);
  if (!Object.keys(common).length && !Object.keys(dl).length && !Object.keys(dd).length) css += "/* pack defaults: no token overrides */\n";
  if (S.hfont !== "pack" || S.hweight !== "pack") css += `:where(.ui-root) :is(h1, h2, h3, h4) {${S.hfont !== "pack" ? `\n  font-family: ${CS.FONTS[S.hfont]};` : ""}${S.hweight !== "pack" ? `\n  font-weight: ${S.hweight};` : ""}\n}\n`;
  css += `/* 12-step scales that follow pack, hue and appearance */\n:root {\n${scale("accent", "--ui-primary")}\n${scale("gray", "--ui-muted-foreground")}\n}\n`;
  return { css, attrs: cur.attrs };
}
function renderCode() {
  const { css, attrs } = cssFor();
  const at = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  const links = `  <link rel="stylesheet" href="/colibri/themes/colibri.css">\n  <link rel="stylesheet" href="/colibri/themes/packs/index.css">\n  <link rel="stylesheet" href="/colibri/themes/motion.css">\n  <link rel="stylesheet" href="/colibri/themes/knobs.css">\n  <link rel="stylesheet" href="/colibri-theme.css"> <!-- the CSS tab -->\n  <script type="module" src="/colibri/src/core/auto.js"></script>`;
  const body = `<body class="ui-root">\n  <div data-ui="card">\n    <h2>Hello</h2>\n    <button data-ui="button">Save</button>\n    <button data-ui="button" data-look="soft">Later</button>\n  </div>\n</body>`;
  const src = lang === "css" ? css
    : lang === "html" ? `<!doctype html>\n<html ${at}>\n<head>\n${links}\n</head>\n${body}\n</html>`
    : lang === "ftl" ? `[#-- Colibri theme: attributes for <html>; colibri-theme.css holds the tokens --]\n[#assign colibriTheme = {\n${Object.entries(attrs).map(([k, v]) => `  "${k}": "${k === "data-theme" ? '${(user.theme)!"' + v + '"}' : v}"`).join(",\n")}\n}]\n<html[#list colibriTheme as k, v] ${"${k}"}="${"${v}"}"[/#list]>\n<head>\n${links}\n</head>\n${body}\n</html>`
    : lang === "react" ? `import "@colibri-kit/ui/themes/colibri.css";\nimport "@colibri-kit/ui/themes/packs/index.css";\nimport "@colibri-kit/ui/themes/knobs.css";\nimport "./colibri-theme.css"; // the CSS tab\nimport { useLayoutEffect } from "react";\n\nconst THEME = ${JSON.stringify(attrs, null, 2)};\n\nexport function ColibriTheme({ scheme, children }) {\n  useLayoutEffect(() => {\n    const r = document.documentElement;\n    for (const [k, v] of Object.entries(THEME)) r.setAttribute(k, v);\n    if (scheme) r.setAttribute("data-theme", scheme);\n  }, [scheme]);\n  return children;\n}`
    : JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k]) => !k.startsWith("__"))), null, 2);
  const out = $("#out"); out.dataset.lang = lang === "json" ? "js" : lang; out.innerHTML = "<pre><code></code></pre>"; out.querySelector("code").textContent = src;
  if ($("#code").dataset.open === "true") highlightAll(out);
  return src;
}
document.querySelector(".ctabs").addEventListener("click", (e) => { const b = e.target.closest("[data-l]"); if (!b) return; lang = b.dataset.l; $$(".ctabs [data-l]").forEach((x) => x.setAttribute("aria-selected", String(x === b))); if ($("#code").dataset.open !== "true") openCode(true); renderCode(); });
function openCode(o) { const c = $("#code"); c.dataset.open = String(o); $("#toggle").setAttribute("aria-expanded", String(o)); $("#toggle").setAttribute("aria-label", o ? "Hide code" : "Show code"); renderCode(); }
$("#toggle").onclick = () => openCode($("#code").dataset.open !== "true");
$("#copy").onclick = async () => { await navigator.clipboard?.writeText(renderCode()).catch(() => {}); toast(`${lang.toUpperCase()} copied`); };
$("#dl").onclick = () => { const ext = { css: "css", html: "html", ftl: "ftlh", react: "jsx", json: "json" }[lang]; const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([renderCode()], { type: "text/plain" })), download: `colibri-theme.${ext}` }); a.click(); };
$("#share").onclick = async () => { const q = new URLSearchParams(Object.entries(S).filter(([k]) => !k.startsWith("__")).map(([k, v]) => [k, String(v)])); history.replaceState(null, "", "#" + q); await navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Share link copied"); };
// ---------- my themes ----------
const MINE = "colibri-studio-mine";
const mine = () => { try { return JSON.parse(localStorage.getItem(MINE) || "[]"); } catch { return []; } };
function renderMine() { $("#mine").innerHTML = mine().map((t, i) => `<div><i style="--c:${t.s.hue == null ? "conic-gradient(#e64980,#f59f00,#40c057,#22b8cf,#3b5bdb)" : `oklch(62% .17 ${t.s.hue})`}"></i><button type="button" class="ld" data-i="${i}">${t.name.replace(/</g, "&lt;")}</button><button type="button" class="x" data-x="${i}" aria-label="Delete ${t.name.replace(/"/g, "")}">✕</button></div>`).join(""); }
$("#mine").onclick = (e) => { const l = e.target.closest("[data-i]"), x = e.target.closest("[data-x]"); const m = mine();
  if (l) set({ ...DEF, ...m[+l.dataset.i].s }); if (x) { m.splice(+x.dataset.x, 1); localStorage.setItem(MINE, JSON.stringify(m)); renderMine(); } };
$("#save").onclick = () => { const p = PACKS.find((x) => x.id === (S.pack || "")); const name = prompt("Name this theme", `${p.name}${S.hue != null ? " · " + S.hue + "°" : ""}`); if (!name) return; const m = mine(); m.unshift({ name, s: { ...S } }); localStorage.setItem(MINE, JSON.stringify(m.slice(0, 24))); renderMine(); toast("Saved"); };
$("#import").onclick = () => { const t = prompt("Paste theme JSON (from the JSON export tab)"); if (!t) return; try { const o = JSON.parse(t); const clean = Object.fromEntries(Object.entries(o).filter(([k]) => k in DEF)); set({ ...DEF, ...clean }); toast("Theme imported"); } catch { toast("That is not valid theme JSON"); } };
// ---------- keyboard ----------
addEventListener("keydown", (e) => {
  if (e.target.closest("input:not([type=range]),select,textarea")) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); (e.shiftKey ? $("#redo") : $("#undo")).click(); return; }
  if (mod || e.altKey) return;
  if (e.key === "d" || e.key === "D") $("#mode").click();
  else if (e.key === "t" || e.key === "T") $("#panel").click();
  else if ("1234".includes(e.key)) setView(["showcase", "components", "type", "palette"][+e.key - 1]);
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => S.scheme === "system" && render());
addEventListener("storage", (e) => { if (e.key === KEY) { S = CS.load(); render(); } }); // keep two Studio tabs in sync
let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 1500); }
setView(view); setSplit(split); render();
