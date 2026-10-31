// Behaviour for the marketing blocks: billing toggle + password reveal/strength. ~30 lines, no deps.
for (const g of document.querySelectorAll("[data-billing]")) {
  const scope = g.closest("section") || document;
  g.addEventListener("click", (e) => { const b = e.target.closest("button[data-period]"); if (!b) return;
    for (const x of g.querySelectorAll("button")) x.setAttribute("aria-pressed", String(x === b));
    for (const p of scope.querySelectorAll("[data-monthly]")) p.textContent = p.dataset[b.dataset.period];
    for (const p of scope.querySelectorAll("[data-per]")) p.textContent = b.dataset.period === "yearly" ? "/ mo, billed yearly" : "/ month"; });
}
for (const w of document.querySelectorAll(".pw")) {
  const i = w.querySelector("input"), b = w.querySelector("button"), m = w.parentElement.querySelector(".meter");
  b?.addEventListener("click", () => { const show = i.type === "password"; i.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show"; b.setAttribute("aria-pressed", String(show)); });
  i.addEventListener("input", () => { const v = i.value; m && (m.dataset.score = !v ? 0 : Math.min(4, (v.length >= 8) + /[A-Z]/.test(v) + /\d/.test(v) + /[^\w]/.test(v) || 1)); });
}
// Live theme sync when the gallery (parent page) changes pack / scheme / hue.
addEventListener("storage", (e) => { const r = document.documentElement;
  if (e.key === "colibri-kit-theme") e.newValue ? (r.dataset.kitTheme = e.newValue) : delete r.dataset.kitTheme;
  if (e.key === "colibri-scheme" && e.newValue) r.dataset.theme = e.newValue;
  if (e.key === "colibri-hue") e.newValue ? r.style.setProperty("--c-hue", e.newValue) : r.style.removeProperty("--c-hue"); });
