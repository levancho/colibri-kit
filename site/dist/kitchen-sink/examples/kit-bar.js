// Colibri Kit site chrome. Turns <header class="kbar" data-active="components|blocks|dashboards|studio|docs"> into the
// shared bar: brand + 5 nav items + page tools. Children marked [data-kbar-lead] go first (e.g. sidebar toggle),
// [data-kbar-tool] go right, everything in [data-kbar-custom] goes into a "Customize" popover.
const NAV = [["docs", "Docs", "/"], ["components", "Components", "/kitchen-sink/examples/kitchen-sink.html"], ["blocks", "Blocks", "/kitchen-sink/examples/blocks/"], ["dashboards", "Dashboards", "/kitchen-sink/examples/dashboards/"], ["studio", "Studio", "/studio/"]];
const WEBRANK_COUNTER = "https://webrank.ge/counter/22a6d81e48d60367f1cf.js?badge=aurora&t=aurora&m=hits,uniques,online";
const GH = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';
function setIcon() { // one favicon everywhere: the Colibria mark
  document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
  document.head.append(Object.assign(document.createElement("link"), { rel: "icon", type: "image/svg+xml", href: "/colibri-mark.svg" }));
}
export function mountKitBar(h = document.querySelector("header.kbar")) {
  if (!h || h.dataset.mounted) return; h.dataset.mounted = "";
  const lead = h.querySelector("[data-kbar-lead]"), tools = [...h.querySelectorAll("[data-kbar-tool]")], custom = h.querySelector("[data-kbar-custom]");
  const active = h.dataset.active;
  const frag = document.createDocumentFragment();
  if (lead) { lead.classList.add("kbar-lead"); frag.append(lead); }
  const brand = Object.assign(document.createElement("a"), { className: "kbar-brand", href: "/", innerHTML: "<i aria-hidden=\"true\"></i><b>Colibri Kit</b>" }); brand.setAttribute("aria-label", "Colibri Kit home"); frag.append(brand);
  const nav = document.createElement("nav"); nav.className = "kbar-nav"; nav.setAttribute("aria-label", "Colibri Kit");
  nav.innerHTML = NAV.map(([id, label, href]) => `<a href="${href}"${id === active ? ' aria-current="page"' : ""}>${label}</a>`).join(""); frag.append(nav);
  const sp = document.createElement("span"); sp.className = "kbar-sp"; frag.append(sp);
  const right = document.createElement("div"); right.className = "kbar-tools";
  tools.forEach((t) => right.append(t));
  if (custom) {
    const id = "kbar-custom"; const b = Object.assign(document.createElement("button"), { type: "button", className: "kbar-btn", innerHTML: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg><span class="kbar-hide-sm">Customize</span>' });
    b.setAttribute("aria-label", "Customize this page"); b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", id);
    const pop = document.createElement("div"); pop.id = id; pop.className = "kbar-pop"; pop.setAttribute("popover", ""); pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Customize this page");
    const heading = document.createElement("h4"); heading.textContent = custom.dataset.title || "Customize"; pop.append(heading); custom.removeAttribute("hidden"); pop.append(custom);
    const place = () => { const r = b.getBoundingClientRect(); pop.style.top = r.bottom + 8 + "px"; pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.right - pop.offsetWidth)) + "px"; };
    b.onclick = () => { pop.togglePopover?.(); };
    pop.addEventListener("toggle", (e) => { b.setAttribute("aria-expanded", String(e.newState === "open")); if (e.newState === "open") place(); });
    addEventListener("resize", () => pop.matches(":popover-open") && place());
    right.append(b); document.body.append(pop);
  }
  const gh = Object.assign(document.createElement("a"), { className: "kbar-btn kbar-icon", href: "https://github.com/levancho/colibri-kit", innerHTML: GH, target: "_blank", rel: "noopener" }); gh.setAttribute("aria-label", "Colibri Kit on GitHub");
  right.append(gh); frag.append(right);
  const sub = document.querySelector("nav.kbar-sub:not(.kpage-head *)");
  if (sub) { sub.classList.add("kbar-row2"); frag.append(sub); h.dataset.sub = "";
    const links = [...sub.querySelectorAll('a[href^="#"]')], io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + e.target.id))); }), { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const t = document.getElementById(a.getAttribute("href").slice(1)); t && io.observe(t); }); }
  h.replaceChildren(frag);
  const spc = document.createElement("div"); spc.className = "kbar-spacer" + (sub ? " has-sub" : ""); spc.setAttribute("aria-hidden", "true"); h.after(spc);
}
export function mountKitFoot() {
  if (document.querySelector(".kfoot") || document.querySelector("header.kbar")?.dataset.foot === "off") return;
  const f = document.createElement("footer"); f.className = "kfoot";
  f.innerHTML = `<div><b style="color:var(--kb-fg)">Colibri Kit</b><span>Modern CSS + tiny behaviours for server-rendered apps · MIT</span><span class="sp"></span>${NAV.map(([, l, h]) => `<a href="${h}">${l}</a>`).join("")}<a href="https://github.com/levancho/colibri-kit">GitHub</a><div id="webrank-badge" aria-label="Colibri Kit statistics on WebRank"></div></div>`;
  (document.querySelector("footer:not(.kfoot)") || document.body.lastElementChild)?.after?.(f) ?? document.body.append(f);
  const productionHost = location.hostname === "colibri-kit.io" || location.hostname === "colibri.l3v.ai";
  if (productionHost && !document.querySelector(`script[src="${WEBRANK_COUNTER}"]`)) {
    const counter = document.createElement("script"); counter.src = WEBRANK_COUNTER; counter.async = true; document.head.append(counter);
  }
}
setIcon(); mountKitBar(); if (document.readyState === "loading") addEventListener("DOMContentLoaded", mountKitFoot); else mountKitFoot();
