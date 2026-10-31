// Colibri Themes Studio preview: builds Radix-style component matrices, a type specimen and a palette/contrast audit,
// then boots Colibri UI. The Studio shell drives it through window.studioSet(state) / window.studioView(view).
const CS = window.ColibriStudio, root = document.documentElement;
let S = CS.load(); const force = new URLSearchParams(location.search).get("scheme"); if (force) S.__force = force;
const HUES = CS.HUES;
const NAMED = { accent: null, gray: "gray", red: 27, green: 150, amber: 80 };
const col = (k) => (k === "accent" ? "" : k === "gray" ? ' data-tone="gray"' : ` data-hue="${typeof k === "number" ? k : NAMED[k]}"`);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// ---------- matrix helpers ----------
function table(cols, rows, cell, first = 110) {
  let h = `<div class="tbl" style="grid-template-columns:${first}px repeat(${cols.length},minmax(max-content,1fr))"><span></span>${cols.map((c) => `<span class="h">${c.label ?? c}</span>`).join("")}`;
  for (const r of rows) { h += `<span class="rh">${r.label ?? r}</span>`; for (const c of cols) h += `<div class="c">${cell(r.v ?? r, c.v ?? c)}</div>`; }
  return h + "</div>";
}
const hueRows = HUES.map(([n, h]) => ({ label: n, v: h }));
const sections = [];
function sec(id, title, lede, tabs) { sections.push({ id, title, lede, tabs }); }
const BTN = ["solid", "soft", "surface", "outline", "classic", "ghost"];
const btn = (look, c, extra = "", label = "Next →") => `<button data-ui="button" data-look="${look}"${col(c)}${extra}>${label}</button>`;
sec("button", "Button", "Six looks, any accent, five sizes. Global default comes from the Buttons knob; data-look overrides per element.", {
  "Theme colors": table(["Accent", "Gray", "Red", "Disabled", "Loading"], BTN, (l, c) => c === "Disabled" ? btn(l, "accent", " disabled") : c === "Loading" ? btn(l, "accent", " data-loading", "Saving") : btn(l, c.toLowerCase())),
  "All colors": table(BTN, hueRows, (h, l) => btn(l, h, "", "Next")),
  "All sizes": table(BTN, ["xs", "sm", "md", "lg", "xl"], (s, l) => btn(l, "accent", ` data-size="${s}"`)),
});
const BDG = ["solid", "soft", "surface", "outline"];
const badge = (l, c, x = "", t = "New") => `<span data-ui="badge" data-look="${l}"${col(c)}${x}>${t}</span>`;
sec("badge", "Badge", "Status chips in four looks.", {
  "Theme colors": table(["Accent", "Gray", "Red", "Green", "Amber"], BDG, (l, c) => badge(l, c.toLowerCase())),
  "All colors": table(BDG, hueRows, (h, l) => badge(l, h, "", HUES.find((x) => x[1] === h)[0])),
  "All sizes": table(BDG, ["sm", "md", "lg"], (s, l) => badge(l, "accent", ` data-size="${s}"`)),
});
const ico = '<span data-ui-part="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg></span>';
sec("callout", "Callout", "Inline notes, tinted by any accent.", {
  "Theme colors": table(["Accent", "Gray", "Red", "Green"], ["soft", "surface", "outline"], (l, c) => `<div data-ui="callout" data-look="${l}"${col(c.toLowerCase())} role="note">${ico}<p>Your trial ends in 3 days.</p></div>`),
});
const chk = (on, c, x = "") => `<button data-ui="checkbox" aria-checked="${on}" aria-label="Check"${col(c)}${x}></button>`;
const sw = (on, c, x = "") => `<button data-ui="switch" aria-checked="${on}" aria-label="Switch"${col(c)}${x}></button>`;
const rad = (on, c, x = "") => `<div data-ui="radio-group" data-default-value="${on ? "a" : ""}" aria-label="Radio"${col(c)}><button data-ui-part="item" data-value="a"${x}>Option</button></div>`;
const SEL = { checkbox: chk, switch: sw, radio: rad };
sec("selection", "Checkbox · Switch · Radio", "Selection controls follow the accent and the radius dial.", {
  "Theme colors": table(["Accent on", "Accent off", "Gray on", "Red on", "Disabled"], ["checkbox", "switch", "radio"], (k, c) => {
    const f = SEL[k]; return c === "Accent on" ? f(true, "accent") : c === "Accent off" ? f(false, "accent") : c === "Gray on" ? f(true, "gray") : c === "Red on" ? f(true, "red") : f(true, "accent", " disabled"); }),
  "All colors": table(["checkbox", "switch", "radio", "slider", "progress"], hueRows, (h, k) => k === "slider" ? slider(h, 55) : k === "progress" ? prog(h, 70) : SEL[k](true, h)),
});
const INL = ["surface", "soft", "underline"];
sec("textfield", "Text field · Select · Textarea", "Three input looks; focus ring follows the Focus dial.", {
  "States": table(["Default", "Filled", "Disabled", "Invalid", "Select"], INL, (l, c) => c === "Default" ? `<input data-look="${l}" placeholder="Search…">` : c === "Filled" ? `<input data-look="${l}" value="nino@northwind.io">` : c === "Disabled" ? `<input data-look="${l}" value="Read only" disabled>` : c === "Invalid" ? `<input data-look="${l}" value="nino@" aria-invalid="true">` : `<select data-look="${l}"><option>Designer</option><option>Engineer</option></select>`),
  "Textarea": table(["Textarea"], INL, (l) => `<textarea data-look="${l}">Reply to comment…</textarea>`),
});
function slider(c, v) { return `<div data-ui="slider" data-min="0" data-max="100" data-value="${v}"${col(c)}><div data-ui-part="track"><div data-ui-part="range"></div></div><span data-ui-part="thumb" aria-label="Value"></span></div>`; }
function prog(c, v, x = "") { return `<div data-ui="progress" data-value="${v}" aria-label="Progress"${col(c)}${x}><div data-ui-part="indicator"></div></div>`; }
sec("range", "Slider · Progress", "Track, range and indicator take the accent.", {
  "Theme colors": table(["Accent", "Gray", "Red", "Green"], ["slider", "progress"], (k, c) => k === "slider" ? slider(c.toLowerCase(), 45) : prog(c.toLowerCase(), 65)),
  "All sizes": table(["2px", "4px", "8px", "12px"], ["progress"], (k, c) => prog("accent", 60, ` style="height:${c}"`)),
});
let tabn = 0;
const tabs = (look) => { const n = ++tabn; return `<div data-ui="tabs" data-look="${look}" data-default-value="a${n}"><div data-ui-part="list" aria-label="Tabs"><button data-ui-part="trigger" data-value="a${n}">Account</button><button data-ui-part="trigger" data-value="b${n}">Documents</button><button data-ui-part="trigger" data-value="c${n}">Settings</button></div><div data-ui-part="panel" data-value="a${n}"><small class="muted">Make changes to your account.</small></div><div data-ui-part="panel" data-value="b${n}"><small class="muted">Access your documents.</small></div><div data-ui-part="panel" data-value="c${n}"><small class="muted">Edit preferences.</small></div></div>`; };
const tnav = (look) => `<nav data-ui="tab-nav" data-look="${look}" aria-label="Nav"><a data-ui-part="link" href="#" aria-current="page">Overview</a><a data-ui-part="link" href="#">Activity</a><a data-ui-part="link" href="#">Team</a></nav>`;
sec("tabs", "Tabs · Tab nav", "Underline, pill or segmented. The pack decides the default; the Tabs knob overrides it.", {
  "Looks": table(["Tabs", "Tab nav"], ["underline", "pill", "segmented"], (l, c) => (c === "Tabs" ? tabs(l) : tnav(l)), 100),
  "All colors": table(["Pill", "Underline"], hueRows.slice(0, 8), (h, c) => `<div${col(h)}>${tnav(c.toLowerCase())}</div>`),
});
const acc = (look) => { const n = ++tabn; return `<div data-ui="accordion" data-look="${look}" data-type="single" data-default-value="x${n}"><div data-ui-part="item" data-value="x${n}"><h3><button data-ui-part="trigger">Is it accessible?</button></h3><div data-ui-part="content">Yes. WAI-ARIA accordion pattern, keyboard and screen-reader ready.</div></div><div data-ui-part="item" data-value="y${n}"><h3><button data-ui-part="trigger">Is it themeable?</button></h3><div data-ui-part="content">Every value is a token.</div></div></div>`; };
sec("accordion", "Accordion", "Fat (spacious cards), boxed (one sheet), skinny (dense rows), or whatever the pack defines.", {
  "Looks": `<div class="tbl" style="grid-template-columns:repeat(3,minmax(max-content,1fr))">${["fat", "boxed", "skinny"].map((l) => `<span class="h">${cap(l)}</span>`).join("")}${["fat", "boxed", "skinny"].map((l) => `<div class="c">${acc(l)}</div>`).join("")}</div>`,
});
const person = (i) => `<div class="person"><span data-ui="avatar"${col(["accent", 27, 150, 80][i % 4])}><span data-ui-part="fallback">${["EA", "TG", "AW", "JK"][i % 4]}</span></span><span><b>${["Emily Adams", "Teodros Girmay", "Aisha Wright", "Jasper Kim"][i % 4]}</b><small>emily.adams@example.com</small></span></div>`;
const CARD = ["surface", "outline", "elevated", "ghost", "glass"];
sec("card", "Card", "Five card looks. Glass shows best with the Translucent panel dial.", {
  "Looks": table(CARD, ["1", "2", "3"].map((s) => ({ label: "Size " + s, v: s })), (s, l) => `<div data-ui="card" data-look="${l}" style="padding:${[10, 14, 20][s - 1]}px">${person(+s)}</div>`, 60),
});
sec("avatar", "Avatar", "Fallback initials in solid accent; sizes via inline size.", {
  "Theme colors": table(["Accent", "Gray", "Red", "Green", "Amber"], ["24", "32", "40", "56"].map((s) => ({ label: s + "px", v: s })), (s, c) => `<span data-ui="avatar"${col(c.toLowerCase())} style="width:${s}px;height:${s}px;font-size:${s * .38}px"><span data-ui-part="fallback">NB</span></span>`, 60),
});
sec("overlay", "Dialog · Tooltip · Data list", "Overlays use the popover surface, radius-lg and the deep shadow.", {
  "Demo": `<div class="row" style="gap:14px;padding:8px 0 16px"><div data-ui="dialog"><button data-ui="button" data-ui-part="trigger">Open dialog</button><dialog data-ui-part="content"><h2 data-ui-part="title">Revoke access</h2><p data-ui-part="description" class="muted">This application will no longer be accessible.</p><form method="dialog" class="row" style="justify-content:flex-end"><button data-ui="button" data-look="soft" data-tone="gray" value="c">Cancel</button><button data-ui="button" data-hue="27" value="r">Revoke</button></form></dialog></div>
  <div data-ui="tooltip" data-side="top" data-delay="100"><button data-ui="button" data-look="outline" data-ui-part="trigger">Hover me</button><div data-ui-part="content">Tooltip on the accent</div></div>
  <dl data-ui="data-list"><dt>Status</dt><dd><span data-ui="badge" data-look="soft" data-hue="150">Authorized</span></dd><dt>ID</dt><dd><code class="ic">u_2J89JSA4GJ</code></dd></dl></div>`,
});
// ---------- render components ----------
function secHTML(s) {
  const names = Object.keys(s.tabs);
  return `<header><h3>${s.title}</h3>${names.length > 1 ? `<div class="vt" role="tablist">${names.map((n, i) => `<button role="tab" aria-selected="${i === 0}" data-t="${i}">${n}</button>`).join("")}</div>` : ""}</header><p class="lede">${s.lede}</p>${names.map((n, i) => `<div data-tp="${i}"${i ? " hidden" : ""}>${i ? "" : s.tabs[n]}</div>`).join("")}`;
}
// Sections are cheap shells until they come near the viewport; then their grids are built and wired (one at a time).
// Non-first tabs ("All colors", "All sizes") are only built when clicked.
let initUI = null; const pending = new Set();
function fill(el) {
  if (el.dataset.ready) return; el.dataset.ready = "1"; el.classList.remove("ph");
  el.innerHTML = secHTML(sections.find((x) => x.id === el.dataset.id)); tones(el);
  if (initUI) initUI(el); else pending.add(el);
}
function renderComponents() {
  const jump = `<nav class="jump" aria-label="Jump to">${sections.map((s) => `<a href="#c-${s.id}" data-j="${s.id}">${s.title}</a>`).join("")}</nav>`;
  const mx = document.getElementById("mx");
  mx.innerHTML = jump + sections.map((s) => `<section class="sec ph" id="c-${s.id}" data-id="${s.id}"><header><h3>${s.title}</h3></header><div class="skel"></div></section>`).join("");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }), { rootMargin: "600px 0px" });
  mx.querySelectorAll("section.sec").forEach((el) => io.observe(el));
  mx.addEventListener("click", (e) => {
    const j = e.target.closest("[data-j]");
    if (j) { e.preventDefault(); const t = document.getElementById("c-" + j.dataset.j); for (const el of mx.querySelectorAll("section.sec")) { fill(el); if (el === t) break; } t.scrollIntoView(); return; }
    const b = e.target.closest(".vt [data-t]"); if (!b) return; const sc = b.closest(".sec"), s = sections.find((x) => x.id === sc.dataset.id);
    sc.querySelectorAll(".vt [data-t]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    sc.querySelectorAll("[data-tp]").forEach((p) => { const on = p.dataset.tp === b.dataset.t; if (on && !p.dataset.built && p.dataset.tp !== "0") { p.dataset.built = "1"; p.innerHTML = Object.values(s.tabs)[+p.dataset.tp]; tones(p); initUI?.(p); } p.hidden = !on; });
  });
}
function renderType() {
  const sizes = [12, 14, 16, 18, 20, 24, 28, 35, 60];
  document.getElementById("ty").innerHTML = `<section class="sec"><header><h3>Heading</h3></header>${sizes.map((s, i) => `<div class="typerow"><small>Size ${i + 1}</small><h2 style="font-size:calc(${s}px * var(--st-type,1));margin:0;line-height:1.15">The quick brown fox jumps over the lazy dog</h2></div>`).join("")}</section>
  <section class="sec"><header><h3>Weights</h3></header>${[300, 400, 500, 700].map((w) => `<div class="typerow"><small>${w}</small><span style="font-weight:${w};font-size:calc(18px * var(--st-type,1))">The quick brown fox jumps over the lazy dog</span></div>`).join("")}</section>
  <section class="sec"><header><h3>Text · Link · Code · Kbd</h3></header><div class="grid g2"><p style="margin:0;max-width:60ch">The goal of typography is to relate font size, line height and line width in a proportional way that maximizes beauty and makes reading easier. <a class="lk" href="#">Susan Kare</a> designed the first Macintosh <code class="ic">icons</code>. Press <kbd>⌘</kbd> <kbd>K</kbd> to search, <kbd>D</kbd> to toggle dark mode.</p>
  <blockquote>“Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes near it in obstinacy.”<br><small class="muted">— Robert Bringhurst</small></blockquote></div></section>
  <section class="sec"><header><h3>Link colours</h3></header><div class="row" style="gap:18px">${HUES.slice(0, 10).map(([n, h]) => `<a class="lk" href="#" data-hue="${h}">${n}</a>`).join("")}</div></section>`;
}
// ---------- palette & contrast ----------
const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
const probe = document.createElement("i"); probe.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none";
function rgb(cssColor) { probe.style.background = cssColor; const c = getComputedStyle(probe).backgroundColor; cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }
const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const wcag = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function apca(t, b) { const Y = (c) => 0.2126729 * (c[0] / 255) ** 2.4 + 0.7151522 * (c[1] / 255) ** 2.4 + 0.072175 * (c[2] / 255) ** 2.4; const cl = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414); const yt = cl(Y(t)), yb = cl(Y(b)); let s; if (yb > yt) { s = (yb ** 0.56 - yt ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; } s = (yb ** 0.65 - yt ** 0.62) * 1.14; return s > -0.1 ? 0 : (s + 0.027) * 100; }
const STEPS = [3, 6, 10, 15, 21, 29, 40, 58, 100]; // mix of colour into background for steps 1–9
function scale(v) { return [...STEPS.map((p) => `color-mix(in oklab,var(${v}) ${p}%,var(--ui-background))`), `color-mix(in oklab,var(${v}) 88%,var(--ui-foreground))`, `color-mix(in oklab,var(${v}) 62%,var(--ui-foreground))`, `color-mix(in oklab,var(${v}) 25%,var(--ui-foreground))`]; }
function renderPalette() {
  const el = document.getElementById("pal"); if (!el) return; document.body.append(probe);
  const rows = [["Accent", "--ui-primary"], ["Gray", "--ui-muted-foreground"], ["Red", "--ui-destructive"], ["Green", "--ui-success"], ["Amber", "--ui-warning"]];
  const sc = rows.map(([n, v]) => `<div class="scale"><span>${n}</span>${scale(v).map((c, i) => { const h = hex(rgb(c)); return `<i style="background:${h}" data-n="${i + 1} ${h}" title="${n} ${i + 1}: ${h}"></i>`; }).join("")}</div>`).join("");
  const pairs = [["Body text", "--ui-foreground", "--ui-background", 4.5], ["Muted text", "--ui-muted-foreground", "--ui-background", 4.5], ["Text on card", "--ui-foreground", "--ui-card", 4.5], ["Button label", "--ui-primary-foreground", "--ui-primary", 4.5], ["Accent as text", "--ui-primary", "--ui-background", 3], ["Accent on muted", "--ui-primary", "--ui-muted", 3], ["Error text", "--ui-destructive", "--ui-background", 4.5], ["Borders vs bg", "--ui-border", "--ui-background", 1.2]];
  const tr = pairs.map(([n, f, b, need]) => { const F = rgb(`var(${f})`), B = rgb(`var(${b})`), r = wcag(F, B), lc = Math.abs(apca(F, B)); const ok = r >= need;
    return `<tr><td>${n}</td><td><span class="sw" style="background:${hex(B)};color:${hex(F)}">Aa</span></td><td><code class="ic">${f}</code> on <code class="ic">${b}</code></td><td><b>${r.toFixed(2)}:1</b></td><td>Lc ${lc.toFixed(0)}</td><td class="${ok ? "pass" : "fail"}">${ok ? (r >= need * 1.55 ? "AAA" : "AA") + " ✓" : "✗ below " + need}</td></tr>`; }).join("");
  el.innerHTML = `<section class="sec"><header><h3>Generated scales</h3></header><p class="lede">12-step scales derived live from the current pack, hue and appearance (steps 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9 solid, 10 hover, 11–12 text). Hover a swatch for its hex. Exported as <code class="ic">--accent-1…12</code> in CSS tokens.</p>
   <div class="scale"><span></span>${Array.from({ length: 12 }, (_, i) => `<span style="text-align:center">${i + 1}</span>`).join("")}</div>${sc}</section>
   <section class="sec"><header><h3>Contrast audit</h3></header><p class="lede">WCAG 2.2 ratio and APCA Lc for the pairs that matter, recomputed on every change, in ${root.dataset.theme} mode.</p><table class="ctr"><thead><tr><th>Pair</th><th></th><th>Tokens</th><th>WCAG</th><th>APCA</th><th>Result</th></tr></thead><tbody>${tr}</tbody></table></section>`;
  probe.remove();
}
// ---------- hue/tone overrides (re-evaluated when appearance changes) ----------
function tones(scope = document) {
  const dark = root.dataset.theme === "dark";
  scope.querySelectorAll("[data-hue]").forEach((e) => { const t = CS.hueTokens(+e.dataset.hue, 0.17, dark); for (const k of ["--ui-primary", "--ui-primary-foreground", "--ui-ring"]) e.style.setProperty(k, t[k]); });
  scope.querySelectorAll("[data-tone=gray]").forEach((e) => { e.style.setProperty("--ui-primary", "color-mix(in oklab,var(--ui-foreground) 74%,var(--ui-background))"); e.style.setProperty("--ui-primary-foreground", "var(--ui-background)"); e.style.setProperty("--ui-ring", "var(--ui-muted-foreground)"); });
}
let view = "showcase";
let typed = false;
function setView(v) { view = v; if (v === "type" && !typed) { typed = true; renderType(); tones(document.getElementById("ty")); } document.querySelectorAll("section[data-view]").forEach((s) => (s.hidden = s.dataset.view !== v)); if (v === "palette") renderPalette(); scrollTo(0, 0); }
window.studioView = setView;
window.studioSet = (next, f) => { S = { ...next }; if (f) S.__force = f; else if (force) S.__force = force; CS.apply(root, S); tones(); if (view === "palette") requestAnimationFrame(renderPalette); document.querySelectorAll("section[data-view]:not([hidden]) :is([data-ui=segmented-control],[data-ui=tab-nav],[data-ui=tabs])").forEach((el) => el.dispatchEvent(new Event("resize"))); dispatchEvent(new Event("resize")); };
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => S.scheme === "system" && window.studioSet(S));
renderComponents(); tones();
const hv = new URLSearchParams(location.search).get("view") || localStorage.getItem("colibri-studio-view"); if (hv && hv !== "showcase") setView(hv);
document.addEventListener("click", (e) => { const a = e.target.closest("a[href='#']"); if (a) e.preventDefault(); });
const warm = () => { const els = [...document.querySelectorAll("#mx section.sec:not([data-ready])")].slice(0, 4); els.forEach(fill); };
const ui = await import("../../src/core/auto.js"); initUI = ui.init; pending.clear(); // auto.js already wired everything in the DOM at import
parent?.postMessage?.({ studio: "ready" }, "*");
(window.requestIdleCallback || ((f) => setTimeout(f, 200)))(warm, { timeout: 800 });
