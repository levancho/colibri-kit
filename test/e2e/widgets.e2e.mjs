// Kitchen-sink left nav: collapsible groups, persisted state, filter, scrollspy auto-open
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const URL = process.argv[2] || "http://localhost:8395/examples/kitchen-sink.html";
const SHOTS = process.argv[3] || "";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL, { waitUntil: "networkidle0" });
let fail = 0; const ok = (c, m) => { console.log((c ? "ok  " : "FAIL") + " " + m); if (!c) fail++; };
// Spinner
const sp = await p.evaluate(() => { const s = document.querySelector("#spinner [data-ui=spinner]"); const cs = getComputedStyle(s, "::before");
  return { role: s.getAttribute("role"), label: s.querySelector("[data-ui-part=label]")?.textContent, anim: cs.animationName, iter: cs.animationIterationCount, w: s.getBoundingClientRect().width,
    dots: document.querySelectorAll("#spinner [data-variant=dots] [data-ui-part=dot]").length, group: document.querySelector('#sink-sidebar a[href="#spinner"]')?.closest(".sink-group").dataset.group }; });
ok(sp.role === "status" && sp.label === "Loading…", "spinner role=status + hidden label");
ok(sp.anim === "ui-spinner-rot" && sp.iter === "infinite" && sp.w > 10, "spinner ring animates infinitely, visible " + JSON.stringify(sp));
ok(sp.dots === 3, "dots variant renders 3 dots"); ok(sp.group === "Base", "spinner listed under Basics");
await p.evaluate(() => document.documentElement.setAttribute("data-ui-motion", "off"));
ok(await p.evaluate(() => getComputedStyle(document.querySelector("#spinner [data-ui=spinner]"), "::before").animationIterationCount) === "infinite", "still spins with Animations off");
await p.evaluate(() => document.documentElement.removeAttribute("data-ui-motion"));
await p.evaluate(() => document.getElementById("sp-run").click());
ok(await p.evaluate(() => !document.getElementById("sp-live").hidden), "start() shows live spinner");
await new Promise((r) => setTimeout(r, 2000));
ok(await p.evaluate(() => document.getElementById("sp-live").hidden && /Loaded/.test(document.getElementById("sp-msg").textContent)), "stop() hides it");
// Button group
const st = (id) => p.evaluate((id) => [...document.querySelectorAll(`#${id} > button`)].map((b) => b.getAttribute("aria-pressed") + "/" + b.tabIndex).join(" "), id);
ok(await p.evaluate(() => { const g = document.getElementById("bg-align"); return g.getAttribute("role") === "group" && g.getAttribute("aria-label") === "Text align"; }), "group role + label");
ok((await st("bg-align")) === "false/-1 true/0 false/-1", "default value center pressed, single tab stop");
await p.click('#bg-align [data-value=right]');
ok((await st("bg-align")).startsWith("false/-1 false/-1 true/0") && await p.evaluate(() => document.querySelector('#bg-align input[name=align]').value === "right"), "click selects right + hidden input");
await p.click('#bg-align [data-value=right]'); ok((await st("bg-align")).includes("true"), "required: cannot unselect");
await p.focus('#bg-align [data-value=right]'); await p.keyboard.press("ArrowRight");
ok(await p.evaluate(() => document.activeElement.dataset.value) === "left", "ArrowRight wraps to first");
await p.keyboard.press("End"); ok(await p.evaluate(() => document.activeElement.dataset.value) === "right", "End");
await p.keyboard.press("Home"); await p.keyboard.press(" ");
ok(await p.evaluate(() => document.getElementById("bg-align").__uiButtonGroup.value) === "left", "Space toggles focused button");
await p.click('#bg-style [data-value=italic]');
ok(JSON.stringify(await p.evaluate(() => document.getElementById("bg-style").__uiButtonGroup.value)) === '["bold","italic"]', "multiple");
await p.focus('#bg-style [data-value=underline]'); await p.keyboard.press("ArrowRight");
ok(await p.evaluate(() => document.activeElement.dataset.value) === "bold", "disabled button skipped");
await p.focus('#bg-view [data-value=list]'); await p.keyboard.press("ArrowDown");
ok(await p.evaluate(() => document.activeElement.dataset.value) === "grid", "vertical uses ArrowDown");
ok(/Align: left · Style: bold, italic/.test(await p.evaluate(() => document.getElementById("bg-out").textContent)), "ui:change drives output");
const joined = await p.evaluate(() => { const bs = [...document.querySelectorAll("#bg-align > button")].map((b) => b.getBoundingClientRect()); const cs = getComputedStyle(document.querySelector("#bg-align > button:nth-child(2)")); return [Math.round(bs[1].left - bs[0].right), cs.borderTopLeftRadius, getComputedStyle(document.querySelector("#bg-align > button")).borderTopLeftRadius]; });
ok(joined[0] <= 0 && joined[1] === "0px" && joined[2] !== "0px", "joined styling " + joined);
for (const scheme of ["light", "dark"]) {
  await p.evaluate((s) => document.documentElement.setAttribute("data-theme", s), scheme); await p.mouse.move(5, 5); await new Promise((r) => setTimeout(r, 400));
  const c = await p.evaluate(() => { const on = document.querySelector('#bg-align [aria-pressed=true]'), off = document.querySelector('#bg-align [aria-pressed=false]'); return [getComputedStyle(on).backgroundColor, getComputedStyle(off).backgroundColor, getComputedStyle(on).color]; });
  ok(c[0] !== c[1] && c[0] !== c[2], `${scheme}: pressed segment differs from unpressed ` + c.join(" | "));
  await p.click('#bg-actions button:nth-child(2)'); await p.mouse.move(5, 5); await new Promise((r) => setTimeout(r, 300));
  const a = await p.evaluate(() => { const x = document.querySelector('#bg-actions button:nth-child(2)'), y = document.querySelector('#bg-actions button:nth-child(1)'); return [x.dataset.state, getComputedStyle(x).backgroundColor, getComputedStyle(y).backgroundColor]; });
  ok(a[0] === "activated" && a[1] !== a[2], `${scheme}: clicked action is visibly marked ` + a.join(" | "));
}
await b.close(); console.log(fail ? fail + " failed" : "all widget checks passed"); process.exit(fail ? 1 : 0);
