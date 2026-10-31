#!/usr/bin/env python3
"""Generates examples/kitchen-sink.html from tools/sink_catalog_*.py + sink_info.py. Run: python3 tools/kitchen-sink.py"""
import html, pathlib, sys
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE))
from sink_catalog_more import C
import sink_catalog_motion  # noqa: adds Motion + Theming groups
import sink_catalog_ai, sink_catalog_blocks  # noqa: Conversation, AI Elements, blocks
import sink_catalog_css  # noqa: Colibri CSS group
from sink_info import INFO
from sink_code import FTL, IMP
from sink_pretty import pretty
from sink_react import render as react_src
E = html.escape
GROUPS = [("Base", "Basics & feedback"), ("Navigation", "Navigation"), ("Forms", "Forms & inputs"), ("Conversation", "Chat & conversation"), ("AI Elements", "AI elements"), ("Sidebar blocks", "Sidebar blocks"), ("Login blocks", "Login blocks"), ("Signup blocks", "Signup blocks"), ("Motion", "Animation library"), ("Theming", "Theming"), ("Colibri CSS", "Colibri CSS")]
ST = {"done": ("Ready", "Works and is tested in this page."), "partial": ("Partly ready", "Works, but some features are still missing."),
      "planned": ("Planned", "Not built yet."), "css": ("Markup only", "No JavaScript needed: just HTML structure plus your CSS.")}
missing = [c["id"] for c in C if c["id"] not in INFO]
if missing: sys.exit(f"missing INFO for {missing}")

def code(c):
    tabs = []
    if c.get("snips"): tabs += c["snips"]
    elif c["demo"]: tabs.append(("html", "HTML", pretty(c["demo"])))
    html_src = next((src for k, _, src in tabs if k == "html"), None)
    if c["id"] in FTL: tabs.append(("ftl", "FreeMarker", IMP + FTL[c["id"]]))
    elif html_src: tabs.append(("ftl", "FreeMarker", "[#-- No macro needed: FreeMarker outputs this markup as-is. --]\n" + html_src))
    if html_src: tabs.append(("react", "React", react_src(html_src)))
    if not tabs: return ""
    cid = c["id"]
    trig = "".join(f'<button data-ui-part="trigger" data-value="{k}">{lab}</button>' for k, lab, _ in tabs)
    pan = "".join(f'<div data-ui-part="panel" data-value="{k}"><button class="sink-copy" data-ui="clipboard" data-target="#code-{cid}-{k}" aria-label="Copy {lab} code"><span class="sink-copy-l">Copy</span></button><pre class="sink-pre"><code id="code-{cid}-{k}">{E(src)}</code></pre></div>' for k, lab, src in tabs)
    return f'<details class="sink-code" open><summary>Code</summary><div data-ui="tabs" class="sink-code-tabs" data-default-value="{tabs[0][0]}"><div data-ui-part="list" aria-label="Code for {E(INFO[cid][0])}">{trig}</div>{pan}</div></details>'

def section(c):
    title, what, when = INFO[c["id"]]; st, st_help = ST[c["status"]]
    tip = (f'<span data-ui="tooltip" data-side="bottom" data-align="end"><button class="sink-info" data-ui-part="trigger" aria-label="More about {E(title)}">?</button>'
           f'<span data-ui-part="content" class="sink-tip"><b>When to use:</b> {E(when)}<br><b>Status:</b> {st}, {st_help}<br>'
           f'<span class="sink-dim">Code name <code>data-ui="{c["id"]}"</code> · shadcn: {E(c["shadcn"])} · Metronic: {E(c["metronic"])}</span></span></span>')
    demo = c["demo"] or f'<p class="sink-dim">Not built yet. {E(c["notes"])}</p>'
    return f'''<section id="{c["id"]}" class="sink-sec" tabindex="-1" aria-labelledby="h-{c["id"]}">
<header class="sink-sec-h"><div><h3 id="h-{c["id"]}">{E(title)}</h3><p class="sink-what">{E(what)}</p></div>
<div class="sink-sec-meta"><span class="sink-st" data-status="{c["status"]}" title="{E(st_help)}">{st}</span>{tip}</div></header>
<div class="sink-preview ui-root">{demo}</div>
{code(c)}
<details class="sink-a11y"><summary>Accessibility &amp; keyboard</summary><p>{E(c["notes"])}</p>
<p class="sink-dim">Technical names: <code>data-ui="{c["id"]}"</code> · shadcn “{E(c["shadcn"])}” · Metronic “{E(c["metronic"])}”</p></details></section>'''

nav, body = [], []
for g, label in GROUPS:
    items = [c for c in C if c["group"] == g]
    if g not in ("Colibri CSS", "Motion", "Theming", "Sidebar blocks", "Login blocks", "Signup blocks"): items.sort(key=lambda c: INFO[c["id"]][0])
    nav.append(f'<div class="sink-group" data-ui="collapsible" data-group="{g}"><button data-ui-part="trigger" class="sink-group-trigger"><span>{label}</span><span class="sink-count">{len(items)}</span></button><div data-ui-part="content">' + "".join(
        f'<a data-ui-part="link" href="#{c["id"]}"><span>{E(INFO[c["id"]][0])}</span><i class="sink-dot" data-status="{c["status"]}" title="{ST[c["status"]][0]}"></i></a>' for c in items) + "</div></div>")
    body.append(f'<h2 class="sink-grp" id="grp-{g.lower().replace(" ", "-")}">{label}</h2>' + "".join(section(c) for c in items))
counts = {s: sum(1 for c in C if c["status"] == s) for s in ST}
legend = "".join(f'<span class="sink-st" data-status="{s}" title="{E(ST[s][1])}">{ST[s][0]} · {n}</span>' for s, n in counts.items())
chrome_css = (HERE / "sink_chrome.css").read_text()

page = f'''<!doctype html><html lang="ka" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Colibri UI · Component gallery</title><link rel="icon" href="data:,">
<style id="sink-chrome">{chrome_css}</style>
<link id="demo-css" rel="stylesheet" href="../themes/colibri.css"><link id="motion-css" rel="stylesheet" href="../themes/motion.css"><link id="kit-themes" rel="stylesheet" href="../themes/packs/index.css"></head>
<body><a id="top"></a><a class="sink-skip" href="#main">Skip to components</a>
<header class="sink-top" data-ui="sticky">
<button class="sink-icon" data-ui-sidebar-toggle="#sink-sidebar" aria-label="Show or hide the component list (Ctrl/⌘+B)" title="Component list (Ctrl/⌘+B)">☰</button>
<div class="sink-brand"><strong>Colibri UI</strong><span>Component gallery</span></div>
<div class="sink-controls">
<label class="sink-chk" title="Off = the raw, unstyled components exactly as the library ships them"><input type="checkbox" id="css-toggle" checked> Demo styling</label>
<label class="sink-sel" title="Kit theme pack (sets data-kit-theme on html; themes/packs/)">Theme <select id="kit-theme"><option value="">Colibri</option><option value="glacier">Glacier</option><option value="ember">Ember</option><option value="midnight">Midnight</option></select></label>
<label class="sink-sel" title="Accent colour (sets data-ui-theme on html)">Accent <select id="accent"><option value="">Neutral</option><option>blue</option><option>green</option><option>rose</option><option>orange</option><option>violet</option></select></label>
<label class="sink-sel" title="Corner radius token --ui-radius">Radius <select id="radius"><option value="">Theme</option><option value="0px">0</option><option value="4px">4</option><option value="8px">8</option><option value="12px">12</option><option value="16px">16</option></select></label>
<label class="sink-chk" title="Turns the animation library off (same as prefers-reduced-motion)"><input type="checkbox" id="motion-toggle" checked> Animations</label>
<button class="sink-btn" data-ui="theme-switch" data-storage-key="colibri.sink.theme" title="Cycle light / dark / system">🌓 <span class="mode-label">Theme</span></button>
<button class="sink-btn" id="log-open" aria-controls="sink-log" aria-expanded="false" title="Show events the components fire (for developers)">⚡ Events <span id="log-count" class="sink-count">0</span></button>
<a class="sink-btn" href="index.html">All examples</a></div></header>
<div class="sink-wrap">
<aside id="sink-sidebar" data-ui="sidebar" data-collapsible="offcanvas" data-storage-key="colibri.sink.sidebar" aria-label="Components">
<input class="sink-filter" id="sink-filter" type="search" placeholder="Find a component…" aria-label="Filter components">
<div class="sink-nav-tools"><button type="button" id="nav-expand" class="sink-mini" title="Expand all groups">Expand all</button><button type="button" id="nav-collapse" class="sink-mini" title="Collapse all groups">Collapse all</button></div><nav data-ui="scrollspy" data-offset="90">{"".join(nav)}</nav></aside>
<main id="main" class="sink-main">
<div class="sink-intro"><h1>Component gallery</h1>
<p>Every Colibri UI component on one page. Each one has a plain description, a live demo you can click and use with the keyboard, and accessibility notes. Hover <span class="sink-info sink-info-inline" aria-hidden="true">?</span> for when to use it and its technical names.</p>
<p class="sink-legend">{legend}</p>
<p class="sink-dim">Untick <b>Demo styling</b> to see the components with no CSS at all: the library itself ships no styles. Turn on <b>⚡ Events</b> to watch what each component reports.</p></div>
{"".join(body)}
<p class="sink-dim sink-end"><a data-ui="scrollto" href="#top">↑ Back to top</a></p></main></div>
<section id="sink-log" class="sink-log" data-dock="bottom" hidden aria-label="Component events">
<header class="sink-log-h" title="Drag to move"><strong>⚡ Events</strong><span class="sink-dim" id="log-hint">what the components just did</span>
<span class="sink-log-tools"><button class="sink-icon" id="log-clear" title="Clear">⌫</button><button class="sink-icon" id="log-dock" title="Dock: bottom / right / floating">⇲</button>
<button class="sink-icon" id="log-min" aria-expanded="true" title="Collapse">▾</button><button class="sink-icon" id="log-close" aria-label="Close event log" title="Close">×</button></span></header>
<ol id="sink-log-list" class="sink-log-list" aria-live="off"></ol></section>
<ol data-ui="toaster" data-position="bottom-right" data-max="4" aria-label="Notifications"></ol>
<script type="module" src="kitchen-sink.js"></script></body></html>'''
out = HERE.parent / "examples" / "kitchen-sink.html"; out.write_text(page)
print(f"wrote {out}: {len(C)} components {counts}")
