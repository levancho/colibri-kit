// Kitchen-sink left nav: collapsible groups, persisted state, filter, scrollspy auto-open
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const URL = process.argv[2] || "http://localhost:8395/examples/kitchen-sink.html";
const SHOTS = process.argv[3] || "";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle0" });
let fail = 0; const ok = (c, m) => { console.log((c ? "ok  " : "FAIL") + " " + m); if (!c) fail++; };
const st = () => p.evaluate(() => [...document.querySelectorAll("#sink-sidebar .sink-group")].map((g) => g.dataset.group + ":" + g.dataset.state));
let s = await st(); ok(s.length >= 5 && s.filter((x) => x.endsWith(":open")).length <= 2, "groups collapsible, mostly closed by default " + s.length);
await p.click("#nav-collapse"); await p.evaluate(() => document.querySelectorAll("#sink-sidebar .sink-group-trigger")[2].click());
const g2 = (await st())[2]; ok(g2.endsWith(":open"), "trigger opens group");
await p.reload({ waitUntil: "networkidle0" }); ok((await st())[2].endsWith(":open"), "open state persisted across reload");
await p.click("#nav-collapse"); s = await st(); ok(s.every((x) => x.endsWith(":closed")) || s.filter((x)=>x.endsWith(":open")).length<=1, "collapse all");
await p.click("#nav-expand"); ok((await st()).every((x) => x.endsWith(":open")), "expand all");
await p.click("#nav-collapse");
await p.type("#sink-filter", "accord");
const vis = await p.evaluate(() => [...document.querySelectorAll("#sink-sidebar [data-ui-part=link]")].filter((l) => l.offsetParent).map((l) => l.textContent));
ok(vis.length >= 1 && vis.every((t) => /accord/i.test(t)), "filter shows matches only: " + vis.join(","));
await p.keyboard.press("Escape"); ok(await p.evaluate(() => !document.getElementById("sink-filter").value), "Escape clears filter");
const last = await p.evaluate(() => { const ls = document.querySelectorAll("#sink-sidebar [data-ui-part=link]"); const l = [...ls].find((x) => x.closest(".sink-group").dataset.group === "AI Elements"); document.querySelector(l.getAttribute("href")).scrollIntoView(); return l.getAttribute("href"); });
await new Promise((r) => setTimeout(r, 1200));
console.log(await p.evaluate((h)=>{const l=document.querySelector(`#sink-sidebar a[href="${h}"]`);const a=document.querySelector("#sink-sidebar [aria-current]");return [h,a?.getAttribute("href"),l.closest(".sink-group").dataset.state,scrollY]},last));
ok(await p.evaluate((h) => { const l = document.querySelector('#sink-sidebar a[href="' + h + '"]'); return l.getAttribute("aria-current") === "location" && l.closest(".sink-group").dataset.state === "open"; }, last), "scrollspy tracks nested links + auto-opens their group");
const css = await p.evaluate(async () => {
  const fs = [...document.querySelectorAll(".ccss-frame")]; const f = document.getElementById("f-css-dark");
  document.querySelector('[data-ccss-theme=dark][data-for=f-css-dark]').click(); await new Promise((r) => setTimeout(r, 100));
  const d = f.contentDocument; const sheetOk = fs.every((x) => [...x.contentDocument.styleSheets].some((s) => s.href?.includes("colibri-css/dist/colibri.css")));
  return { n: fs.length, sheetOk, dark: d.documentElement.dataset.theme, scheme: getComputedStyle(d.documentElement).colorScheme,
    layers: [...d.styleSheets].some((s) => [...s.cssRules].some((r) => r.constructor.name === "CSSLayerStatementRule")) };
});
ok(css.n >= 10 && css.sheetOk, "Colibri CSS previews load the package stylesheet (" + css.n + ")");
ok(css.dark === "dark" && css.scheme === "dark", "preview Dark switch sets data-theme + color-scheme");
ok(css.layers, "colibri.css declares cascade layers");
ok(!errs.length, "no page errors " + errs.join("|"));
await b.close(); console.log(fail ? fail + " failed" : "all nav checks passed"); process.exit(fail ? 1 : 0);
