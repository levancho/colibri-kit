// Browser test: conversation, AI elements, sidebar + auth blocks, drawer drag. Same runner style as kitchen-sink.e2e.mjs.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const URL = process.argv[2] || "http://localhost:8395/examples/kitchen-sink.html";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900 });
const errors = []; p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await p.goto(URL, { waitUntil: "networkidle0" }); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle0" });
await p.waitForFunction(() => window.__sinkReady);
const results = [], wait = (ms) => new Promise((r) => setTimeout(r, ms)), q = (s, f) => p.$eval(s, f);
async function t(name, fn) { try { await fn(); results.push(["ok", name]); } catch (e) { results.push(["FAIL", name, e.message.split("\n")[0]]); } }
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const yes = (v, m) => { if (!v) throw new Error(m); };
const go = async (id) => { await p.$eval("#" + id, (s) => s.scrollIntoView({ block: "start" })); await wait(150); };

await t("no JS errors on load", async () => eq(errors.length, 0, errors.join(" | ")));
await t("sidebar-07 collapses to icons and back", async () => {
  await go("sidebar-07"); const w0 = await q("#sb07", (e) => e.getBoundingClientRect().width);
  await p.click('#sidebar-07 [data-ui-sidebar-toggle="#sb07"].sb-icon-btn'); await wait(350);
  eq(await q("#sb07", (e) => e.dataset.state), "collapsed", "state"); const w1 = await q("#sb07", (e) => e.getBoundingClientRect().width);
  yes(w1 < 60 && w0 > 200, `widths ${w0} → ${w1}`); eq(await q("#sb07 .sb-text", (e) => getComputedStyle(e).display), "none", "labels hidden");
  eq(await q('#sidebar-07 .sb-icon-btn[data-ui-sidebar-toggle]', (e) => e.getAttribute("aria-expanded")), "false", "aria-expanded");
  await p.click('#sidebar-07 [data-ui-sidebar-toggle="#sb07"].sb-icon-btn'); await wait(350); eq(await q("#sb07", (e) => e.dataset.state), "expanded", "re-expanded");
});
await t("sidebar-01 offcanvas hides completely", async () => {
  await go("sidebar-01"); await p.click('#sidebar-01 .sb-icon-btn'); await wait(350);
  eq(Math.round(await q("#sb01", (e) => e.getBoundingClientRect().width)), 0, "width 0"); await p.click('#sidebar-01 .sb-icon-btn');
});
await t("sidebar-05 collapsible submenu toggles", async () => {
  await go("sidebar-05"); const trig = '#sidebar-05 li[data-ui=collapsible] > [data-ui-part=trigger]';
  const before = await q(trig, (e) => e.getAttribute("aria-expanded")); await p.click(trig); eq(await q(trig, (e) => e.getAttribute("aria-expanded")), before === "true" ? "false" : "true", "toggled");
});
await t("sidebar-13 opens a dialog with sidebar nav", async () => {
  await go("sidebar-13"); await p.click("#sidebar-13 [data-ui=dialog] > [data-ui-part=trigger]"); await wait(200);
  eq(await q("#sidebar-13 dialog", (e) => e.open), true, "open"); await p.keyboard.press("Escape"); await wait(200); eq(await q("#sidebar-13 dialog", (e) => e.open), false, "closed");
});
await t("sidebar-11 file tree keyboard", async () => {
  await go("sidebar-11"); await p.$eval("#sidebar-11 [role=treeitem]", (e) => e.focus()); await p.keyboard.press("ArrowDown");
  eq(await p.evaluate(() => document.activeElement.dataset.path), "app/api", "moved into folder");
});
await t("login-01: invalid → errors; valid → OTP view → verify → done", async () => {
  await go("login-01"); await p.click("#lg01 [data-view=password] button[type=submit]"); await wait(50);
  eq(await q('#lg01 [name=email]', (e) => e.getAttribute("aria-invalid")), "true", "email invalid"); eq(await q("#lg01 [data-ui-part=status]", (e) => e.dataset.tone), "error", "status");
  await p.type("#lg01 [name=email]", "levan@despani.ge"); await p.type("#lg01 [name=password]", "admin1");
  await p.click("#lg01 [data-view=password] button[type=submit]"); await wait(80);
  eq(await q("#lg01 [data-view=otp]", (e) => e.hidden), false, "otp shown");
  await p.click("#lg01 [data-view=otp] button[type=submit]"); await wait(50); eq(await q("#lg01 [data-view=otp]", (e) => e.hidden), false, "needs code");
  await p.$eval("#lg01 [data-ui=pin-input] input", (e) => e.focus()); await p.keyboard.type("123456"); await p.click("#lg01 [data-view=otp] button[type=submit]"); await wait(80);
  eq(await q("#lg01 [data-view=done]", (e) => e.hidden), false, "done");
});
await t("login-01: forgot password view and back", async () => {
  await p.$eval("#lg01", (f) => f.__uiAuth.show("password")); await p.$eval("#lg01 [data-ui-auth-view=forgot]", (e) => e.scrollIntoView({ block: "center" })); await wait(100); await p.click("#lg01 [data-ui-auth-view=forgot]"); await wait(50);
  eq(await q("#lg01 [data-view=forgot]", (e) => e.hidden), false, "forgot visible"); eq(await p.evaluate(() => document.activeElement.name), "email", "focus email");
  await p.click("#lg01 [data-view=forgot] [data-ui-auth-view=password]"); eq(await q("#lg01 [data-view=password]", (e) => e.hidden), false, "back");
});
await t("signup-01: password confirmation mismatch", async () => {
  await go("signup-01"); await p.type("#su01 [name=name]", "Levan"); await p.type("#su01 [name=email]", "taken@example.com");
  await p.type("#su01 [name=password]", "longpassword"); await p.type("#su01 [name=confirm]", "different1"); await p.click("#su01 [name=terms]");
  await p.click("#su01 [data-view=signup] button[type=submit]"); await wait(50);
  eq(await q("#su01 [name=confirm]", (e) => e.getAttribute("aria-invalid")), "true", "confirm invalid");
  await p.$eval("#su01 [name=confirm]", (e) => (e.value = "")); await p.type("#su01 [name=confirm]", "longpassword"); await p.click("#su01 [data-view=signup] button[type=submit]"); await wait(80);
  yes((await q("#su01 [name=email]", (e) => e.closest("[data-ui=field]").textContent)).includes("already registered"), "server error shown on email");
});
await t("login-03: provider button emits ui:provider", async () => {
  await go("login-03"); const got = await p.evaluate(() => new Promise((r) => { document.addEventListener("ui:provider", (e) => r(e.detail.provider), { once: true }); document.querySelector('#lg03 [data-provider=google]').click(); })); eq(got, "google", "provider");
});
await t("chat: Enter sends, reply streams, Send→Stop→Send", async () => {
  await go("chat"); await p.type("#chat-pi textarea", "hello"); await p.keyboard.press("Enter"); await wait(150);
  eq(await q("#chat-pi", (e) => e.dataset.status), "streaming", "streaming"); eq(await q("#chat-pi [data-ui-part=submit]", (e) => e.getAttribute("aria-label")), "Stop", "stop label");
  await wait(2500); eq(await q("#chat-pi", (e) => e.dataset.status), "ready", "ready");
  yes((await q("#chat-vp", (e) => e.textContent)).includes("You asked"), "reply text");
});
await t("suggestion fills chat input", async () => { await p.click("#chat [data-ui=suggestion] [data-ui-part=item]"); eq(await q("#chat-pi textarea", (e) => e.value), "What is headless?", "filled"); });
await t("questionnaire end-to-end", async () => {
  await go("questionnaire"); await p.click("#qn [data-ui-part=next]"); yes(await q("#qn fieldset [data-ui-part=error]", (e) => e.textContent.length > 0), "required error");
  await p.click('#qn [data-value=review]'); await p.click("#qn [data-ui-part=next]"); await p.click("#qn [data-value=web]"); await p.click("#qn [data-ui-part=next]");
  await p.click("#qn [data-ui-part=submit]"); await wait(50); yes((await q("#qn-out", (e) => e.textContent)).includes('"direction":"review"'), "answers");
});
await t("reasoning streams then folds to 'Thought for'", async () => {
  await go("reasoning"); await p.click("#rs-run"); await wait(200); eq(await q("#rs-demo", (e) => e.dataset.state), "open", "open while streaming");
  await wait(2600); yes((await q("#rs-demo [data-ui-part=label]", (e) => e.textContent)).startsWith("Thought for"), "label"); eq(await q("#rs-demo", (e) => e.dataset.state), "closed", "auto-closed");
});
await t("terminal streams output", async () => { await go("terminal"); await p.click("#term-run"); await wait(2000); yes((await q("#term-out", (e) => e.textContent)).includes("pass 5"), "output"); eq(await q("#term-demo", (e) => e.dataset.status), "completed", "status"); });
await t("confirmation approve", async () => { await go("confirmation"); await p.click("#confirmation [data-ui-part=approve]"); eq(await q("#confirmation [data-ui=confirmation]", (e) => e.dataset.status), "approved", "approved"); });
await t("chart has bars and accessible table", async () => { await go("chart"); yes((await p.$$("#chart rect[data-ui-part=series]")).length === 12, "12 bars"); eq(await q("#chart svg", (e) => e.getAttribute("role")), "img", "role"); });
await t("drawer: drag down dismisses", async () => {
  await go("drawer"); await p.click('#drawer [data-ui=drawer] > [data-ui-part=trigger]'); await wait(300);
  const box = await (await p.$('#drawer [data-ui=drawer] [data-ui-part=handle]')).boundingBox(); yes(box, "handle visible");
  await p.mouse.move(box.x + box.width / 2, box.y + 2); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2, box.y + 220, { steps: 8 }); await p.mouse.up(); await wait(400);
  eq(await q('#drawer [data-ui=drawer] dialog', (e) => e.open), false, "closed by drag");
});
await t("no JS errors after interactions", async () => eq(errors.length, 0, errors.join(" | ")));
for (const r of results) console.log(r[0] === "ok" ? "ok " : "FAIL", r[1], r[2] || "");
console.log(`\n${results.filter((r) => r[0] === "ok").length} passed, ${results.filter((r) => r[0] !== "ok").length} failed`);
await b.close(); process.exit(results.some((r) => r[0] !== "ok") ? 1 : 0);
