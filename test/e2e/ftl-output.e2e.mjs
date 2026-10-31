// Checks that FreeMarker macro output (examples/ftl-output.html, rendered from test/ftl/demo.ftl) initialises with no errors.
import puppeteer from "puppeteer-core"; import fs from "node:fs";
const URL = process.argv[2] || "http://localhost:8395/examples/ftl-output.html";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] }); const p = await b.newPage();
const errors = []; p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
await p.goto(URL, { waitUntil: "networkidle0" }); await p.waitForFunction(() => window.__ok);
const r = await p.evaluate(() => {
  const all = [...document.querySelectorAll("[data-ui]")]; const un = all.filter((e) => !Object.keys(e).some((k) => k.startsWith("__ui")) && !["aspect-ratio", "menubar-menu"].includes(e.dataset.ui)).map((e) => e.dataset.ui);
  return { total: all.length, uninit: un, roles: ["tablist", "menu", "listbox", "slider", "grid", "switch", "progressbar", "combobox", "list", "radiogroup", "menubar"].filter((r) => !document.querySelector(`[role=${r}]`)),
    hiddenInputs: [...document.querySelectorAll("input[type=hidden][name]")].map((i) => i.name).join(",") };
});
await b.close(); console.log(JSON.stringify(r)); console.log("errors:", errors);
const bad = errors.length || r.uninit.length; console.log(bad ? "FAIL" : "ok: all macro output initialised"); process.exit(bad ? 1 : 0);
