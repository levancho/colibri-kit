// Colour-contrast gate for every shipped palette (npm run check:contrast).
//
// Renders a fixture of real component markup with the real stylesheets in headless Chrome, so light-dark(),
// oklch(), color-mix() and the cascade are resolved by the browser, then measures what is painted:
//   text        4.5:1 (3:1 for large text: 24px, or 18.66px bold)               WCAG 1.4.3
//   ui          3:1 for control boundaries (input borders)                      WCAG 1.4.11
//   focus       3:1 for the focus indicator against the adjacent background     WCAG 1.4.11 / 2.4.7
// Matrix: Colibri CSS, the Colibri UI theme on its own, and both joined by the bridge; default look and every theme
// pack; every accent preset; light, dark and (where the stack follows it) the operating-system dark mode.
// Exit code 1 lists every violation. Uses CHROME (or /usr/bin/google-chrome) like the browser tests.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import url from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const executablePath = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
const verbose = process.argv.includes("--verbose");
// Optional filters for local work, e.g. --stack=ui --pack=ember --scheme=dark --preset=orange (CI runs everything).
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = { stack: arg("stack"), pack: arg("pack"), scheme: arg("scheme"), preset: arg("preset") };

const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (path.relative(ROOT, file).startsWith("..") || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader("Content-Type", file.endsWith(".css") ? "text/css" : file.endsWith(".html") ? "text/html" : "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const PACKS = ["", "glacier", "ember", "midnight"];
const PRESETS = ["", "blue", "green", "rose", "orange", "violet"];
const SCHEMES = ["light", "dark"];

// ---- fixtures -------------------------------------------------------------------------------------------------
// data-c: space-separated checks; data-n: a readable name for the report.
const cssSet = (where) => `
  <p data-c="text" data-n="${where}: body text">Body text</p>
  <p data-c="text" data-n="${where}: muted text" style="color:var(--c-muted)">Muted text</p>
  <p class="field"><span class="hint" data-c="text" data-n="${where}: field hint">Hint</span></p>
  <a href="#x" data-c="text focus" data-n="${where}: link">Link</a>
  <span class="badge" data-c="text" data-n="${where}: badge">Badge</span>
  <span class="badge" data-tone="accent" data-c="text" data-n="${where}: badge accent">Accent</span>
  <span class="badge" data-tone="ok" data-c="text" data-n="${where}: badge ok">Ok</span>
  <span class="badge" data-tone="warn" data-c="text" data-n="${where}: badge warn">Warn</span>
  <span class="badge" data-tone="bad" data-c="text" data-n="${where}: badge bad">Bad</span>
  <input aria-label="field" data-c="ui focus" data-n="${where}: text input">
  <select aria-label="choice" data-c="ui" data-n="${where}: select"><option>One</option></select>
  <textarea aria-label="area" data-c="ui" data-n="${where}: textarea"></textarea>
  <button class="btn" data-c="text focus" data-n="${where}: button primary">Save</button>
  <button class="btn" data-variant="danger" data-c="text" data-n="${where}: button danger">Delete</button>
  <button class="btn" data-variant="soft" data-c="text" data-n="${where}: button soft">Soft</button>
  <button class="btn" data-variant="outline" data-c="text" data-n="${where}: button outline">Outline</button>
  <button class="btn" data-variant="ghost" data-c="text" data-n="${where}: button ghost">Ghost</button>
  <p style="color:var(--c-ok)" data-c="text" data-n="${where}: ok text">Saved</p>
  <p style="color:var(--c-warn)" data-c="text" data-n="${where}: warn text">Careful</p>
  <p style="color:var(--c-bad)" data-c="text" data-n="${where}: bad text">Failed</p>`;
const cssFixture = `
  <main>${cssSet("page")}
    <div class="card">${cssSet("card")}</div>
    <div style="background:var(--c-sunken);padding:8px">${cssSet("sunken")}</div>
    ${["", "ok", "warn", "bad"].map((t) => `<div class="callout" ${t ? `data-tone="${t}"` : ""}><p data-c="text" data-n="callout ${t || "accent"}">Callout text <a href="#x" data-c="text" data-n="callout ${t || "accent"} link">link</a></p></div>`).join("")}
  </main>`;

const uiSet = (where) => `
  <p data-c="text" data-n="${where}: text">Text</p>
  <p data-c="text" data-n="${where}: muted text" style="color:var(--ui-muted-foreground)">Muted</p>
  <p data-c="text" data-n="${where}: success text" style="color:var(--ui-success)">Saved</p>
  <p data-c="text" data-n="${where}: warning text" style="color:var(--ui-warning)">Careful</p>
  <p data-c="text" data-n="${where}: destructive text" style="color:var(--ui-destructive)">Failed</p>
  <button data-ui="button" data-c="text focus" data-n="${where}: button">Save</button>
  <button data-ui="button" data-variant="destructive" data-c="text" data-n="${where}: button destructive">Delete</button>
  <button data-ui="button" data-variant="outline" data-c="text" data-n="${where}: button outline">Outline</button>
  <button data-ui="button" data-variant="secondary" data-c="text" data-n="${where}: button secondary">Secondary</button>
  <button data-ui="button" data-variant="ghost" data-c="text" data-n="${where}: button ghost">Ghost</button>
  ${["solid", "soft", "surface", "outline", "classic", "ghost"].map((l) => `<button data-ui="button" data-look="${l}" data-c="text" data-n="${where}: button look ${l}">${l}</button>`).join("")}
  <span data-ui-part="badge" data-c="text" data-n="${where}: badge">Badge</span>
  <span data-ui-part="badge" data-variant="secondary" data-c="text" data-n="${where}: badge secondary">Secondary</span>
  <span data-ui-part="badge" data-variant="destructive" data-c="text" data-n="${where}: badge destructive">Destructive</span>
  <span data-ui-part="badge" data-variant="outline" data-c="text" data-n="${where}: badge outline">Outline</span>
  ${["solid", "soft", "surface", "outline"].map((l) => `<span data-ui="badge" data-look="${l}" data-c="text" data-n="${where}: badge look ${l}">${l}</span>`).join("")}
  <input aria-label="field" data-c="ui focus" data-n="${where}: text input">
  <select aria-label="choice" data-c="ui" data-n="${where}: select"><option>One</option></select>
  <a href="#x" data-c="text focus" data-n="${where}: link">Link</a>`;
const uiFixture = `
  <main class="ui-root">${uiSet("page")}
    <div data-ui="card">${uiSet("card")}</div>
    <div style="background:var(--ui-muted);padding:8px">${uiSet("muted")}</div>
    ${["", "success", "warning", "danger", "neutral"].map((t) => `<div data-ui="callout" ${t ? `data-tone="${t}"` : ""}><p data-c="text" data-n="callout ${t || "primary"}">Callout text</p></div>`).join("")}
    <div data-ui="tooltip"><button data-ui-part="trigger">t</button><div data-ui-part="content" data-c="text" data-n="tooltip">Tooltip</div></div>
    <div data-ui="field" data-invalid><span data-ui-part="label" data-c="text" data-n="invalid field label">Email</span><p data-ui-part="error" data-c="text" data-n="field error">Required</p></div>
  </main>`;

// ---- stacks ---------------------------------------------------------------------------------------------------
const link = (href) => `<link rel="stylesheet" href="${origin}/${href}">`;
const STACKS = {
  css: { sheets: ["packages/colibri-css/dist/colibri.css", "packages/colibri-css/dist/colibri-applications.css", "themes/packs/index.css"], fixture: cssFixture, presets: [""], system: true, app: [false, true] },
  ui: { sheets: ["themes/colibri.css", "themes/knobs.css", "themes/packs/index.css"], fixture: uiFixture, presets: PRESETS, system: false, app: [false] },
  bridge: { sheets: ["packages/colibri-css/dist/colibri.css", "themes/colibri.css", "themes/knobs.css", "themes/packs/index.css", "packages/colibri-css/dist/colibri-ui-bridge.css"], fixture: uiFixture + cssFixture, presets: PRESETS, system: true, app: [false] },
};

function measure() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#0000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const stops = (img) => (img.match(/(rgba?|oklch|oklab|lab|lch|color)\([^()]*(\([^()]*\)[^()]*)*\)/g) || []);
  // Every background an element can sit on: ancestors' colours composited from the canvas up. A gradient
  // contributes each of its stops, so the worst stop is measured.
  function backgrounds(el) {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    // The page canvas follows the root's used color-scheme (dark schemes paint a dark Canvas).
    const probe = document.createElement("i"); probe.style.cssText = "position:absolute;background:Canvas"; document.documentElement.append(probe);
    const canvasColor = rgba(getComputedStyle(probe).backgroundColor); probe.remove();
    let layers = [[canvasColor]];
    const rootBg = rgba(getComputedStyle(document.documentElement).backgroundColor);
    if (rootBg[3] > 0) layers = [[over(rootBg, canvasColor)]];
    for (const e of chain.reverse()) {
      if (e === document.documentElement) continue;
      const s = getComputedStyle(e), bc = rgba(s.backgroundColor), g = s.backgroundImage.includes("gradient") ? stops(s.backgroundImage).map(rgba) : [];
      if (bc[3] === 0 && !g.length) continue;
      const base = layers[layers.length - 1], filled = bc[3] > 0 ? base.map((u) => over(bc, u)) : base;
      layers.push(g.length ? g.flatMap((c) => filled.map((u) => over(c, u))) : filled);
    }
    return layers[layers.length - 1];
  }
  const out = [];
  for (const el of document.querySelectorAll("[data-c]")) {
    const s = getComputedStyle(el), checks = el.dataset.c.split(" "), name = el.dataset.n;
    if (s.display === "none" || s.visibility === "hidden") continue;
    if (checks.includes("text")) {
      const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700, large = size >= 24 || (bold && size >= 18.66);
      const need = large ? 3 : 4.5, fg = rgba(s.color);
      for (const bg of backgrounds(el)) out.push({ kind: "text", name, need, ratio: ratio(over(fg, bg), bg), fg: hex(over(fg, bg)), bg: hex(bg) });
    }
    if (checks.includes("ui")) {
      const parentBgs = backgrounds(el.parentElement), border = rgba(s.borderTopColor);
      if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none") for (const bg of parentBgs) out.push({ kind: "ui", name: name + " border", need: 3, ratio: ratio(over(border, bg), bg), fg: hex(over(border, bg)), bg: hex(bg) });
      else out.push({ kind: "ui", name: name + " border", need: 3, ratio: 0, fg: "none", bg: "-" });
    }
  }
  return out;
}

async function focusRing(page, el) {
  // Programmatic focus after a key press matches :focus-visible, like keyboard focus.
  await page.keyboard.press("Shift");
  return el.evaluate((e) => {
    e.focus();
    const s = getComputedStyle(e);
    // The indicator is the outline when there is one; otherwise the border colour change (inputs).
    return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? { by: "outline", color: s.outlineColor } : { by: "border", color: s.borderTopColor };
  });
}

const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
const failures = [], seen = new Set();
let configs = 0, measured = 0;
try {
  const page = await browser.newPage();
  for (const [stackName, stack] of Object.entries(STACKS)) {
    if (only.stack && only.stack !== stackName) continue;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">${stack.sheets.map(link).join("")}<style>*,*::before,*::after{transition:none!important;animation:none!important}</style></head><body>${stack.fixture}</body></html>`;
    await page.setContent(html, { waitUntil: "load" });
    for (const pack of PACKS) for (const preset of stack.presets) for (const app of stack.app)
      for (const scheme of [...SCHEMES, ...(stack.system ? ["system-dark"] : [])]) {
        if ((only.pack != null && only.pack !== (pack || "none")) || (only.scheme && only.scheme !== scheme) || (only.preset != null && only.preset !== (preset || "none"))) continue;
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme === "system-dark" ? "dark" : "light" }]);
        await page.evaluate(({ pack, preset, scheme, app }) => {
          const h = document.documentElement;
          if (pack) h.dataset.kitTheme = pack; else delete h.dataset.kitTheme;
          if (preset) h.dataset.uiTheme = preset; else delete h.dataset.uiTheme;
          if (scheme === "system-dark") delete h.dataset.theme; else h.dataset.theme = scheme;
          document.body.classList.toggle("colibri-application", app);
          document.activeElement?.blur?.();
        }, { pack, preset, scheme, app });
        const label = `${stackName}${pack ? ` +${pack}` : ""}${preset ? ` preset=${preset}` : ""}${app ? " +application" : ""} ${scheme}`;
        configs++;
        const results = await page.evaluate(measure);
        for (const el of await page.$$("[data-c~=focus]")) {
          const ring = await focusRing(page, el);
          const name = await el.evaluate((e) => e.dataset.n);
          const r = await el.evaluate((e, color) => {
            const cv = document.createElement("canvas"); cv.width = cv.height = 1; const ctx = cv.getContext("2d", { willReadFrequently: true });
            const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#0000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
            const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
            const probe = document.createElement("i"); probe.style.cssText = "position:absolute;background:Canvas"; document.documentElement.append(probe);
            let bg = rgba(getComputedStyle(probe).backgroundColor); probe.remove();
            const chain = []; for (let x = e.parentElement; x; x = x.parentElement) chain.unshift(x);
            for (const x of chain) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) bg = [0, 1, 2].map((i) => c[i] * c[3] + bg[i] * (1 - c[3])).concat(1); }
            const f = rgba(color), fc = [0, 1, 2].map((i) => f[i] * f[3] + bg[i] * (1 - f[3]));
            const [a, b] = [lum(fc), lum(bg)].sort((p, q) => q - p);
            return { ratio: (a + 0.05) / (b + 0.05), fg: "#" + fc.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""), bg: "#" + bg.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") };
          }, ring.color);
          results.push({ kind: "focus", name: `${name} focus ${ring.by}`, need: 3, ...r });
        }
        await page.evaluate(() => document.activeElement?.blur?.());
        for (const r of results) {
          measured++;
          if (r.ratio + 1e-6 < r.need) {
            const key = `${label} | ${r.name} | ${r.fg} on ${r.bg}`;
            if (!seen.has(key)) { seen.add(key); failures.push({ label, ...r }); }
          } else if (verbose) console.log(`ok ${label} | ${r.name} ${r.ratio.toFixed(2)}`);
        }
      }
  }
} finally {
  await browser.close(); server.close();
}
if (failures.length) {
  for (const f of failures) console.log(`FAIL ${f.label} | ${f.name}: ${f.ratio.toFixed(2)}:1 < ${f.need}:1 (${f.fg} on ${f.bg})`);
  console.log(`\n${failures.length} contrast violations in ${configs} palette configurations (${measured} measurements).`);
  process.exit(1);
}
console.log(`ok contrast: ${measured} measurements across ${configs} palette configurations meet WCAG AA (text 4.5:1, large text, controls and focus 3:1)`);
