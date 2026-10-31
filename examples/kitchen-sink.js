// Kitchen-sink page glue (demo only, not part of the library).
const $ = (s, r = document) => r.querySelector(s);
const panel = $("#sink-log"), list = $("#sink-log-list"), count = $("#log-count"), openBtn = $("#log-open");
const LS = "colibri.sink.log";
const st = Object.assign({ open: false, min: false, dock: "bottom", x: null, y: null }, JSON.parse(localStorage.getItem(LS) || "{}"));
const save = () => localStorage.setItem(LS, JSON.stringify(st));
let n = 0;

// ---- event capture: wrap dispatchEvent so every ui:* CustomEvent is logged ----
const orig = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (e) {
  if (e.type?.startsWith("ui:") && e.type !== "ui:refresh") record(this, e);
  return orig.call(this, e);
};
function record(target, e) {
  n++; count.textContent = n > 999 ? "999+" : n;
  if (!st.open) return;
  const el = target.closest?.("[data-ui]") || target;
  const sec = el.closest?.(".sink-sec");
  let d = ""; try { d = JSON.stringify(e.detail, (k, v) => (v instanceof Node ? `<${v.nodeName.toLowerCase()}>` : v)); } catch {}
  const li = document.createElement("li");
  li.innerHTML = `<time></time><b></b><span class="sink-log-src"></span><code></code>`;
  li.children[0].textContent = new Date().toLocaleTimeString();
  li.children[1].textContent = e.type;
  li.children[2].textContent = sec ? sec.querySelector("h3").textContent : el.dataset?.ui || "";
  li.children[3].textContent = d && d !== "null" ? (d.length > 140 ? d.slice(0, 140) + "…" : d) : "";
  list.append(li); while (list.children.length > 200) list.firstChild.remove();
  list.scrollTop = list.scrollHeight;
}

// ---- panel: open/close, collapse, dock (bottom/right/float), drag ----
function render() {
  panel.hidden = !st.open; openBtn.setAttribute("aria-expanded", st.open);
  panel.dataset.dock = st.dock; panel.dataset.min = st.min;
  $("#log-min").textContent = st.min ? "▴" : "▾"; $("#log-min").setAttribute("aria-expanded", !st.min);
  $("#log-min").title = st.min ? "Expand" : "Collapse";
  if (st.dock === "float" && st.x != null) { panel.style.left = st.x + "px"; panel.style.top = st.y + "px"; }
  else { panel.style.left = panel.style.top = ""; }
  document.body.dataset.log = st.open && !st.min ? st.dock : "none"; // reserves page space when docked
}
openBtn.onclick = () => { st.open = !st.open; st.min = false; save(); render(); };
$("#log-close").onclick = () => { st.open = false; save(); render(); openBtn.focus(); };
$("#log-min").onclick = () => { st.min = !st.min; save(); render(); };
$("#log-clear").onclick = () => { list.textContent = ""; n = 0; count.textContent = 0; };
$("#log-dock").onclick = () => { st.dock = { bottom: "right", right: "float", float: "bottom" }[st.dock]; if (st.dock === "float" && st.x == null) { st.x = innerWidth - 460; st.y = 90; } save(); render(); };
$(".sink-log-h").addEventListener("pointerdown", (e) => {
  if (e.target.closest("button")) return;
  const r = panel.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
  st.dock = "float"; st.x = r.left; st.y = r.top; render();
  const mv = (m) => { st.x = Math.max(0, Math.min(innerWidth - 120, m.clientX - ox)); st.y = Math.max(0, Math.min(innerHeight - 40, m.clientY - oy)); panel.style.left = st.x + "px"; panel.style.top = st.y + "px"; };
  const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); save(); };
  addEventListener("pointermove", mv); addEventListener("pointerup", up); e.preventDefault();
});
render();

// ---- library ----
const { init } = await import("../src/core/auto.js");
const { toast } = await import("../src/core/base.js");
await import("../src/elements/all.js");
init();

// ---- page controls ----
$("#css-toggle").onchange = (e) => { $("#demo-css").disabled = !e.target.checked; document.documentElement.dataset.raw = !e.target.checked; };
// (component finder is wired in the left-nav block at the end of this file)
const modeLabel = () => document.querySelectorAll(".mode-label").forEach((s) => { const m = $("[data-ui=theme-switch]")?.dataset.mode || "system"; s.textContent = m[0].toUpperCase() + m.slice(1); });
document.addEventListener("ui:change", modeLabel); modeLabel();

// ---- demo wiring ----
const on = (id, f) => document.getElementById(id)?.addEventListener("click", f);
on("t-default", () => toast({ title: "შენახულია", description: "სტატია განახლდა." }));
on("t-success", () => toast({ title: "წარმატება", description: "Profile saved.", variant: "success" }));
on("t-error", () => toast({ title: "შეცდომა", description: "სერვერი მიუწვდომელია", variant: "error", duration: 6000 }));
on("t-action", () => toast({ title: "სტატია წაიშალა", action: { label: "დაბრუნება", onClick: () => toast({ title: "აღდგენილია", variant: "success" }) } }));
on("t-promise", () => toast.promise(new Promise((r) => setTimeout(r, 2000)), { loading: "იტვირთება…", success: "დასრულდა", error: "ვერ მოხერხდა" }));
on("loading-btn", (e) => { const b = e.currentTarget, api = b.__uiButton || b.colibri; if (api && "loading" in api) { api.loading = true; setTimeout(() => (api.loading = false), 2000); } else { b.disabled = true; b.setAttribute("aria-busy", "true"); b.dataset.state = "loading"; setTimeout(() => { b.disabled = false; b.removeAttribute("aria-busy"); delete b.dataset.state; }, 2000); } });
let m = 9;
on("msg-add", () => { const v = $("[data-ui=message-scroller] [data-ui-part=viewport]"); v.insertAdjacentHTML("beforeend", `<div data-ui-part="message" data-from="${m % 2 ? "me" : "them"}"><span data-ui-part="bubble">შეტყობინება ${m++}</span></div>`); });
window.__sinkReady = true;

// ---- theming + motion controls (tokens only; no JS inside components) ----
const H = document.documentElement, TS = "colibri.sink.tokens";
const tok = Object.assign({ accent: "", radius: "8px", motion: true }, JSON.parse(localStorage.getItem(TS) || "{}"));
const applyTok = () => {
  tok.accent ? (H.dataset.uiTheme = tok.accent) : delete H.dataset.uiTheme;
  H.style.setProperty("--ui-radius", tok.radius);
  tok.motion ? delete H.dataset.uiMotion : (H.dataset.uiMotion = "off");
  $("#accent").value = tok.accent; $("#radius").value = tok.radius; $("#motion-toggle").checked = tok.motion;
  localStorage.setItem(TS, JSON.stringify(tok));
};
$("#accent").onchange = (e) => { tok.accent = e.target.value; applyTok(); };
$("#radius").onchange = (e) => { tok.radius = e.target.value; applyTok(); };
$("#motion-toggle").onchange = (e) => { tok.motion = e.target.checked; applyTok(); };
applyTok();
$("#css-toggle").addEventListener("change", (e) => { $("#motion-css").disabled = !e.target.checked; });

// ---- motion gallery ----
const { play, register } = await import("../src/core/motion.js");
register("swing", { in: [{ opacity: 0, transform: "rotate(-12deg)", transformOrigin: "top center" }, { offset: 0.6, transform: "rotate(6deg)" }, { opacity: 1, transform: "none" }], out: [{ opacity: 1 }, { opacity: 0, transform: "rotate(10deg)" }] });
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-motion-toggle]"); if (t) { const box = document.getElementById(t.dataset.motionToggle); box.hidden = !box.hidden; t.setAttribute("aria-pressed", String(!box.hidden)); t.textContent = box.hidden ? "Show" : "Hide"; }
  const pl = e.target.closest("[data-motion-play-btn]"); if (pl) play(document.getElementById(pl.dataset.target), pl.dataset.motionPlayBtn);
  if (e.target.closest("#mo-all")) document.querySelectorAll("#motion [data-motion-toggle]").forEach((b) => b.click());
});
$("#mo-invalid")?.addEventListener("submit", (e) => { e.preventDefault(); const i = e.target.querySelector("input"); if (!i.value) { i.setAttribute("aria-invalid", "true"); play(e.target, "shake"); } else { i.removeAttribute("aria-invalid"); toast({ title: "OK", variant: "success" }); } });

// ---- Clothline demo: reset desk ----
const clDesk = document.querySelector(".cl-desk"); const clInit = clDesk?.innerHTML;
document.getElementById("cl-reset")?.addEventListener("click", () => { clDesk.innerHTML = clInit; document.dispatchEvent(new Event("ui:refresh")); });

// ---- Conversation + AI elements demos (demo-only wiring; components themselves are generic) ----
const byId = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
byId("att-step")?.addEventListener("click", () => { const a = byId("att-up"); if (!a) return; const p = Math.min(100, (+a.dataset.progress || 0) + 25); a.dataset.progress = p; a.querySelector("[data-ui-part=description]").textContent = p >= 100 ? "JPG · 1.1 MB" : `Uploading… ${p}%`; });
byId("qn")?.addEventListener("ui:submit", (e) => { byId("qn-out").textContent = JSON.stringify(e.detail.answers); });
byId("ctx-range")?.addEventListener("input", (e) => { const c = document.querySelector('[data-ui=context]'); c.dataset.used = e.target.value; });
byId("rs-run")?.addEventListener("click", async () => { const r = byId("rs-demo"), t = byId("rs-text"); r.querySelector("[data-ui-part=label]").textContent = "Thinking…"; r.dataset.status = "streaming"; t.textContent = "";
  for (const w of "The user wants the blocked accounts. Check block=1 in dsp2_users, then comprofiler approval flags.".split(" ")) { t.textContent += w + " "; await sleep(90); } r.dataset.duration = "3"; r.dataset.status = "done"; });
setTimeout(() => { const r = byId("rs-demo"); if (r && r.dataset.status === "streaming") { r.dataset.duration = "2"; r.dataset.status = "done"; } }, 2500);
byId("term-run")?.addEventListener("click", async () => { const t = byId("term-demo"), api = t.__uiAgent; t.dataset.status = "running"; t.__uiAgent.open();
  for (const l of ["▶ clothline.test.js", "  ✔ labels + roles", "  ✔ hang moves the cell", "▶ ai.test.js", "  ✔ prompt input submits", "ℹ pass 5  fail 0", ""]) { api.write(l + "\n"); await sleep(250); } t.dataset.status = "completed"; });
byId("pi-demo")?.addEventListener("ui:submit", (e) => { toast?.({ title: "Prompt sent", description: e.detail.text + (e.detail.files.length ? ` (+${e.detail.files.length} file)` : "") }); });
// chat: append the user's message, stream a fake reply, Send becomes Stop meanwhile
byId("chat-pi")?.addEventListener("ui:submit", async (e) => {
  const vp = byId("chat-vp"), pi = byId("chat-pi"); let stop = false; const onStop = () => (stop = true); pi.addEventListener("ui:stop", onStop, { once: true });
  const add = (from, html) => { const m = document.createElement("div"); m.dataset.ui = "message"; m.dataset.from = from; m.innerHTML = `<div data-ui-part="content"><div data-ui="bubble" data-variant="${from === "user" ? "primary" : "ghost"}"><div data-ui-part="content"></div></div></div>`; m.querySelector("[data-ui-part=content] [data-ui-part=content]").textContent = html; vp.append(m); document.dispatchEvent(new CustomEvent("ui:refresh")); return m.querySelector("[data-ui-part=content] [data-ui-part=content]"); };
  add("user", e.detail.text); pi.dataset.status = "streaming"; await sleep(300);
  const out = add("assistant", ""); out.dataset.shimmer = "";
  for (const w of `Colibri is headless: JS adds behaviour and ARIA, your CSS decides the look. You asked: “${e.detail.text}”.`.split(" ")) { if (stop) break; out.textContent += w + " "; vp.scrollTop = vp.scrollHeight; await sleep(70); }
  delete out.dataset.shimmer; pi.dataset.status = "ready"; pi.removeEventListener("ui:stop", onStop);
});
// auth blocks: pretend server (accepts anything valid; "taken@example.com" is already registered)
document.addEventListener("ui:submit", async (e) => {
  const f = e.target.closest?.("[data-ui=auth-form]"); if (!f) return; const api = f.__uiAuth;
  if (e.detail.values.email === "taken@example.com") { e.preventDefault(); api.setErrors({ email: "This email is already registered" }); api.setStatus("Please fix the highlighted fields.", "error"); return; }
  const msg = { password: "Signed in. Enter the code we sent.", "magic-link": "Link sent!", forgot: "Reset link sent.", otp: "Verified.", signup: "Account created. Check your email for a code." }[e.detail.view];
  if (msg) setTimeout(() => api.setStatus(msg, "success"), 30);
});
document.addEventListener("ui:provider", (e) => toast?.({ title: `Continue with ${e.detail.provider}`, description: "Your OAuth redirect goes here." }));

// ---- left nav: collapsible groups (Colibri Collapsible), remembered open state, filter, expand/collapse all ----
{
  const NK = "colibri.sink.navGroups", groups = [...document.querySelectorAll("#sink-sidebar .sink-group")];
  const api = (g) => g.__uiCollapsible;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(NK) || "null"); } catch {}
  const save = () => localStorage.setItem(NK, JSON.stringify(groups.filter((g) => api(g)?.open).map((g) => g.dataset.group)));
  const activeGroup = () => document.querySelector('#sink-sidebar [data-ui-part=link][aria-current]')?.closest(".sink-group");
  groups.forEach((g, i) => { const a = api(g); if (a) a.open = saved ? saved.includes(g.dataset.group) : i === 0; });
  let filtering = false;
  document.querySelector("#sink-sidebar").addEventListener("ui:open", (e) => { if (!filtering && groups.includes(e.target)) save(); });
  document.querySelector("#sink-sidebar").addEventListener("ui:close", (e) => { if (!filtering && groups.includes(e.target)) save(); });
  // keep the group of the section in view open (without persisting it)
  document.querySelector("#sink-sidebar [data-ui=scrollspy]").addEventListener("ui:change", (e) => { const id = e.detail?.id, g = id ? document.querySelector(`#sink-sidebar [data-ui-part=link][href="#${CSS.escape(id)}"]`)?.closest(".sink-group") : null; if (g && !api(g).open && !filtering) { filtering = true; api(g).open = true; filtering = false; } });
  const g0 = activeGroup(); if (g0 && !api(g0).open) { filtering = true; api(g0).open = true; filtering = false; }
  document.getElementById("nav-expand").onclick = () => { groups.forEach((g) => (api(g).open = true)); save(); };
  document.getElementById("nav-collapse").onclick = () => { groups.forEach((g) => (api(g).open = false)); save(); };
  // filter: show matching links, open groups that match, restore saved state when cleared
  const f = document.getElementById("sink-filter");
  f.addEventListener("input", () => {
    const q = f.value.trim().toLowerCase(); filtering = true;
    groups.forEach((g) => {
      let n = 0; g.querySelectorAll("[data-ui-part=link]").forEach((l) => { const hit = !q || l.textContent.toLowerCase().includes(q) || l.getAttribute("href").slice(1).includes(q); l.hidden = !hit; n += hit; });
      g.hidden = !!q && !n; g.querySelector(".sink-count").textContent = q ? n : g.querySelectorAll("[data-ui-part=link]").length;
      if (q) api(g).open = n > 0;
    });
    if (!q) { let s = []; try { s = JSON.parse(localStorage.getItem(NK) || "[]"); } catch {} groups.forEach((g, i) => (api(g).open = s.length ? s.includes(g.dataset.group) : i === 0)); }
    filtering = false;
  });
  f.addEventListener("keydown", (e) => { if (e.key === "Escape" && f.value) { e.stopPropagation(); f.value = ""; f.dispatchEvent(new Event("input")); } if (e.key === "Enter") { const l = document.querySelector("#sink-sidebar [data-ui-part=link]:not([hidden])"); if (l) { l.click(); } } });
}

// ---- Colibri CSS previews: per-frame colour scheme (system / light / dark) ----
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ccss-theme]"); if (!b) return;
  const f = document.getElementById(b.dataset.for), d = f?.contentDocument?.documentElement; if (!d) return;
  b.dataset.ccssTheme === "system" ? d.removeAttribute("data-theme") : d.setAttribute("data-theme", b.dataset.ccssTheme);
  b.parentElement.querySelectorAll("[data-ccss-theme]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
});

// ---- Spinner + Button group demos ----
{
  const run = document.getElementById("sp-run"), sp = document.getElementById("sp-live"), msg = document.getElementById("sp-msg");
  run?.addEventListener("click", () => { const a = sp.__uiSpinner; a.start(); run.disabled = true; msg.textContent = ""; setTimeout(() => { a.stop(); run.disabled = false; msg.textContent = "Loaded 24 rows"; }, 1800); });
  const out = document.getElementById("bg-out"), v = (id) => document.getElementById(id)?.__uiButtonGroup?.value;
  const show = () => { const s = v("bg-style"); out.textContent = `Align: ${v("bg-align") ?? "none"} · Style: ${s?.length ? s.join(", ") : "none"} · View: ${v("bg-view") ?? "none"}`; };
  document.querySelectorAll(".bg-demo [data-ui=button-group]").forEach((g) => g.addEventListener("ui:change", show));
  document.getElementById("bg-actions")?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) out.textContent = `Action: ${b.textContent}`; });
}
