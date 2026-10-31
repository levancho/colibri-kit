// Generates dist/colibri-classes.css: the OPT-IN class layer (Path B) for React className and class-first markup.
// Every value is a Colibri token, so classes and primitives always agree. Small on purpose.
const SPACE = ["0", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl"];
const sp = (k) => (k === "0" ? "0" : `var(--c-space-${k})`);
const TEXT = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];
const COLORS = { fg: "--c-fg", muted: "--c-muted", accent: "--c-accent", ok: "--c-ok", warn: "--c-warn", bad: "--c-bad" };
const BGS = { bg: "--c-bg", surface: "--c-surface", sunken: "--c-sunken", accent: "--c-accent", "accent-soft": "--c-accent-soft" };
const R = { "rounded-s": "--c-radius-s", rounded: "--c-radius", "rounded-l": "--c-radius-l", "rounded-full": "--c-radius-full" };
const SH = { "shadow-s": "--c-shadow-s", shadow: "--c-shadow", "shadow-l": "--c-shadow-l" };
const rules = [];
const r = (sel, decl) => rules.push(`  .c-${sel} { ${decl} }`);
const section = (t) => rules.push(`\n  /* ${t} */`);

section("layout: the primitives as classes (same behaviour as .stack/.cluster/.grid)");
r("stack", "display: flex; flex-direction: column; gap: var(--gap, var(--c-space-s));");
r("cluster", "display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap, var(--c-space-xs));");
r("grid", "display: grid; gap: var(--gap, var(--c-space-m)); grid-template-columns: repeat(auto-fill, minmax(min(var(--min, 16rem), 100%), 1fr));");
r("center", "max-inline-size: var(--max, var(--c-content)); margin-inline: auto; padding-inline: var(--c-space-m); box-sizing: content-box;");
r("row", "display: flex; flex-direction: row;"); r("col", "display: flex; flex-direction: column;");
r("inline", "display: inline-flex; align-items: center;"); r("wrap", "flex-wrap: wrap;");
r("hidden", "display: none;"); r("block", "display: block;");
for (const a of ["start", "center", "end", "stretch", "baseline"]) r(`items-${a}`, `align-items: ${a};`);
for (const [k, v] of Object.entries({ start: "flex-start", center: "center", end: "flex-end", between: "space-between", around: "space-around" })) r(`justify-${k}`, `justify-content: ${v};`);
r("place-center", "place-items: center; place-content: center;");
r("grow", "flex: 1 1 0; min-inline-size: 0;"); r("shrink-0", "flex-shrink: 0;");
r("full", "inline-size: 100%;"); r("measure", "max-inline-size: var(--c-measure);"); r("fit", "inline-size: fit-content;");
r("container", "container-type: inline-size;");
for (const n of [2, 3, 4]) r(`cols-${n}`, `display: grid; grid-template-columns: repeat(${n}, minmax(0, 1fr)); gap: var(--gap, var(--c-space-m));`);

section("spacing: gap / padding / margin on the fluid space scale (logical properties under the hood)");
for (const k of SPACE) {
  r(`gap-${k}`, `gap: ${sp(k)}; --gap: ${sp(k)};`);
  r(`p-${k}`, `padding: ${sp(k)};`); r(`px-${k}`, `padding-inline: ${sp(k)};`); r(`py-${k}`, `padding-block: ${sp(k)};`);
  r(`mt-${k}`, `margin-block-start: ${sp(k)};`); r(`mb-${k}`, `margin-block-end: ${sp(k)};`);
}
r("mx-auto", "margin-inline: auto;"); r("ms-auto", "margin-inline-start: auto;");

section("type");
for (const k of TEXT) r(`text-${k}`, `font-size: var(--c-text-${k});`);
r("medium", "font-weight: 500;"); r("semibold", "font-weight: 600;"); r("bold", "font-weight: 700;");
r("mono", "font-family: var(--c-font-mono);"); r("tight", "line-height: var(--c-leading-tight);");
r("text-start", "text-align: start;"); r("text-center", "text-align: center;"); r("text-end", "text-align: end;");
r("truncate", "overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"); r("balance", "text-wrap: balance;");
r("upper", "text-transform: uppercase; letter-spacing: .06em;");

section("colour roles (never raw colours)");
for (const [k, v] of Object.entries(COLORS)) r(k, `color: var(${v});`);
for (const [k, v] of Object.entries(BGS)) r(`bg-${k}`, `background: var(${v});${k === "accent" ? " color: var(--c-brand-fg);" : ""}`);

section("surface: border, radius, shadow");
r("border", "border: 1px solid var(--c-line);"); r("border-b", "border-block-end: 1px solid var(--c-line);"); r("border-t", "border-block-start: 1px solid var(--c-line);");
for (const [k, v] of Object.entries(R)) r(k, `border-radius: var(${v});`);
for (const [k, v] of Object.entries(SH)) r(k, `box-shadow: var(${v});`);
r("card", "padding: var(--c-space-m); border: 1px solid var(--c-line); border-radius: var(--c-radius-l); background: var(--c-surface); box-shadow: var(--c-shadow-s);");

section("motion (token durations, so reduced-motion turns them off)");
r("transition", "transition: all var(--c-dur) var(--c-ease);"); r("enter", "animation: c-enter var(--c-dur-slow) var(--c-ease-out) both;");
r("lift", "transition: translate var(--c-dur) var(--c-ease), box-shadow var(--c-dur) var(--c-ease);");
rules.push("  .c-lift:hover { translate: 0 -2px; box-shadow: var(--c-shadow); }");

section("responsive by CONTAINER width (parent needs .c-container or .card). narrow < 40rem");
rules.push("  @container (inline-size < 40rem) { .c-narrow\\:hidden { display: none; } .c-narrow\\:col { flex-direction: column; } .c-narrow\\:full { inline-size: 100%; } .c-narrow\\:cols-1 { grid-template-columns: 1fr; } }");
rules.push("  @container (inline-size >= 40rem) { .c-wide\\:hidden { display: none; } .c-wide\\:row { flex-direction: row; } }");

section("class aliases for component variants (for className-only code; data-variant etc. still work)");
rules.push("  .btn.is-soft { background: var(--c-accent-soft); color: var(--c-accent); }");
rules.push("  .btn:is(.is-outline, .is-ghost) { background: transparent; color: var(--c-fg); } .btn.is-outline { border-color: var(--c-line); } .btn:is(.is-outline, .is-ghost):hover { background: var(--c-sunken); }");
rules.push("  .btn.is-danger { background: var(--c-bad); } .btn.is-s { min-block-size: 2rem; padding-inline: .75em; } .btn.is-l { min-block-size: 3rem; padding-inline: 1.4em; font-size: var(--c-text-md); }");
for (const t of ["accent", "ok", "warn", "bad"]) rules.push(`  :is(.badge, .callout).is-${t} { --tone: var(--c-${t === "accent" ? "accent" : t}); --tone-soft: color-mix(in oklch, var(--tone) 15%, transparent); }`);

export const classesCss = `/*! Colibri CSS · class helpers (opt-in). Load AFTER colibri.css.
 * Path A (default): tokens + primitives + semantic HTML.  Path B (this file): small token-backed classes for className.
 * Naming: c-{what}-{token}. Spacing uses the fluid scale 0 3xs 2xs xs s m l xl 2xl; text xs…3xl; colours are roles. */
@layer colibri.classes {
${rules.join("\n")}
}
`;
export const classList = rules.join("\n").match(/\.c-[a-z0-9-]+(\\:[a-z0-9-]+)?/g);
