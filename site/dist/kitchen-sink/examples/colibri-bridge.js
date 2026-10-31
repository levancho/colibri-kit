/* Colibri Bridge v1 — the ONE theme schema shared by Colibria (colibria.ai) and Colibri Kit (colibri.l3v.ai).
   Transport is plain navigation between the two sites (no iframes): a URL hash
       #colibri=<base64url(JSON)>&return=<url-encoded URL to come back to>
   plus window.opener.postMessage({type:"colibri-theme", theme}) when the other tab is still open.
   Schema (all colours are #RRGGBB):
   { "v": 1,
     "source": "colibria" | "colibri-kit",
     "name": "Sunset dashboard",               // optional
     "colors": ["#1B1D2A", …],                 // 2–15, ordered palette
     "roles": { "accent": "#…", "background": "#…", "surface": "#…", "text": "#…" },  // optional; accent required for Kit
     "scheme": "light" | "dark",               // which appearance background/surface/text are for
     "harmony": "Analogous",                   // optional (Colibria rule name)
     "base": { "h": 24, "s": 67, "l": 55 },    // optional (Colibria wheel position, HSL)
     "kit": { "pack": "glacier", "radius": "6", "btn": "soft", … }  // optional Studio settings hint
   }
   Classic script: exposes window.ColibriBridge; with data-auto on the <script> tag it applies a stored/incoming theme before paint. */
(function () {
  const KEY = "colibri-bridge-theme", HEX = /^#[0-9a-f]{6}$/i;
  const ALLOW = [/^https:\/\/(www\.)?colibria\.ai$/, /^https:\/\/colibri\.l3v\.ai$/, /^https:\/\/colibria[\w-]*\.[\w-]+\.workers\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
  const okOrigin = (o) => ALLOW.some((r) => r.test(o));
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  const rgb = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16));
  const lum = (h) => rgb(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const hue = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((x * 60 + 360) % 360); };
  function validate(o) {
    if (!o || o.v !== 1 || !Array.isArray(o.colors)) return null;
    const colors = o.colors.filter((c) => HEX.test(c)).slice(0, 15).map((c) => c.toUpperCase());
    if (colors.length < 2) return null;
    const roles = {}; for (const k of ["accent", "background", "surface", "text"]) if (HEX.test(o.roles?.[k] || "")) roles[k] = o.roles[k].toUpperCase();
    if (!roles.accent) roles.accent = colors[Math.min(2, colors.length - 1)];
    const scheme = o.scheme === "dark" || o.scheme === "light" ? o.scheme : roles.background ? (lum(roles.background) < 0.2 ? "dark" : "light") : "light";
    const t = { v: 1, source: o.source === "colibria" ? "colibria" : "colibri-kit", name: String(o.name || "").slice(0, 80), colors, roles, scheme };
    if (o.harmony) t.harmony = String(o.harmony).slice(0, 40);
    if (o.base && [o.base.h, o.base.s, o.base.l].every((n) => typeof n === "number")) t.base = { h: o.base.h, s: o.base.s, l: o.base.l };
    if (o.kit && typeof o.kit === "object") t.kit = Object.fromEntries(Object.entries(o.kit).filter(([k, v]) => /^[a-z]{2,10}$/.test(k) && /^[\w.-]{0,16}$/.test(String(v))).slice(0, 24));
    if (o.gen && typeof o.gen === "object" && window.ColibriThemeGen) { const g = window.ColibriThemeGen.sanitize(o.gen); if (g) { t.gen = g; t.scheme = g.scheme; } }
    return t;
  }
  const encode = (t) => b64e(JSON.stringify(t));
  const decode = (s) => { try { return validate(JSON.parse(b64d(s))); } catch (e) { return null; } };
  function safeReturn(u) { try { const x = new URL(u); return okOrigin(x.origin) ? x.href.split("#")[0] : null; } catch (e) { return null; } }
  function link(base, theme, ret) { return base.split("#")[0] + "#colibri=" + encode(theme) + (ret ? "&return=" + encodeURIComponent(ret) : ""); }
  function read(loc) { const q = new URLSearchParams((loc || location).hash.slice(1)); const s = q.get("colibri"); if (!s) return null; const theme = decode(s); return theme ? { theme, ret: safeReturn(q.get("return") || "") } : null; }
  const mix = (a, b, p) => `color-mix(in oklab, ${a} ${p}%, ${b})`;
  /* tokens for Colibri UI (--ui-*), Colibri CSS (--c-*) and dashboard charts; surfaces only when the appearance matches */
  function tokens(t, scheme) {
    const r = t.roles, a = r.accent, darkAcc = lum(a) > 0.45, o = {};
    Object.assign(o, { "--ui-primary": a, "--ui-primary-foreground": darkAcc ? "#111111" : "#FFFFFF", "--ui-ring": a, "--c-accent": a, "--c-brand": a, "--c-brand-fg": darkAcc ? "#111111" : "#FFFFFF", "--c-hue": hue(a), "--acc-rule": a, "--s-acc": a });
    const match = !scheme || scheme === t.scheme;
    if (match && r.background && r.text) {
      const bg = r.background, sf = r.surface || r.background, fg = r.text;
      Object.assign(o, { "--ui-background": bg, "--ui-card": sf, "--ui-popover": sf, "--ui-foreground": fg, "--ui-muted": mix(fg, bg, 7), "--ui-muted-foreground": mix(fg, bg, 62), "--ui-accent": mix(a, bg, 14), "--ui-accent-foreground": fg, "--ui-border": mix(fg, bg, 14), "--ui-input": mix(fg, bg, 20),
        "--c-bg": bg, "--c-surface": sf, "--c-sunken": mix(fg, bg, 5), "--c-fg": fg, "--c-muted": mix(fg, bg, 62), "--c-line": mix(fg, bg, 14), "--c-accent-soft": mix(a, bg, 16), "--acc-head": sf, "--acc-body": sf, "--acc-head-open": mix(a, sf, 10),
        "--s-bg": bg, "--s-fg": fg, "--s-muted": mix(fg, bg, 62), "--s-line": mix(fg, bg, 14), "--s-soft": mix(fg, bg, 6) });
    } else Object.assign(o, { "--ui-accent": mix(a, "var(--ui-background)", 14), "--c-accent-soft": mix(a, "var(--c-bg, #fff)", 16) });
    const chart = [a, ...t.colors.filter((c) => c !== a && c !== r.background && c !== r.text && c !== r.surface)];
    while (chart.length < 5) chart.push(t.colors[chart.length % t.colors.length]);
    chart.slice(0, 5).forEach((c, i) => (o["--chart-" + (i + 1)] = c));
    return o;
  }
  function apply(root, t, opts) {
    root = root || document.documentElement; opts = opts || {};
    if (t.gen && window.ColibriThemeGen) { // a full generated theme: install its pack CSS and looks instead of recolouring
      const G = window.ColibriThemeGen, doc = root.ownerDocument; let st = doc.getElementById("colibri-gen-theme");
      if (!st) { st = doc.createElement("style"); st.id = "colibri-gen-theme"; (doc.head || doc.documentElement).appendChild(st); } st.textContent = G.css(t.gen);
      const a = G.attrs(t.gen); if (opts.setScheme === false) delete a["data-theme"]; for (const [k, v] of Object.entries(a)) root.setAttribute(k, v);
      root.dataset.bridge = t.source; return {};
    }
    if (opts.setScheme !== false && t.scheme) root.dataset.theme = t.scheme;
    const tok = tokens(t, opts.setScheme === false ? root.dataset.theme : t.scheme);
    for (const [k, v] of Object.entries(tok)) root.style.setProperty(k, String(v));
    root.dataset.bridge = t.source; return tok;
  }
  const store = { get() { try { return validate(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { return null; } }, set(t) { localStorage.setItem(KEY, JSON.stringify(t)); }, clear() { localStorage.removeItem(KEY); } };
  function luminance(h) { return lum(h); }
  window.ColibriBridge = { KEY, encode, decode, validate, read, link, safeReturn, okOrigin, tokens, apply, store, luminance, hue,
    COLIBRIA: (document.currentScript && document.currentScript.dataset.colibria) || "https://colibria.ai/" };
  // ---- auto mode (dashboards etc.): adopt an incoming #colibri= link, else a stored one, before first paint ----
  const me = document.currentScript;
  if (me && me.hasAttribute("data-auto")) {
    const inc = read(); let t = inc && inc.theme;
    if (t) { store.set(t); if (inc.ret) sessionStorage.setItem("colibri-bridge-return", inc.ret); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
    t = t || store.get();
    if (t) {
      apply(document.documentElement, t);
      if (me.dataset.auto !== "quiet" && window.top === window) addEventListener("DOMContentLoaded", () => banner(t));
    }
  }
  function banner(t) {
    const ret = sessionStorage.getItem("colibri-bridge-return"), kitStudio = (me.dataset.studio || "/studio/");
    const el = document.createElement("div"); el.className = "cb-banner"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Colibria palette");
    const back = ret || window.ColibriBridge.COLIBRIA;
    el.innerHTML = `<style>.cb-banner{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 12px;border-radius:14px;background:#171322ee;color:#f4f0ff;font:500 13px/1.2 Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 12px 40px -12px #000a;backdrop-filter:blur(10px);max-width:calc(100vw - 24px);flex-wrap:wrap}.cb-banner img{width:20px;height:20px;border-radius:5px}.cb-banner .sw{display:flex}.cb-banner .sw i{width:14px;height:14px;border-radius:50%;margin-left:-4px;border:2px solid #171322}.cb-banner a,.cb-banner button{color:#f4f0ff;background:#ffffff14;border:1px solid #ffffff22;border-radius:9px;padding:6px 10px;font:inherit;text-decoration:none;cursor:pointer}.cb-banner a:hover,.cb-banner button:hover{background:#ffffff26}</style>
      <img src="/colibri-mark.svg" alt=""><span>${t.source === "colibria" ? "Palette from Colibria" : "Kit palette"}${t.name ? ": <b>" + t.name.replace(/</g, "&lt;") + "</b>" : ""}</span><span class="sw">${t.colors.slice(0, 6).map((c) => `<i style="background:${c}"></i>`).join("")}</span>
      <a href="${link(back, { ...t, source: "colibri-kit" }, location.href.split("#")[0])}">${ret ? "← Back to Colibria" : "Edit in Colibria ↗"}</a><a href="${link(kitStudio, t)}">Tune in Studio</a><button type="button" aria-label="Remove palette">✕</button>`;
    el.querySelector("button").onclick = () => { store.clear(); sessionStorage.removeItem("colibri-bridge-return"); location.reload(); };
    document.body.append(el);
  }
})();
