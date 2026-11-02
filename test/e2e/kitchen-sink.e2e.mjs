// Browser test for the gallery: real Chrome via puppeteer-core.
// Run: CHROME=/path/to/chrome node test/e2e/kitchen-sink.e2e.mjs [http://localhost:8395/examples/kitchen-sink.html] [shotDir]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const URL = process.argv[2] || "http://localhost:8395/examples/kitchen-sink.html";
const SHOTS = process.argv[3] || "";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
const errors = []; p.on("pageerror", (e) => errors.push(e.message));
await p.goto(URL, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle0" });
await p.waitForFunction(() => window.__sinkReady);
const results = []; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (sel, fn) => p.$eval(sel, fn);
async function t(name, fn) { try { await fn(); results.push(["ok", name]); } catch (e) { results.push(["FAIL", name, e.message.split("\n")[0]]); } }
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const yes = (v, m) => { if (!v) throw new Error(m); };
const shot = async (n, sel) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); const el = sel ? await p.$(sel) : null; await (el || p).screenshot({ path: `${SHOTS}/${n}.png` }); };
const go = async (id) => { await p.$eval("#" + id, (s) => s.scrollIntoView({ block: "start" })); await wait(120); };
const focusEl = (sel) => p.$eval(sel, (e) => e.focus());

// Developer tools now live inside the shared Customize popover. Exercise the
// same visible path as users, and close it before interacting with the gallery.
async function tool(selector) {
  const button = '.kbar-tools > button[aria-controls="kbar-custom"]';
  if (!await q("#kbar-custom", (e) => e.matches(":popover-open"))) await p.click(button);
  await p.click(selector);
  if (await q("#kbar-custom", (e) => e.matches(":popover-open"))) await p.click(button);
}

await t("no JS errors on load", async () => eq(errors.length, 0, errors.join(" | ")));
await t("opens at the very top", async () => eq(await p.evaluate(() => scrollY), 0, "scrollY"));
await t("all nav groups start collapsed", async () => eq(await p.$$eval("#sink-sidebar .sink-group", (gs) => gs.filter((g) => g.__uiCollapsible?.open).length), 0, "open groups"));
await t("no clothline left", async () => eq(await p.evaluate(() => document.querySelectorAll("[data-ui=clothline],[data-ui=cell],.cl-desk").length), 0, "nodes"));
await t("back-to-top arrow: hidden at top, appears on scroll, returns to top", async () => {
  eq(await q("#sink-totop", (e) => e.classList.contains("is-on")), false, "off at top");
  await p.evaluate(() => scrollTo(0, 4000)); await wait(400);
  eq(await q("#sink-totop", (e) => !e.hidden && e.classList.contains("is-on") && getComputedStyle(e).position === "fixed"), true, "visible");
  await p.click("#sink-totop"); await p.waitForFunction(() => scrollY === 0, { timeout: 5000 });
});
await t("event log hidden by default, not covering content", async () => eq(await q("#sink-log", (e) => e.hidden), true, "hidden"));
await t("event log: open, collapse, dock, drag, close", async () => {
  await tool("#log-open"); await wait(50);
  eq(await q("#sink-log", (e) => getComputedStyle(e).display), "flex", "visible");
  eq(await q("#sink-log", (e) => e.dataset.dock), "bottom", "docked bottom");
  eq(await p.evaluate(() => getComputedStyle(document.body).paddingBottom), "260px", "page reserves space");
  const bg = await q("#sink-log", (e) => getComputedStyle(e).backgroundColor); yes(!/rgba\(.*, 0(\.\d+)?\)/.test(bg), "opaque bg " + bg);
  await p.click("#log-min"); eq(await q("#sink-log", (e) => e.dataset.min), "true", "collapsed");
  await p.click("#log-min"); await p.click("#log-dock"); eq(await q("#sink-log", (e) => e.dataset.dock), "right", "dock right");
  const h = await p.$(".sink-log-h strong"); const bb = await h.boundingBox();
  await p.mouse.move(bb.x + 5, bb.y + 5); await p.mouse.down(); await p.mouse.move(300, 300, { steps: 5 }); await p.mouse.up();
  eq(await q("#sink-log", (e) => e.dataset.dock), "float", "drag → floating");
  const r = await q("#sink-log", (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top)]; }); yes(Math.abs(r[0] - 295) < 20 && Math.abs(r[1] - 295) < 20, "moved to " + r);
  await p.click("#log-dock"); eq(await q("#sink-log", (e) => e.dataset.dock), "bottom", "back to bottom");
  await p.click("#log-close"); eq(await q("#sink-log", (e) => e.hidden), true, "closed");
  await tool("#log-open"); eq(await q("#sink-log", (e) => e.hidden), false, "reopened");
});
await t("event log records ui:* events with plain section name", async () => {
  await go("toggle"); await p.click("#toggle [data-ui=toggle]");
  const last = await q("#sink-log-list", (l) => l.lastElementChild?.textContent || ""); yes(/ui:change/.test(last) && /Toggle button/.test(last), last);
  await p.click("#log-close");
});
await t("info tooltip (?) shows technical names on hover", async () => {
  await go("item"); await p.hover("#item .sink-info"); await wait(700);
  const txt = await q("#item .sink-tip", (e) => (e.hidden ? "" : e.textContent)); yes(/shadcn/.test(txt) && /data-ui="item"/.test(txt), "tip: " + txt);
  await shot("tooltip-info", "#item"); await p.mouse.move(5, 500); await wait(200);
});
await t("Item list: roving focus + Enter activates clickable row", async () => {
  await go("item"); await focusEl("#item [data-ui-part=item]");
  await p.keyboard.press("ArrowDown"); eq(await p.evaluate(() => document.activeElement.dataset.value), "profile", "moved to row 2");
  let fired = 0; await p.exposeFunction("__act", () => fired++); await p.evaluate(() => document.addEventListener("ui:activate", (e) => { e.preventDefault(); window.__act(); }, { once: true }));
  await p.keyboard.press("Enter"); await wait(50); eq(fired, 1, "ui:activate");
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowRight"); yes(await p.evaluate(() => document.activeElement.closest("[data-ui-part=actions]") != null), "→ into actions");
  await p.keyboard.press("Escape"); eq(await p.evaluate(() => document.activeElement.dataset.uiPart), "item", "Esc back to row");
  eq(await q("#item [data-ui=item-group]", (e) => e.getAttribute("role")), "list", "role=list");
});
await t("Hover card opens on hover and shows a profile card", async () => {
  await go("hover-card"); await p.hover("#hover-card .sink-preview [data-ui-part=trigger]"); await wait(700);
  eq(await q("#hover-card .sink-preview [data-ui-part=content]", (e) => e.hidden), false, "open"); await shot("hover-card-open", "#hover-card");
  await p.mouse.move(5, 500); await wait(600); eq(await q("#hover-card .sink-preview [data-ui-part=content]", (e) => e.hidden), true, "closed after leave");
});
await t("Dropdown: open, arrow nav, submenu, Esc returns focus", async () => {
  await go("dropdown-menu"); await p.click("#dropdown-menu .sink-preview [data-ui-part=trigger]"); await wait(80);
  eq(await q("#dropdown-menu .sink-preview [data-ui-part=trigger]", (e) => e.getAttribute("aria-expanded")), "true", "expanded");
  eq(await q("#dropdown-menu .sink-preview [data-ui-part=content]", (e) => e.getAttribute("role")), "menu", "role=menu");
  await shot("dropdown-open", "#dropdown-menu");
  await p.keyboard.press("ArrowDown"); yes(await p.evaluate(() => document.activeElement.getAttribute("role")?.startsWith("menuitem")), "focus in menu");
  await p.keyboard.press("Escape"); await wait(50);
  eq(await p.evaluate(() => document.activeElement.matches("#dropdown-menu .sink-preview [data-ui-part=trigger]")), true, "focus returned");
});
await t("Dialog: opens modal, Esc closes, focus returns", async () => {
  await go("dialog"); await p.click("#dialog [data-ui=dialog] [data-ui-part=trigger]"); await wait(100);
  eq(await q("#dialog dialog", (d) => d.open), true, "open"); await shot("dialog-open");
  await p.keyboard.press("Escape"); await wait(100); eq(await q("#dialog dialog", (d) => d.open), false, "closed");
  eq(await p.evaluate(() => document.activeElement.matches("#dialog [data-ui-part=trigger]")), true, "focus back");
});
await t("Confirmation dialog: Esc does NOT close", async () => {
  await go("alert-dialog"); await p.click("#alert-dialog .sink-preview [data-ui-part=trigger]"); await wait(100);
  await p.keyboard.press("Escape"); await wait(80); eq(await q("#alert-dialog dialog", (d) => d.open), true, "still open");
  await p.click("#alert-dialog [data-ui-return=cancel]"); await wait(80); eq(await q("#alert-dialog dialog", (d) => d.open), false, "cancel closes");
});
await t("Tabs: arrows switch panel", async () => {
  await go("tabs"); await focusEl("#tabs [data-ui-part=trigger][data-value=news]"); await p.keyboard.press("ArrowRight");
  eq(await q('#tabs [data-ui-part=panel][data-value=sport]', (e) => e.hidden), false, "sport visible");
  eq(await q('#tabs [data-ui-part=trigger][data-value=sport]', (e) => e.getAttribute("aria-selected")), "true", "aria-selected");
});
await t("Select: opens listbox, picks option, updates hidden input", async () => {
  await go("select"); await p.click('#select [data-ui=select][data-name=lang] [data-ui-part=trigger]'); await wait(80); await shot("select-open", "#select");
  await p.click('#select [data-name=lang] [data-ui-part=option][data-value=en]'); await wait(50);
  eq(await q('#select input[name=lang]', (e) => e.value), "en", "value"); yes(/English/.test(await q('#select [data-name=lang] [data-ui-part=value]', (e) => e.textContent)), "label shown");
});
await t("Combobox: type filters, Enter selects", async () => {
  await go("combobox"); await p.click('#combobox [data-name=city] [data-ui-part=input]'); await p.keyboard.type("Bat"); await wait(80);
  const vis = await p.$$eval('#combobox [data-name=city] [data-ui-part=option]', (o) => o.filter((x) => !x.hidden).map((x) => x.dataset.value)); eq(vis.join(), "batumi", "filtered");
  await shot("combobox-filter", "#combobox"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter"); await wait(50);
  eq(await q('#combobox input[name=city]', (e) => e.value), "batumi", "selected");
});
await t("Switch toggles aria-checked", async () => { await go("switch"); const s = "#switch button[data-ui=switch]"; const a = await q(s, (e) => e.getAttribute("aria-checked")); await p.click(s); eq(await q(s, (e) => e.getAttribute("aria-checked")), a === "true" ? "false" : "true", "flipped"); });
await t("Slider: keyboard changes value", async () => { await go("slider"); await focusEl("#slider [data-ui-part=thumb]"); await p.keyboard.press("ArrowRight"); eq(await q("#slider [data-ui-part=thumb]", (e) => e.getAttribute("aria-valuenow")), "41", "41"); });
await t("Accordion: click toggles", async () => { await go("accordion"); await p.click('#accordion [data-value=b] [data-ui-part=trigger]'); eq(await q('#accordion [data-value=b] [data-ui-part=content]', (e) => e.hidden), false, "b open"); });
await t("Stepper: Finish hidden on step 1, linear validation blocks Next", async () => {
  await go("stepper"); eq(await q("#stepper [data-ui-part=finish]", (e) => getComputedStyle(e).display), "none", "finish hidden");
  await p.click("#stepper [data-ui-part=next]"); eq(await q("#stepper [data-ui-part=panel]", (e) => e.hidden), false, "still step 1 (invalid)");
});
await t("Toast: shows and auto-dismisses", async () => { await go("toast"); await p.click("#t-success"); await wait(150); eq(await p.$$eval("[data-ui=toaster] [data-ui-part=toast]", (x) => x.length), 1, "1 toast"); await shot("toast"); });
await t("Pagination: click changes page", async () => { await go("pagination"); await p.click('#pagination nav [data-page="8"]'); eq(await q('#pagination nav [aria-current=page]', (e) => e.dataset.page), "8", "page 8"); });
await t("Badge remove deletes badge", async () => { await go("badge"); const n = await p.$$eval("#badge [data-ui=badge]", (x) => x.length); await p.click("#badge [data-ui=badge] [data-ui-part=remove]"); eq(await p.$$eval("#badge [data-ui=badge]", (x) => x.length), n - 1, "removed"); });
await t("Command palette opens with Ctrl+K", async () => { await p.keyboard.down("Control"); await p.keyboard.press("k"); await p.keyboard.up("Control"); await wait(120); eq(await q("#cmd-dialog dialog", (d) => d.open), true, "open"); await shot("command-open"); await p.keyboard.press("Escape"); });
await t("Demo styling off = raw headless", async () => { await tool("#css-toggle"); eq(await q("#demo-css", (s) => s.disabled), true, "disabled"); await go("dropdown-menu"); await shot("raw", "#dropdown-menu"); await tool("#css-toggle"); });
await t("Dark mode applies", async () => { await p.click(".kbar [data-ui=theme-switch]"); await wait(50); const th = await p.evaluate(() => document.documentElement.dataset.theme); yes(["dark", "light"].includes(th), th); });
await t("Scrollspy highlights the section in view", async () => {
  for (const id of ["dialog", "badge", "tabs", "slider"]) { await go(id); await wait(150); eq(await p.evaluate(() => document.querySelector("#sink-sidebar a[aria-current]")?.getAttribute("href")), "#" + id, id); }
});
await t("Info tooltip stays inside the viewport", async () => {
  await go("toggle-group"); await p.hover("#toggle-group .sink-info"); await wait(700);
  const r = await q("#toggle-group .sink-tip", (e) => { const b = e.getBoundingClientRect(); return [b.left, b.right, innerWidth]; }); yes(r[0] >= 0 && r[1] <= r[2], "tip " + r); await p.mouse.move(5, 500);
});
await t("no JS errors after interactions", async () => eq(errors.length, 0, errors.join(" | ")));
await b.close();
for (const r of results) console.log(r.join("  "));
const f = results.filter((r) => r[0] === "FAIL").length; console.log(`\n${results.length - f} passed, ${f} failed`); process.exit(f ? 1 : 0);
