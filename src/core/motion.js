// Colibri UI motion runtime (optional; pairs with themes/motion.css).
// Enter animations are pure CSS. Exits need this file: when an element that has --ui-motion-out gets [hidden]
// (any component, unchanged), a non-interactive ghost copy plays the exit and is removed, so component state
// and focus logic stay synchronous. Also: play(el, name) one-shots and register(name, {in, out}) at runtime.
const reduced = (doc) => doc.documentElement.dataset.uiMotion === "off" || doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const ms = (v, d) => { v = (v || "").trim(); return v.endsWith("ms") ? parseFloat(v) : v.endsWith("s") ? parseFloat(v) * 1000 : d; };

function ghostExit(el) {
  const doc = el.ownerDocument, cs = doc.defaultView.getComputedStyle(el);
  const out = cs.getPropertyValue("--ui-motion-out").trim();
  if (!out || out === "none" || reduced(doc) || !el.isConnected) return;
  // custom properties inherit: only animate the element that declares the exit, not its descendants
  const par = el.parentElement && doc.defaultView.getComputedStyle(el.parentElement).getPropertyValue("--ui-motion-out").trim();
  if (par === out && !el.hasAttribute("data-ui-motion") && !el.hasAttribute("data-ui-motion-exit")) return;
  const g = el.cloneNode(true);
  g.removeAttribute("hidden"); g.removeAttribute("id"); g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  g.setAttribute("aria-hidden", "true"); g.inert = true; g.dataset.motionState = "exit"; g.dataset.motionGhost = "";
  // The ghost is a picture of the element, not a second copy of its controls: a cloned checked radio with the
  // same name would uncheck the real one, and named clones would be submitted with the form.
  for (const n of [g, ...g.querySelectorAll("[name],[form]")]) { n.removeAttribute("name"); n.removeAttribute("form"); }
  el.after(g);
  const done = () => g.remove();
  g.addEventListener("animationend", done, { once: true });
  setTimeout(done, ms(cs.getPropertyValue("--ui-motion-duration"), 200) + 80); // safety net
}

/** Start exit animations for elements hidden anywhere in `root`. Idempotent. */
export function initMotion(root = document) {
  const doc = root.ownerDocument || root;
  if (doc.__uiMotion) return doc.__uiMotion;
  const MO = doc.defaultView?.MutationObserver; if (!MO) return null;
  const mo = new MO((recs) => {
    for (const r of recs) {
      const el = r.target;
      if (r.attributeName === "hidden" && el.hidden && r.oldValue === null && !el.dataset.motionGhost) ghostExit(el);
    }
  });
  mo.observe(doc.documentElement, { subtree: true, attributes: true, attributeFilter: ["hidden"], attributeOldValue: true });
  return (doc.__uiMotion = { disconnect: () => { mo.disconnect(); delete doc.__uiMotion; } });
}

/** One-shot animation by preset name (shake, bounce, pop, flash, heartbeat, tada, wiggle or any registered "ui-NAME" keyframes). */
export function play(el, name, { duration } = {}) {
  if (!el || reduced(el.ownerDocument)) return Promise.resolve();
  const kf = name.startsWith("ui-") ? name : name === "pop" ? "ui-pop-in" : `ui-${name}`;
  el.removeAttribute("data-motion-play"); void el.offsetWidth; // restart
  el.style.setProperty("--ui-motion-play", kf); if (duration) el.style.setProperty("--ui-motion-play-duration", `${duration}ms`);
  el.setAttribute("data-motion-play", name);
  return new Promise((res) => { const end = () => { el.removeAttribute("data-motion-play"); res(); }; el.addEventListener("animationend", end, { once: true }); setTimeout(end, (duration || 600) + 100); });
}

/** Register a preset at runtime: register("swing", { in: [{transform:"rotate(-8deg)",opacity:0},{}], out: [{},{opacity:0}] })
    Frames are Web-Animations-style objects (camelCase or kebab-case keys). Afterwards data-ui-motion="swing" works.
    Content-Security-Policy: the rules go into a constructed stylesheet (document.adoptedStyleSheets), which a strict
    style-src allows. Browsers without constructable stylesheets get a <style> element instead; under a strict policy
    pass the page's nonce, register(name, frames, document, { nonce }), or put it on <meta property="csp-nonce" nonce="…">.
    See docs/csp.md. */
export function register(name, { in: inFrames, out: outFrames } = {}, doc = document, { nonce } = {}) {
  const css = (frames) => frames.map((f, i) => `${f.offset != null ? f.offset * 100 : (i / Math.max(1, frames.length - 1)) * 100}%{${Object.entries(f).filter(([k]) => k !== "offset").map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`).join(";")}}`).join("");
  const rules = [];
  if (inFrames) rules.push(`@keyframes ui-${name}-in{${css(inFrames)}}`);
  if (outFrames) rules.push(`@keyframes ui-${name}-out{${css(outFrames)}}`);
  const map = [inFrames && `--ui-motion-in:ui-${name}-in`, outFrames && `--ui-motion-out:ui-${name}-out`].filter(Boolean);
  rules.push(`[data-ui-motion="${name}"]{${map.join(";")}}`, `[data-ui-motion-exit="${name}"]{--ui-motion-out:ui-${name}-out}`);
  addRules(doc, rules, nonce);
  return name;
}

/** The document's motion registry: a constructed, adopted stylesheet when the browser has them, else a <style>. */
function addRules(doc, rules, nonce) {
  const view = doc.defaultView;
  if (!doc.__uiMotionSheet && view?.CSSStyleSheet && "adoptedStyleSheets" in doc) {
    try { const sheet = new view.CSSStyleSheet(); doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet]; doc.__uiMotionSheet = sheet; } catch { /* no constructor: fall back */ }
  }
  const sheet = doc.__uiMotionSheet;
  if (sheet) {
    for (const rule of rules) { try { sheet.insertRule(rule, sheet.cssRules.length); } catch { /* invalid frames: skipped, as a <style> would */ } }
    return;
  }
  let s = doc.getElementById("ui-motion-registry");
  if (!s) {
    s = doc.createElement("style"); s.id = "ui-motion-registry";
    const n = nonce || doc.querySelector('meta[property="csp-nonce"]')?.nonce || doc.querySelector('meta[property="csp-nonce"]')?.getAttribute("content");
    if (n) s.nonce = n;
    doc.head.append(s);
  }
  s.append(rules.join("\n") + "\n");
}

/** Turn all motion on/off for the page (persists nothing; set data-ui-motion="off" on <html> yourself to persist). */
export const setMotion = (on, doc = document) => { on ? delete doc.documentElement.dataset.uiMotion : (doc.documentElement.dataset.uiMotion = "off"); };
