// Opens every demo of the React Native catalog in a browser (through react-native-web) and reports problems.
//
//   node tools/native-smoke.mjs                 every group
//   node tools/native-smoke.mjs forms ai        only these groups (ids from examples/native/demos/index.js)
//   node tools/native-smoke.mjs forms --shots /tmp/shots    also save a screenshot of each demo (light and dark)
//
// It builds its own bundle in a temporary folder, so several runs can go on at once.
// A demo fails if it throws, logs an error or warning, or renders nothing.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), shotsAt = args.indexOf("--shots");
const shots = shotsAt >= 0 ? path.resolve(args[shotsAt + 1]) : null;
const wanted = args.filter((arg, index) => !arg.startsWith("--") && !(shotsAt >= 0 && index === shotsAt + 1));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "colibri-native-"));
execFileSync(process.execPath, [path.join(root, "tools/build-native-demo.mjs"), path.join(dir, "demo.js")], { stdio: "pipe" });
fs.writeFileSync(path.join(dir, "index.html"), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="app" style="display:flex;height:100vh"></div><script src="/demo.js"></script>');
const server = http.createServer((req, res) => {
  const file = path.join(dir, new URL(req.url, "http://x").pathname === "/demo.js" ? "demo.js" : "index.html");
  res.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : "text/html"); fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync), args: ["--no-sandbox"] });
let failed = 0, total = 0;
try {
  const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
  let problems = [];
  page.on("pageerror", (error) => problems.push("threw: " + error.message));
  page.on("console", (message) => ["error", "warning"].includes(message.type()) && problems.push(`${message.type()}: ${message.text().slice(0, 300)}`));
  await page.goto(origin + "/"); await page.waitForFunction(() => "nativeReady" in document.documentElement.dataset);
  const catalog = await page.evaluate(() => globalThis.ColibriNativeCatalog);
  const unknown = wanted.filter((id) => !catalog.some((group) => group.id === id));
  if (unknown.length) throw new Error(`Unknown or empty group: ${unknown.join(", ")}. Groups with demos: ${catalog.map((group) => group.id).join(", ")}`);
  if (shots) fs.mkdirSync(shots, { recursive: true });
  for (const group of catalog.filter((entry) => !wanted.length || wanted.includes(entry.id))) {
    for (const demo of group.demos) {
      total++; problems = [];
      for (const key of ["id", "title", "description"]) if (!demo[key]) problems.push(`missing ${key}`);
      await page.goto(`${origin}/#${demo.id}`); await page.reload();
      await page.waitForFunction(() => "nativeReady" in document.documentElement.dataset);
      const found = await page.waitForSelector(`[data-testid="demo-${demo.id}"]`, { timeout: 5000 }).catch(() => null);
      if (!found) problems.push("demo screen did not appear");
      await new Promise((resolve) => setTimeout(resolve, 250));
      const size = await page.evaluate(() => { const scroller = document.querySelector('[data-testid^="demo-"]')?.lastElementChild; return scroller ? scroller.textContent.length + scroller.querySelectorAll("*").length : 0; });
      if (found && size < 8) problems.push("rendered almost nothing");
      if (shots) {
        await page.screenshot({ path: path.join(shots, `${group.id}-${demo.id}.png`) });
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
        await new Promise((resolve) => setTimeout(resolve, 120));
        await page.screenshot({ path: path.join(shots, `${group.id}-${demo.id}-dark.png`) });
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
      }
      if (problems.length) failed++;
      console.log(`${problems.length ? "FAIL" : "ok  "} ${group.id}/${demo.id}${problems.length ? "\n       " + [...new Set(problems)].join("\n       ") : ""}`);
    }
  }
} finally { await browser.close(); server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
console.log(`${total - failed} of ${total} demos passed`);
process.exit(failed ? 1 : 0);
