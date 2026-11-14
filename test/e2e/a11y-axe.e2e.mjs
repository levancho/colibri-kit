// axe-core over the built kitchen sink and blocks pages, light and dark (WCAG 2.0-2.2 A/AA rules).
// Run npm run build first. Fails on any violation not in KNOWN below. Each KNOWN entry names the file that has to
// change; remove the entry when that file is fixed so the rule guards it from then on.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";
import { serveBuild } from "./server.mjs";

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const executablePath = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
const PAGES = ["kitchen-sink/examples/kitchen-sink.html", "kitchen-sink/examples/blocks/index.html", "kitchen-sink/examples/blocks/hero.html",
  "kitchen-sink/examples/blocks/pricing.html", "kitchen-sink/examples/blocks/signup.html"];
// Empty: every finding of the first run was fixed (ai.js, base.js, gallery chrome, demo markup, blocks.css). Add an
// entry only with a comment that justifies it and names the file that has to change.
const KNOWN = [];

const server = await serveBuild();
const browser = await puppeteer.launch({ executablePath, args: ["--no-sandbox"] });
const found = [];
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 900 });
  for (const path of PAGES) for (const scheme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    await page.goto(`${server.origin}/${path}`, { waitUntil: "networkidle0" });
    await page.evaluate((scheme) => { const h = document.documentElement; h.dataset.theme = scheme; h.style.colorScheme = scheme; }, scheme);
    await page.evaluate(axeSource);
    const violations = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return r.violations.flatMap((v) => v.nodes.map((n) => ({ id: v.id, target: n.target.join(" "), html: n.html.slice(0, 140), why: n.failureSummary.replace(/\s+/g, " ").slice(0, 220) })));
    });
    for (const v of violations) found.push({ page: path.split("/").pop(), scheme, ...v });
  }
} finally { await browser.close(); await server.close(); }

const known = found.filter((v) => KNOWN.some((k) => k.id === v.id && k.target.test(v.target)));
const unexpected = found.filter((v) => !known.includes(v));
for (const v of unexpected) console.log(`FAIL ${v.page} ${v.scheme} ${v.id} ${v.target}\n     ${v.html}\n     ${v.why}`);
assert.equal(unexpected.length, 0, `${unexpected.length} axe violations in components (see above)`);
console.log(`ok axe: no violations in components on ${PAGES.length} pages x light/dark (${known.length} known issues listed in KNOWN)`);
