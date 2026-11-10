/* Colibri Themes Studio: shared theme engine. Classic (non-module) script so it runs synchronously in <head>,
   before first paint, in both the Studio shell and the preview frames (no white/dark flash). */
(function () {
  const DEF = { pack: "glacier", hue: null, chroma: 0.17, gray: "auto", scheme: "light", radius: "pack", scaling: "100", panel: "solid",
    font: "pack", hfont: "pack", tscale: 100, hweight: "pack", shadow: "pack", focus: "pack", motion: "pack",
    btn: "pack", acc: "pack", tabs: "pack", card: "pack", input: "pack", bridge: null, gen: null };
  const KEY = "colibri-studio-v2";
  const DARK_ONLY = {};
  const HUES = [["Indigo", 268], ["Iris", 280], ["Violet", 295], ["Plum", 320], ["Pink", 350], ["Crimson", 10], ["Ruby", 20], ["Red", 27],
    ["Tomato", 35], ["Orange", 50], ["Amber", 75], ["Gold", 88], ["Lime", 125], ["Grass", 145], ["Green", 155], ["Jade", 165], ["Teal", 182], ["Cyan", 210], ["Sky", 228], ["Blue", 252]];
  const FONTS = { sys: 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif', inter: '"Inter","Geist",ui-sans-serif,system-ui,sans-serif',
    round: '"Nunito","Avenir Next","Segoe UI",ui-rounded,sans-serif', grotesk: '"Space Grotesk","Inter",ui-sans-serif,sans-serif',
    serif: '"Iowan Old Style","Charter","Georgia",serif', mono: 'ui-monospace,"JetBrains Mono",SFMono-Regular,Menlo,monospace', geo: '"Noto Sans Georgian","BPG Arial",ui-sans-serif,sans-serif' };
  function load() { const s = { ...DEF }; try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {} return s; }
  function sysDark() { try { return matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; } }
  function resolveScheme(S) { if (S.gen && S.gen.schemes !== "both") return S.gen.schemes; if (!S.gen && DARK_ONLY[S.pack]) return "dark"; const want = S.__force || S.scheme; return want === "system" ? (sysDark() ? "dark" : "light") : want === "dark" ? "dark" : "light"; }
  // accent tokens for one hue; yellows/limes get a lighter fill with dark text so contrast holds in both schemes
  function hueTokens(h, c, dark) {
    c = c == null ? 0.17 : +c; const bright = h >= 70 && h <= 135;
    const L = dark ? (bright ? 82 : 70) : bright ? 78 : 55;
    const fg = bright || dark ? `oklch(20% ${Math.min(c, .06).toFixed(3)} ${h})` : "#fff";
    return { "--ui-primary": `oklch(${L}% ${c.toFixed(3)} ${h})`, "--ui-primary-foreground": fg, "--ui-ring": `oklch(${dark ? 72 : 68}% ${(c * .85).toFixed(3)} ${h})`,
      "--ui-accent": dark ? `oklch(27% ${(c * .3).toFixed(3)} ${h})` : `oklch(96% ${(c * .18).toFixed(3)} ${h})`, "--ui-accent-foreground": "var(--ui-foreground)" };
  }
  function model(S) {
    const scheme = resolveScheme(S), dark = scheme === "dark";
    const attrs = { "data-theme": scheme };
    const G = S.gen && window.ColibriThemeGen ? window.ColibriThemeGen.sanitize(S.gen) : null;
    if (G) attrs["data-kit-theme"] = G.slug; else if (S.pack) attrs["data-kit-theme"] = S.pack;
    if (S.gray !== "auto") attrs["data-ui-gray"] = S.gray;
    if (String(S.scaling) !== "100") attrs["data-ui-scaling"] = String(S.scaling);
    if (S.panel !== "solid") attrs["data-ui-panel"] = S.panel;
    if (S.motion === "off") attrs["data-ui-motion"] = "off";
    for (const [k, a] of [["btn", "data-ui-btn"], ["acc", "data-ui-acc"], ["tabs", "data-ui-tabs"], ["card", "data-ui-card"], ["input", "data-ui-input"]]) if (S[k] && S[k] !== "pack") attrs[a] = S[k];
    const tok = {};
    if (S.hue != null && S.hue !== "") { const h = +S.hue; Object.assign(tok, { "--c-hue": h, "--c-chroma": (+S.chroma).toFixed(3) }, hueTokens(h, S.chroma, dark)); tok["--c-accent"] = "var(--ui-primary)"; tok["--acc-rule"] = "var(--ui-primary)"; tok["--s-acc"] = "var(--ui-primary)"; }
    if (S.radius !== "pack") { const r = +S.radius; Object.assign(tok, { "--ui-radius": r + "px", "--ui-radius-sm": Math.max(0, Math.min(r, 999) - (r > 6 ? 3 : 1)) + "px", "--ui-radius-lg": (r >= 999 ? 24 : Math.round(r * 1.5)) + "px", "--c-radius-s": Math.max(0, r - 3) + "px", "--c-radius": r + "px", "--c-radius-l": (r >= 999 ? 24 : Math.round(r * 1.5)) + "px" }); }
    if (S.font !== "pack" && FONTS[S.font]) { tok["--ui-font"] = FONTS[S.font]; tok["--c-font"] = FONTS[S.font]; }
    if (S.hfont !== "pack" && FONTS[S.hfont]) tok["--st-hfont"] = FONTS[S.hfont];
    if (+S.tscale !== 100) { const f = +S.tscale / 100; Object.assign(tok, { "--ui-text-sm": (14 * f).toFixed(1) + "px", "--ui-text-xs": (12 * f).toFixed(1) + "px", "--st-type": f.toFixed(2) }); }
    if (S.hweight !== "pack") tok["--st-hweight"] = S.hweight;
    if (S.shadow === "none") Object.assign(tok, { "--ui-shadow-sm": "none", "--ui-shadow": "none", "--c-shadow-s": "none", "--c-shadow": "none", "--c-shadow-l": "none" });
    if (S.shadow === "subtle") { const a = dark ? "66" : "14"; Object.assign(tok, { "--ui-shadow-sm": `0 1px 2px #000000${a}`, "--ui-shadow": `0 1px 2px #000000${a},0 4px 12px -4px #000000${a}` }); }
    if (S.shadow === "deep") { const a = dark ? "99" : "2e", b = dark ? "cc" : "4d"; Object.assign(tok, { "--ui-shadow-sm": `0 1px 2px #000000${a},0 4px 10px -4px #000000${a}`, "--ui-shadow": `0 2px 4px #000000${a},0 28px 60px -20px #000000${b},0 10px 24px -12px #000000${a}` }); }
    if (S.focus === "glow") tok["--ui-focus-shadow"] = "0 0 0 3px color-mix(in oklab,var(--ui-ring) 45%,transparent),0 0 22px -2px var(--ui-ring)";
    if (S.focus === "offset") tok["--ui-focus-shadow"] = "0 0 0 2px var(--ui-background),0 0 0 4px var(--ui-ring)";
    if (S.focus === "thick") tok["--ui-focus-shadow"] = "0 0 0 4px color-mix(in oklab,var(--ui-ring) 60%,transparent)";
    if (S.motion === "calm") Object.assign(tok, { "--ui-motion-duration": "260ms", "--ui-motion-distance": "6px", "--c-dur": "260ms" });
    if (S.motion === "lively") Object.assign(tok, { "--ui-motion-duration": "420ms", "--ui-motion-distance": "18px", "--ui-motion-ease": "cubic-bezier(.34,1.56,.64,1)", "--c-dur": "320ms", "--c-ease": "cubic-bezier(.34,1.56,.64,1)" });
    if (!G && S.bridge && window.ColibriBridge) Object.assign(tok, window.ColibriBridge.tokens(S.bridge, scheme));
    return { attrs, tok, scheme, gen: G };
  }
  const ATTRS = ["data-theme", "data-kit-theme", "data-ui-gray", "data-ui-scaling", "data-ui-panel", "data-ui-motion", "data-ui-btn", "data-ui-acc", "data-ui-tabs", "data-ui-card", "data-ui-input"];
  function apply(root, S) {
    const m = model(S);
    const doc = root.ownerDocument; let st = doc.getElementById("colibri-gen-theme");
    if (m.gen) { const css = window.ColibriThemeGen.css(m.gen); if (!st) { st = doc.createElement("style"); st.id = "colibri-gen-theme"; doc.head.appendChild(st); } if (st.textContent !== css) st.textContent = css; } else if (st) st.remove();
    for (const a of ATTRS) m.attrs[a] ? root.setAttribute(a, m.attrs[a]) : root.removeAttribute(a);
    root.removeAttribute("style");
    for (const [k, v] of Object.entries(m.tok)) root.style.setProperty(k, String(v));
    root.style.colorScheme = m.scheme;
    return m;
  }
  window.ColibriStudio = { DEF, KEY, HUES, FONTS, DARK_ONLY, load, model, apply, resolveScheme, hueTokens, sysDark };
  const r = document.documentElement;
  if (r.hasAttribute("data-studio-preview")) { const S = load(); const f = new URLSearchParams(location.search).get("scheme"); if (f) S.__force = f; apply(r, S); }
})();
