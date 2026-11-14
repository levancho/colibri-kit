"""Colibri CSS group: every demo renders inside an isolated iframe that loads only packages/colibri-css/dist/colibri.css."""
import html
from sink_catalog_base import add, C
from sink_info import INFO
G = "Colibri CSS"
HREF = "../packages/colibri-css/dist/colibri.css"

def frame(fid, body, css="", h=320):
    doc = (f'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
           f'<link rel="stylesheet" href="{HREF}"><style>body{{padding:var(--c-space-m)}}{css}</style></head><body>{body}<script>addEventListener("click",e=>{{const a=e.target.closest("a[href]");if(a){{e.preventDefault();e.stopPropagation();}}}},true);addEventListener("submit",e=>e.preventDefault(),true);</script></body></html>')
    bar = (f'<div class="ccss-bar" role="group" aria-label="Preview colour scheme">'
           + "".join(f'<button type="button" class="sink-mini" data-ccss-theme="{t}" data-for="{fid}" aria-pressed="{str(t=="system").lower()}">{t.title()}</button>' for t in ("system", "light", "dark"))
           + f'<span class="ccss-hint">Drag the corner to resize the preview</span></div>')
    return bar + f'<iframe id="{fid}" class="ccss-frame" title="Colibri CSS preview" style="height:{h}px" srcdoc="{html.escape(doc, quote=True)}"></iframe>'

def css_add(id, title, what, when, notes, body, css="", h=320, extra="", show=None):
    INFO[id] = (title, what, when)
    add(G, id, title, "done", "-", "-", notes, frame("f-" + id, show or body, css, h) + extra)
    C[-1]["snips"] = ([("css", "CSS", css.strip())] if css.strip() else []) + [("html", "HTML", body.strip())]

css_add("css-start", "Getting started", "One stylesheet: reset, tokens, base styles, a few layout primitives and opt-in components, all in cascade layers.",
 "Plain sites, FreeMarker pages and anywhere you want good defaults without a utility framework.",
 "Install: link packages/colibri-css/dist/colibri.css (or @colibri/css). Optional: dist/colibri-ui-bridge.css after themes/colibri.css makes Colibri UI components read Colibri CSS tokens.",
 '''<main class="center stack" style="--max:40rem">
  <h1>Hello, Colibri</h1>
  <p class="muted">Readable type, sensible spacing, light and dark, no classes needed for the basics.</p>
  <div class="cluster"><button class="btn" type="button">Get started</button><button class="btn" data-variant="outline" type="button">Docs</button><span class="badge" data-tone="accent">v0.1</span></div>
</main>''', h=260,
 extra='''<div class="ccss-pitch"><h4>Why Colibri CSS</h4>
<p><b>Modern CSS, not class soup.</b> One 15 KB stylesheet with no build step: finished defaults for semantic HTML, OKLCH tokens driven by one <code>--c-hue</code>, fluid type, built-in dark mode, and a handful of layout primitives. It's the styling half of Colibri: Colibri UI handles behaviour, Colibri CSS handles the look.</p>
<ul><li><b>Layers:</b> your CSS always wins, no <code>!important</code>.</li><li><b>Tokens:</b> re-brand globally or per section by changing one value.</li><li><b>Primitives, not utilities:</b> <code>.stack .grid .split .cluster</code>… tuned with custom properties, responsive with no breakpoints.</li><li><b>Platform-native:</b> container queries, <code>:has()</code>, nesting, <code>light-dark()</code>, <code>clamp()</code>.</li><li><b>Bridge:</b> Colibri UI components share the same tokens.</li></ul>
<p class="sink-dim">Read the full pitch, comparison table and setup on the library page: <a href="colibri-css.html">examples/colibri-css.html</a> · package <code>packages/colibri-css</code> · README <a href="../packages/colibri-css/README.md">packages/colibri-css/README.md</a></p></div>''')

css_add("css-tokens", "Design tokens", "Colour, space, type, radius, shadow and motion are custom properties. The palette is OKLCH and derives from one hue.",
 "Re-brand a whole product by changing --c-hue, or theme one section by setting tokens on a container.",
 "Colours use light-dark() so each token carries both schemes. Contrast mode raises border contrast.",
 '''<div class="stack">
  <label>Brand hue <input type="range" min="0" max="360" value="255" oninput="document.documentElement.style.setProperty('--c-hue', this.value)"></label>
  <div class="grid" style="--min:8.5rem;--gap:var(--c-space-s)">
    <div class="sw" style="--v:var(--c-brand)"><span>brand<small>--c-brand</small></span></div><div class="sw" style="--v:var(--c-accent)"><span>accent<small>--c-accent</small></span></div>
    <div class="sw" style="--v:var(--c-surface)"><span>surface<small>--c-surface</small></span></div><div class="sw" style="--v:var(--c-sunken)"><span>sunken<small>--c-sunken</small></span></div>
    <div class="sw" style="--v:var(--c-ok)"><span>ok<small>--c-ok</small></span></div><div class="sw" style="--v:var(--c-warn)"><span>warn<small>--c-warn</small></span></div><div class="sw" style="--v:var(--c-bad)"><span>bad<small>--c-bad</small></span></div>
  </div>
  <div class="cluster" style="--gap:var(--c-space-s)"><span class="r" style="border-radius:var(--c-radius-s)">radius-s</span><span class="r" style="border-radius:var(--c-radius)">radius</span><span class="r" style="border-radius:var(--c-radius-l);box-shadow:var(--c-shadow-l)">radius-l + shadow-l</span></div>
</div>''',
 css='''.sw { display: grid; grid-template-rows: 3.25rem auto; overflow: hidden;
  border: 1px solid var(--c-line); border-radius: var(--c-radius); background: var(--c-surface);
  font-size: var(--c-text-xs); font-weight: 600; line-height: 1.3;
  &::before { content: ""; background: var(--v); border-block-end: 1px solid var(--c-line); }
  & > span { padding: var(--c-space-2xs) var(--c-space-xs); }
  & small { display: block; font-weight: 400; color: var(--c-muted); font-family: var(--c-font-mono); }
}
.r { padding: var(--c-space-s) var(--c-space-m); border: 1px solid var(--c-line); background: var(--c-surface); font-size: var(--c-text-sm); }''', h=330)

css_add("css-layers", "Cascade layers", "Everything lives in @layer colibri.*, so your own unlayered CSS always wins without !important or specificity fights.",
 "Overriding library styles in an app; mixing Colibri CSS with legacy CSS.",
 "Order: reset, tokens, base, layout, components, utilities. Utilities are last, so they beat components.",
 '''<div class="cluster">
  <button class="btn">Library button</button>
  <button class="btn mine">My override (plain .btn.mine, no !important)</button>
</div>''',
 css='''/* unlayered = beats every @layer colibri.* rule, even one with higher specificity */
.mine { background: hotpink; color: black; border-radius: 0; }''', h=140)

css_add("css-layout", "Layout primitives", "Seven primitives configured by custom properties: stack, cluster, grid, split, switcher, center, reel. No breakpoints.",
 "Page and component layout without writing grid/flex boilerplate.",
 ".grid auto-fits columns of at least --min. .split wraps the sidebar under main when there is no room. .switcher flips row to column below --at.",
 '''<div class="stack" style="--gap:var(--c-space-m)">
  <div class="grid" style="--min:9rem"><div class="box">grid</div><div class="box">--min: 9rem</div><div class="box">auto-fill</div><div class="box">no breakpoints</div></div>
  <div class="split" style="--side:10rem"><aside class="box">split: side</aside><div class="box">main (wraps under when narrow)</div></div>
  <div class="switcher" style="--at:30rem"><div class="box">switcher</div><div class="box">row ↔ column</div><div class="box">at 30rem</div></div>
  <div class="reel" style="--item:11rem"><div class="box">reel</div><div class="box">scroll-snap</div><div class="box">swipe</div><div class="box">→</div></div>
</div>''',
 css='.box { padding: var(--c-space-s); border: 1px dashed var(--c-line); border-radius: var(--c-radius-s); background: var(--c-surface); font-size: var(--c-text-sm); }', h=400)

css_add("css-container", "Container queries", "Components respond to the width of their container, not the viewport. Add .container to the element whose width counts (a card is not a container by default).",
 "The same card in a narrow sidebar and a wide main column.",
 "Resize the preview or compare the two columns: the card's content switches to a horizontal layout once the card is wider than 22rem. A container query measures an ancestor, never the element itself, so the layout sits on a child of the .container card.",
 '''<div class="split" style="--side:13rem">
  <div class="card container"><div class="profile"><div class="avatar"></div><div class="stack" style="--gap:var(--c-space-3xs)"><b>Narrow card</b><span class="muted">Stacks vertically</span></div><button class="btn" data-size="s" type="button" aria-pressed="false" onclick="this.setAttribute('aria-pressed', this.ariaPressed !== 'true'); this.textContent = this.ariaPressed === 'true' ? 'Following' : 'Follow'">Follow</button></div></div>
  <div class="card container"><div class="profile"><div class="avatar"></div><div class="stack" style="--gap:var(--c-space-3xs)"><b>Wide card</b><span class="muted">Same markup, goes horizontal</span></div><button class="btn" data-size="s" type="button" aria-pressed="false" onclick="this.setAttribute('aria-pressed', this.ariaPressed !== 'true'); this.textContent = this.ariaPressed === 'true' ? 'Following' : 'Follow'">Follow</button></div></div>
</div>''',
 css='''.profile { display: grid; gap: var(--c-space-s) var(--c-space-m); justify-items: start; }
.profile .stack { --gap: var(--c-space-2xs); }
.avatar { inline-size: 3rem; aspect-ratio: 1; border-radius: var(--c-radius-full); background: var(--c-accent); }
@container (inline-size > 22rem) {
  .profile { grid-template-columns: auto 1fr auto; align-items: center; column-gap: var(--c-space-m); }
}''', h=260)

css_add("css-has", ":has() patterns", "Parent styling from child state: selected cards, invalid fields, required markers, with no JavaScript.",
 "Selectable cards, form validation styling, layouts that adapt to their contents.",
 ":user-invalid only matches after the user interacts, so empty forms don't start red. Labels stay real <label> elements.",
 '''<div class="stack">
  <div class="grid" style="--min:10rem">
    <label class="card"><input type="checkbox" checked> Starter plan</label>
    <label class="card"><input type="checkbox"> Team plan</label>
    <label class="card"><input type="checkbox"> Enterprise</label>
  </div>
  <div class="field"><label for="em">Email</label><input id="em" type="email" required placeholder="type 'abc', then click away"><span class="hint">We never share it.</span></div>
</div>''',
 css='''/* built in:
.card:has(:checked)               { border-color: var(--c-accent); }
.field:has(:user-invalid) label    { color: var(--c-bad); }
.field:has(:required) label::after { content: " *"; } */''', h=280)

css_add("css-nesting", "Native nesting", "The library source uses native CSS nesting for variants and states; so can you, with no preprocessor.",
 "Keeping a component's states and variants in one block.",
 "Supported in all current browsers. Variants are data attributes (data-variant, data-size, data-tone) instead of class lists.",
 '''<div class="cluster">
  <button class="btn">Solid</button><button class="btn" data-variant="soft">Soft</button><button class="btn" data-variant="outline">Outline</button>
  <button class="btn" data-variant="ghost">Ghost</button><button class="btn" data-variant="danger">Danger</button><button class="btn" data-size="s">Small</button><button class="btn" data-size="l">Large</button>
  <span class="badge" data-tone="ok">ok</span><span class="badge" data-tone="warn">warn</span><span class="badge" data-tone="bad">bad</span>
</div>''',
 css='''/* how .btn is written in src/50-components.css */
.btn {
  background: var(--c-accent);
  &:hover { background: color-mix(in oklch, var(--c-accent) 88%, black); }
  &:active { transform: scale(.97); }
  &[data-variant=outline] { background: transparent; border-color: var(--c-line);
    &:hover { background: var(--c-sunken); } }
}''', h=170)

css_add("css-fluid", "Fluid type & spacing", "Type and space scales use clamp(), so they grow smoothly from phone to desktop with no media queries.",
 "Headings and section spacing that look right at every width.",
 "Drag the preview's corner: sizes interpolate between a 360px and 1280px viewport. Headings use text-wrap: balance, paragraphs text-wrap: pretty.",
 '''<article class="prose">
  <h1>Fluid heading</h1>
  <p>Body copy uses <code>--c-text-md</code>. Headings use the 3xl…lg steps. Spacing tokens <code>--c-space-*</code> follow the same idea, so rhythm scales with the type.</p>
  <h3>A smaller heading that balances across lines</h3>
  <ul><li>No breakpoints</li><li>Respects the user's font-size</li></ul>
  <blockquote>Readable at 360px and at 1440px.</blockquote>
</article>''', h=420)

css_add("css-dark", "Dark mode", "Follows the OS by default (prefers-color-scheme via color-scheme + light-dark()). data-theme=\"light|dark\" on any element forces a scheme for that subtree.",
 "Site-wide theme switch, or a permanently dark panel inside a light page.",
 "Use the System / Light / Dark buttons above the preview. The inner panel is always dark via data-theme on the element.",
 '''<div class="grid" style="--min:12rem">
  <div class="card stack"><b>Follows the page</b><span class="muted">surface, text and borders come from light-dark() tokens</span><button class="btn" data-variant="soft">Action</button></div>
  <div class="card stack" data-theme="dark"><b>Always dark</b><span class="muted">data-theme="dark" on this card</span><button class="btn">Action</button></div>
</div>''', css="[data-theme] { background: var(--c-surface); color: var(--c-fg); }", h=230)

css_add("css-motion", "Motion", "Duration and easing tokens (including a linear() spring). With prefers-reduced-motion they collapse to 0, so every transition built on them turns off automatically.",
 "Consistent, accessible transitions and enter animations.",
 ".enter fades and slides in; --i staggers siblings. Buttons press-scale with --c-dur-fast. Reduced motion disables all of it.",
 '''<div class="stack">
  <button class="btn" data-variant="outline" onclick="document.querySelectorAll('.enter').forEach(e=>{e.style.animation='none';e.offsetWidth;e.style.animation=''})">Replay</button>
  <div class="grid" style="--min:8rem"><div class="card enter" style="--i:0">one</div><div class="card enter" style="--i:1">two</div><div class="card enter" style="--i:2">three</div><div class="card enter" style="--i:3">four</div></div>
  <div class="spring">hover me (spring)</div>
</div>''',
 css='''.spring { inline-size: max-content; padding: var(--c-space-s) var(--c-space-m); border-radius: var(--c-radius); background: var(--c-accent-soft);
  transition: translate var(--c-dur-slow) var(--c-ease-spring);
  &:hover { translate: 2rem 0; } }''', h=260)

css_add("css-forms", "Forms & typography baseline", "Unclassed inputs, selects, textareas, tables, code and kbd look finished out of the box. Textareas grow with their content (field-sizing).",
 "Admin screens, FreeMarker forms, CMS content.",
 "Focus uses :focus-visible with a token ring; selection colour and scrollbars follow the accent; accent-color tints checkboxes, radios and ranges.",
 '''<form class="stack" style="max-inline-size:32rem" onsubmit="return false">
  <div class="field"><label for="n">Name</label><input id="n" placeholder="Ada Lovelace"></div>
  <div class="field"><label for="r">Role</label><select id="r"><option>Engineer</option><option>Designer</option></select></div>
  <div class="field"><label for="b">Bio</label><textarea id="b">Grows as you type…</textarea></div>
  <div class="cluster"><label><input type="checkbox" checked> Subscribe</label><label><input type="radio" name="p" checked> Monthly</label><label><input type="radio" name="p"> Yearly</label><input type="range" style="inline-size:8rem" aria-label="Volume"></div>
  <p>Press <kbd>⌘</kbd> <kbd>K</kbd> to search, or run <code>npm run build</code>.</p>
  <div class="callout" data-tone="warn">Callout: a highlighted note with a tone.</div>
</form>''', h=520)

css_add("css-bridge", "Colibri UI bridge", "dist/colibri-ui-bridge.css maps Colibri UI's --ui-* tokens to Colibri CSS's --c-* tokens, so the components and your page share one palette.",
 "Using Colibri UI components on a page styled with Colibri CSS.",
 "Load order: themes/colibri.css, then colibri.css, then colibri-ui-bridge.css. The bridge is unlayered so it overrides the theme's defaults; change --c-hue and the components follow.",
 '''<link rel="stylesheet" href="themes/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri.css">
<link rel="stylesheet" href="packages/colibri-css/dist/colibri-ui-bridge.css">
<!-- --ui-primary → --c-accent, --ui-border → --c-line, --ui-radius → --c-radius … -->''', h=230,
 show='<div class="stack"><p>Load order (snippet below):</p><ol class="stack" style="--gap:var(--c-space-3xs);padding-inline-start:1.2em"><li><code>themes/colibri.css</code> (Colibri UI)</li><li><code>colibri.css</code></li><li><code>colibri-ui-bridge.css</code></li></ol><div class="callout">Colibri UI components then read <code>--c-*</code> tokens: one palette, one dark mode.</div></div>')
