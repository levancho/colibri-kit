/* Colibri Theme Generator v1 — shared by colibria.ai (authoring) and Colibri Kit (import).
   A theme "spec" is plain JSON; css(spec) turns it into a complete Colibri Kit theme pack:
   html[data-kit-theme=<slug>] { --c-* Colibri CSS tokens, --ui-* Colibri UI tokens (light), shape, type, depth, motion }
   html[data-kit-theme=<slug>][data-theme=dark] { dark tokens }  + heading rules + baked component looks (from knobs.css).
   Every value is sanitised before it reaches CSS, so a spec from a link or a file can never inject CSS. */
(function () {
  const HEX = /^#[0-9a-f]{6}$/i;
  const ROLES = ["bg", "surface", "sunken", "fg", "muted", "line", "input", "primary", "primaryFg", "ring", "accentBg", "success", "warning", "danger"];
  const ENUM = {
    font: ["sys", "inter", "round", "grotesk", "serif", "mono", "geo"], hfont: ["same", "sys", "inter", "round", "grotesk", "serif", "mono", "geo"],
    shadow: ["none", "subtle", "soft", "deep"], motion: ["off", "calm", "standard", "lively"], schemes: ["both", "light", "dark"], scheme: ["light", "dark"],
    btn: ["solid", "soft", "surface", "outline", "classic", "ghost"], card: ["surface", "outline", "elevated", "ghost", "glass"], tabs: ["underline", "pill", "segmented"],
    acc: ["boxed", "fat", "skinny"], input: ["surface", "soft", "underline"], border: ["hairline", "strong", "none"],
  };
  const FONTS = { sys: 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif', inter: '"Inter","Geist",ui-sans-serif,system-ui,sans-serif',
    round: '"Nunito","Figtree","Avenir Next",ui-rounded,ui-sans-serif,sans-serif', grotesk: '"Space Grotesk","Inter",ui-sans-serif,sans-serif',
    serif: '"Iowan Old Style","Charter","Georgia",serif', mono: 'ui-monospace,"JetBrains Mono",SFMono-Regular,Menlo,monospace', geo: '"Noto Sans Georgian","BPG Arial",ui-sans-serif,sans-serif' };
  const FONT_NAMES = { sys: "System", inter: "Inter / Geist", round: "Rounded", grotesk: "Grotesk", serif: "Serif", mono: "Mono", geo: "Georgian" };
  const MOTION = { off: ["0ms", "linear", "0px"], calm: ["220ms", "cubic-bezier(.2,.7,.2,1)", "6px"], standard: ["180ms", "cubic-bezier(.2,.8,.2,1)", "10px"], lively: ["320ms", "cubic-bezier(.34,1.56,.64,1)", "16px"] };

  // ---------- colour math (sRGB <-> OKLCH) ----------
  const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4), toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function rgbHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase(); }
  function oklch(hex) {
    const [r, g, b] = hexRgb(hex).map(toLin);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.hypot(A, B); let H = (Math.atan2(B, A) * 180) / Math.PI; if (H < 0) H += 360; return [L, C, C < 1e-4 ? 0 : H];
  }
  function rawRgb(L, C, H) {
    const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  function hex(L, C, H) { L = Math.min(1, Math.max(0, L)); let lo = 0, hi = C, rgb = rawRgb(L, C, H); const ok = (v) => v.every((x) => x >= -1e-4 && x <= 1 + 1e-4);
    if (!ok(rgb)) { for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; ok(rawRgb(L, mid, H)) ? (lo = mid) : (hi = mid); } rgb = rawRgb(L, lo, H); } return rgbHex(...rgb.map(toGam)); }
  function lum(h) { const [r, g, b] = hexRgb(h).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  const onColor = (bg) => (contrast(bg, "#FFFFFF") >= 3.4 || contrast(bg, "#FFFFFF") >= contrast(bg, "#111111") ? "#FFFFFF" : hex(0.2, Math.min(0.04, oklch(bg)[1]), oklch(bg)[2]));

  // ---------- derive a full light + dark colour system from a seed ----------
  // seed: { accent, neutralHue?, tint 0..1, bg?, fg? (optional palette roles to honour in light mode), success?, warning?, danger? }
  function derive(seed) {
    const acc = HEX.test(seed.accent || "") ? seed.accent.toUpperCase() : "#4F46E5"; const [aL, aC, aH] = oklch(acc);
    const nh = seed.neutralHue != null && isFinite(+seed.neutralHue) ? +seed.neutralHue : aH, t = Math.min(1, Math.max(0, seed.tint == null ? 0.35 : +seed.tint));
    const n = (L, c) => hex(L, c * t, nh);
    const light = { bg: n(0.985, 0.02), surface: n(0.998, 0.008), sunken: n(0.962, 0.03), fg: n(0.22, 0.04), muted: n(0.5, 0.04), line: n(0.915, 0.035), input: n(0.87, 0.04) };
    const dark = { bg: n(0.165, 0.025), surface: n(0.205, 0.028), sunken: n(0.135, 0.022), fg: n(0.965, 0.012), muted: n(0.72, 0.03), line: n(0.29, 0.03), input: n(0.34, 0.032) };
    if (HEX.test(seed.bg || "") && lum(seed.bg) > 0.6) { light.bg = seed.bg.toUpperCase(); const [bL, bC, bH] = oklch(seed.bg); light.sunken = hex(bL - 0.025, bC + 0.006, bH); light.line = hex(bL - 0.07, bC + 0.01, bH); light.input = hex(bL - 0.11, bC + 0.01, bH); }
    if (HEX.test(seed.bg || "") && lum(seed.bg) < 0.05) { dark.bg = seed.bg.toUpperCase(); const [bL, bC, bH] = oklch(seed.bg); dark.surface = hex(bL + 0.045, bC, bH); dark.sunken = hex(bL - 0.03, bC, bH); dark.line = hex(bL + 0.12, bC, bH); dark.input = hex(bL + 0.17, bC, bH); }
    if (HEX.test(seed.fg || "") && contrast(seed.fg, light.bg) >= 7) light.fg = seed.fg.toUpperCase();
    const pL = Math.min(Math.max(aL, 0.45), 0.68), pD = Math.min(Math.max(aL, 0.7), 0.82);
    light.primary = aL > 0.45 && aL < 0.72 ? acc : hex(pL, aC, aH); dark.primary = hex(pD, Math.min(aC, 0.2), aH);
    for (const [s, dk] of [[light, 0], [dark, 1]]) {
      const [, sC, sH] = HEX.test(seed.secondary || "") ? oklch(seed.secondary) : [0, aC, aH]; // optional second hue (e.g. from the colour wheel) tints accents
      s.primaryFg = onColor(s.primary); s.ring = hex(dk ? 0.72 : 0.75, aC * 0.8, aH); s.accentBg = dk ? hex(0.27, Math.min(0.06, sC * 0.35), sH) : hex(0.955, Math.min(0.04, sC * 0.28), sH);
      s.success = HEX.test(seed.success || "") ? seed.success.toUpperCase() : hex(dk ? 0.74 : 0.6, 0.16, 150); s.warning = HEX.test(seed.warning || "") ? seed.warning.toUpperCase() : hex(dk ? 0.8 : 0.68, 0.16, 70); s.danger = HEX.test(seed.danger || "") ? seed.danger.toUpperCase() : hex(dk ? 0.7 : 0.58, 0.2, 22);
    }
    return { light, dark };
  }

  // ---------- presets: start points that fill every control (users then make it their own) ----------
  const PRESETS = {
    colibri: { label: "Colibri", note: "neutral · balanced", seed: { accent: "#4F46E5", tint: 0.2 }, radius: 8, control: 38, font: "inter", hfont: "same", hweight: 650, scale: 100, shadow: "soft", border: "hairline", motion: "standard", components: { btn: "solid", card: "surface", tabs: "underline", acc: "boxed", input: "surface" }, schemes: "both", scheme: "light" },
    glacier: { label: "Glacier", note: "crisp · editorial", seed: { accent: "#0F766E", neutralHue: 230, tint: 0.35 }, radius: 6, control: 36, font: "inter", hfont: "same", hweight: 600, scale: 100, shadow: "subtle", border: "hairline", motion: "calm", components: { btn: "solid", card: "outline", tabs: "underline", acc: "skinny", input: "surface" }, schemes: "both", scheme: "light" },
    ember: { label: "Ember", note: "warm · soft · round", seed: { accent: "#EA580C", neutralHue: 60, tint: 0.6 }, radius: 16, control: 42, font: "round", hfont: "same", hweight: 800, scale: 102, shadow: "deep", border: "hairline", motion: "lively", components: { btn: "solid", card: "elevated", tabs: "pill", acc: "fat", input: "soft" }, schemes: "both", scheme: "light" },
    midnight: { label: "Midnight", note: "dark-first · neon · glass", seed: { accent: "#8B5CF6", neutralHue: 265, tint: 0.9 }, radius: 12, control: 38, font: "grotesk", hfont: "same", hweight: 700, scale: 100, shadow: "deep", border: "hairline", motion: "lively", components: { btn: "soft", card: "glass", tabs: "segmented", acc: "boxed", input: "soft" }, schemes: "dark", scheme: "dark" },
  };
  function slugify(s) { return (String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "my-theme").replace(/^(\d)/, "t$1"); }
  function fromPreset(id, over) {
    const p = PRESETS[id] || PRESETS.colibri, seed = { ...p.seed, ...(over || {}) };
    return sanitize({ v: 1, name: (over && over.name) || p.label + " custom", base: id, seed, colors: derive(seed), radius: p.radius, control: p.control, font: p.font, hfont: p.hfont, hweight: p.hweight, scale: p.scale, shadow: p.shadow, border: p.border, motion: p.motion, components: { ...p.components }, schemes: p.schemes, scheme: p.schemes === "dark" ? "dark" : p.scheme });
  }

  // ---------- sanitise (the only gate between untrusted JSON and CSS) ----------
  const num = (v, lo, hi, d) => (isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : d);
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  function sanitize(o) {
    if (!o || typeof o !== "object") return null; const c = o.colors || {}, out = { light: {}, dark: {} };
    const d = derive(o.seed || {});
    for (const m of ["light", "dark"]) for (const r of ROLES) out[m][r] = HEX.test((c[m] || {})[r] || "") ? c[m][r].toUpperCase() : d[m][r];
    const comp = o.components || {};
    const seed = o.seed && typeof o.seed === "object" ? Object.fromEntries(Object.entries(o.seed).filter(([k, v]) => ["accent", "secondary", "bg", "fg", "neutralHue", "tint"].includes(k) && (HEX.test(String(v)) || isFinite(+v))).map(([k, v]) => [k, HEX.test(String(v)) ? String(v).toUpperCase() : +v])) : {};
    const schemes = pick(o.schemes, ENUM.schemes, "both");
    return { v: 1, name: String(o.name || "My theme").replace(/[<>"`\\]/g, "").slice(0, 48), slug: slugify(o.slug || o.name), base: pick(o.base, Object.keys(PRESETS), "colibri"), seed,
      colors: out, radius: num(o.radius, 0, 999, 8), control: num(o.control, 30, 52, 38), font: pick(o.font, ENUM.font, "inter"), hfont: pick(o.hfont, ENUM.hfont, "same"), hweight: num(o.hweight, 400, 900, 650), scale: num(o.scale, 85, 120, 100),
      shadow: pick(o.shadow, ENUM.shadow, "soft"), border: pick(o.border, ENUM.border, "hairline"), motion: pick(o.motion, ENUM.motion, "standard"),
      components: { btn: pick(comp.btn, ENUM.btn, "solid"), card: pick(comp.card, ENUM.card, "surface"), tabs: pick(comp.tabs, ENUM.tabs, "underline"), acc: pick(comp.acc, ENUM.acc, "boxed"), input: pick(comp.input, ENUM.input, "surface") },
      chart: Array.isArray(o.chart) ? o.chart.filter((c) => HEX.test(String(c))).slice(0, 8).map((c) => c.toUpperCase()) : [],
      schemes, scheme: schemes === "dark" ? "dark" : schemes === "light" ? "light" : pick(o.scheme, ENUM.scheme, "light") };
  }

  // ---------- spec -> CSS ----------
  function radii(r) { const full = r >= 999; return { s: full ? 999 : Math.max(0, r - (r > 6 ? 4 : 2)), m: r, l: full ? 28 : Math.round(r * 1.4 + (r ? 2 : 0)) }; }
  function shadows(kind, s, dark) {
    const [L, C, H] = oklch(s.fg), col = (a) => (dark ? `oklch(0% 0 0 / ${a})` : `oklch(${(L * 100).toFixed(0)}% ${Math.min(C, 0.06).toFixed(3)} ${H.toFixed(0)} / ${a})`);
    if (kind === "none") return { s: "none", m: "none", l: "none" };
    if (kind === "subtle") return { s: `0 1px 2px ${col(dark ? 0.5 : 0.07)}`, m: `0 1px 2px ${col(dark ? 0.5 : 0.06)},0 4px 12px -4px ${col(dark ? 0.5 : 0.08)}`, l: `0 12px 32px -12px ${col(dark ? 0.6 : 0.14)}` };
    if (kind === "deep") return { s: `0 2px 6px -1px ${col(dark ? 0.6 : 0.14)}`, m: `0 2px 4px ${col(dark ? 0.5 : 0.06)},0 24px 50px -18px ${col(dark ? 0.8 : 0.28)}`, l: `0 36px 70px -24px ${col(dark ? 0.85 : 0.34)}` };
    return { s: `0 1px 3px ${col(dark ? 0.55 : 0.1)}`, m: `0 10px 30px -12px ${col(dark ? 0.7 : 0.18)}`, l: `0 24px 54px -20px ${col(dark ? 0.8 : 0.24)}` };
  }
  function tokens(spec, mode) {
    const s = spec.colors[mode], dark = mode === "dark", R = radii(spec.radius), sh = shadows(spec.shadow, s, dark), [, , aH] = oklch(spec.colors.light.primary);
    const mix = (a, b, p) => `color-mix(in oklab,${a} ${p}%,${b})`, line = spec.border === "strong" ? mix(s.line, s.fg, 82) : spec.border === "none" ? "transparent" : s.line;
    const t = {
      "--ui-background": s.bg, "--ui-foreground": s.fg, "--ui-card": s.surface, "--ui-popover": s.surface, "--ui-muted": s.sunken, "--ui-muted-foreground": s.muted,
      "--ui-accent": s.accentBg, "--ui-accent-foreground": s.fg, "--ui-primary": s.primary, "--ui-primary-foreground": s.primaryFg, "--ui-ring": s.ring,
      "--ui-border": line, "--ui-input": s.input, "--ui-success": s.success, "--ui-warning": s.warning, "--ui-destructive": s.danger,
      "--ui-shadow-sm": sh.s, "--ui-shadow": sh.m,
      "--acc-card": s.surface, "--acc-head": dark ? s.sunken : s.surface, "--acc-body": s.sunken, "--acc-rule": s.primary,
      ...chartVars(spec, dark),
      "--s-bg": s.bg, "--s-fg": s.fg, "--s-muted": s.muted, "--s-line": line, "--s-soft": s.sunken, "--s-acc": s.primary, "--s-ring": s.ring,
    };
    if (!dark) Object.assign(t, {
      "--c-hue": aH.toFixed(0), "--c-bg": `light-dark(${s.bg},${spec.colors.dark.bg})`, "--c-surface": `light-dark(${s.surface},${spec.colors.dark.surface})`, "--c-sunken": `light-dark(${s.sunken},${spec.colors.dark.sunken})`,
      "--c-fg": `light-dark(${s.fg},${spec.colors.dark.fg})`, "--c-muted": `light-dark(${s.muted},${spec.colors.dark.muted})`, "--c-line": `light-dark(${s.line},${spec.colors.dark.line})`,
      "--c-accent": `light-dark(${s.primary},${spec.colors.dark.primary})`, "--c-brand": "var(--c-accent)", "--c-brand-fg": `light-dark(${s.primaryFg},${spec.colors.dark.primaryFg})`,
      "--c-font": FONTS[spec.font], "--ui-font": FONTS[spec.font], "--c-radius-s": R.s + "px", "--c-radius": R.m + "px", "--c-radius-l": R.l + "px",
      "--ui-radius": R.m + "px", "--ui-radius-sm": R.s + "px", "--ui-radius-lg": R.l + "px", "--ui-control-h": spec.control + "px", "--ui-scale": (spec.control / 36).toFixed(3),
      "--c-shadow-s": sh.s, "--c-shadow": sh.m, "--c-shadow-l": sh.l,
      "--c-dur": MOTION[spec.motion][0], "--c-ease": MOTION[spec.motion][1], "--ui-motion-duration": MOTION[spec.motion][0], "--ui-motion-ease": MOTION[spec.motion][1], "--ui-motion-distance": MOTION[spec.motion][2],
      "--ui-text-sm": ((14 * spec.scale) / 100).toFixed(1) + "px", "--ui-text-xs": ((12 * spec.scale) / 100).toFixed(1) + "px",
    });
    return t;
  }
  // the scheme's full colour set (from the wheel) as chart / data-vis colours, nudged per scheme so each stays visible
  function chartVars(spec, dark) {
    const o = {}; (spec.chart || []).forEach((c, i) => { const [L, C, H] = oklch(c), v = hex(dark ? Math.min(Math.max(L, 0.62), 0.86) : Math.min(Math.max(L, 0.42), 0.74), C, H); o[`--ui-chart-${i + 1}`] = v; if (!dark) o[`--c-chart-${i + 1}`] = v; });
    return o;
  }
  const block = (sel, t) => sel + "{\n" + Object.entries(t).map(([k, v]) => `  ${k}:${v};`).join("\n") + "\n}\n";
  // knobsCSS (optional): the text of Colibri Kit themes/knobs.css; the chosen looks are baked into the pack so it needs no data-ui-* attributes.
  function bakeKnobs(spec, knobsCSS, sel) {
    if (!knobsCSS) return ""; const want = { btn: spec.components.btn, card: spec.components.card, tabs: spec.components.tabs, acc: spec.components.acc, input: spec.components.input }, out = [];
    for (const line of knobsCSS.split("\n")) { const m = /^\[data-ui-(btn|card|tabs|acc|input)=([a-z]+)\] ([^,{]+)(?:,[^{]*)?(\{.*\})\s*$/.exec(line); if (m && want[m[1]] === m[2]) out.push(`${sel} ${m[3].trim()}${m[4]}`); }
    return out.length ? `/* component looks: buttons ${want.btn} · cards ${want.card} · tabs ${want.tabs} · accordion ${want.acc} · inputs ${want.input} */\n` + out.join("\n") + "\n" : "";
  }
  function css(spec0, opts) {
    const spec = sanitize(spec0); if (!spec) return ""; opts = opts || {};
    const sel = opts.scope || `html[data-kit-theme=${spec.slug}]`, dsel = opts.darkScope || `${sel}[data-theme=dark]`;
    const light = spec.schemes === "dark" ? spec.colors.dark : spec.colors.light;
    const lt = tokens({ ...spec, colors: { ...spec.colors, light } }, "light");
    let o = `/* Colibri Kit theme: ${spec.name} (${spec.slug}) — generated by Colibria Kit Theme Generator (colibria.ai).\n   Usage: <html data-kit-theme="${spec.slug}" data-theme="${spec.scheme}">  Schemes: ${spec.schemes}. */\n`;
    o += block(sel, { "color-scheme": spec.schemes === "both" ? "light dark" : spec.schemes, ...lt });
    if (spec.schemes !== "light") o += block(dsel, tokens(spec, "dark"));
    const hf = spec.hfont === "same" ? "var(--ui-font)" : FONTS[spec.hfont];
    o += `${sel} :is(h1,h2,h3,h4){font-family:${hf};font-weight:${spec.hweight};letter-spacing:${spec.hweight >= 700 ? "-.02em" : "-.01em"}}\n`;
    o += `${sel} .btn{border-radius:${spec.radius >= 999 ? "999px" : "var(--c-radius)"};min-block-size:${(spec.control / 16).toFixed(2)}rem}\n${sel} .card{border-radius:var(--c-radius-l)}\n${sel} .badge{border-radius:${spec.radius >= 12 ? "999px" : "var(--c-radius-s)"}}\n`;
    if (spec.motion === "off") o += `${sel} *,${sel} *::before,${sel} *::after{transition-duration:0s!important;animation-duration:0s!important}\n`;
    o += bakeKnobs(spec, opts.knobs, opts.knobScope || sel);
    return o;
  }
  // attributes for Kit Studio / an <html> element that does not use baked knobs
  function attrs(spec) { const c = spec.components; return { "data-kit-theme": spec.slug, "data-theme": spec.scheme, "data-ui-btn": c.btn, "data-ui-card": c.card, "data-ui-tabs": c.tabs, "data-ui-acc": c.acc, "data-ui-input": c.input }; }
  // Kit Studio knob values that reproduce this spec
  function studio(spec) { const c = spec.components; return { btn: c.btn, card: c.card, tabs: c.tabs, acc: c.acc, input: c.input }; }

  // ---------- ZIP (stored, no compression; tiny, dependency-free) + reader (stored or deflate) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0; const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for (const [name, text] of files) {
      const nb = enc.encode(name), data = typeof text === "string" ? enc.encode(text) : text, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(h.buffer), nb, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), nb); off += 30 + nb.length + data.length;
    }
    const cs = cen.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: "application/zip" });
  }
  async function unzipFind(buf, test) {
    const u = new Uint8Array(buf), v = new DataView(buf); let e = u.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) return null;
    let p = v.getUint32(e + 16, true); const n = v.getUint16(e + 10, true), dec = new TextDecoder();
    for (let i = 0; i < n; i++) {
      const method = v.getUint16(p + 10, true), csz = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true), name = dec.decode(u.subarray(p + 46, p + 46 + nl));
      if (test(name)) { const start = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), raw = u.subarray(start, start + csz);
        if (method === 0) return dec.decode(raw); if (method === 8 && typeof DecompressionStream !== "undefined") return await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text(); return null; }
      p += 46 + nl + xl + cl;
    }
    return null;
  }
  // read a theme from a dropped/picked file: theme.json or a ZIP containing */theme.json
  async function readFile(file) {
    const buf = await file.arrayBuffer(), u = new Uint8Array(buf);
    const text = u[0] === 0x50 && u[1] === 0x4b ? await unzipFind(buf, (n) => /(^|\/)theme\.json$/i.test(n)) : new TextDecoder().decode(u);
    if (!text) return null; let j; try { j = JSON.parse(text); } catch (e) { return null; } return sanitize(j.spec || j);
  }

  window.ColibriThemeGen = { v: 1, ROLES, ENUM, FONTS, FONT_NAMES, PRESETS, oklch, hex, lum, contrast, onColor, derive, fromPreset, sanitize, slugify, tokens, css, attrs, studio, zip, unzipFind, readFile };
})();
