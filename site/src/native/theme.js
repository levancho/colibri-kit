// The light/dark switch in the site header for the React Native pages. Same storage key as the rest of the site.
// Returns the current choice ("light", "dark", or "" when following the device) and reports later changes.
export function themeSwitch(onChange = () => {}) {
  const root = document.documentElement;
  const chosen = () => root.dataset.theme ?? "";
  // The header script moves the button into the bar, so wait for clicks on the document.
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#theme")) return;
    const dark = chosen() ? chosen() === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("colibri.kit.theme", root.dataset.theme); } catch { /* private mode */ }
    onChange(chosen());
  });
  return chosen();
}
