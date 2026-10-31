import { highlightAll } from "../code-highlight.js";
import { initPackPicker, initScheme, initHue } from "../dashboards/skins.js";
initPackPicker(document.getElementById("pack")); initScheme(document.getElementById("scheme"));
initHue(document.getElementById("hue"), document.getElementById("hue-out"));
// iframes share localStorage; push changes into them directly too (storage events don't fire in the same tab's frames reliably)
const sync = () => { for (const f of document.querySelectorAll("iframe")) { const r = f.contentDocument?.documentElement, s = document.documentElement; if (!r) continue;
  s.dataset.kitTheme ? (r.dataset.kitTheme = s.dataset.kitTheme) : delete r.dataset.kitTheme; r.dataset.theme = s.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  r.style.colorScheme = r.dataset.theme; const h = s.style.getPropertyValue("--c-hue"); h ? r.style.setProperty("--c-hue", h) : r.style.removeProperty("--c-hue"); } };
new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-kit-theme", "style"] });
const fit = (f) => { const d = f.contentDocument; if (d?.body) f.style.blockSize = d.documentElement.scrollHeight + "px"; };
for (const f of document.querySelectorAll("iframe")) f.addEventListener("load", () => { sync(); fit(f); new ResizeObserver(() => fit(f)).observe(f.contentDocument.body); });
for (const b of document.querySelectorAll(".g-block")) {
  b.querySelector(".g-tabs").addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (!t) return;
    for (const x of b.querySelectorAll("[data-tab]")) x.setAttribute("aria-selected", String(x === t));
    for (const p of b.querySelectorAll("[data-panel]")) p.hidden = p.dataset.panel !== t.dataset.tab;
    b.querySelector(".g-dev").hidden = t.dataset.tab !== "preview"; });
  b.querySelector(".g-dev").addEventListener("click", (e) => { const t = e.target.closest("[data-w]"); if (!t) return;
    for (const x of b.querySelectorAll("[data-w]")) x.setAttribute("aria-pressed", String(x === t));
    const st = b.querySelector(".g-stage"); st.dataset.w = t.dataset.w; st.querySelector("iframe").style.inlineSize = t.dataset.w; });
  b.addEventListener("click", async (e) => { const c = e.target.closest(".g-copy"); if (!c) return;
    await navigator.clipboard?.writeText(c.parentElement.querySelector("code").textContent); c.textContent = "Copied"; setTimeout(() => (c.textContent = "Copy"), 1200); });
}
highlightAll(document);
