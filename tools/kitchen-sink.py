#!/usr/bin/env python3
"""Generates examples/kitchen-sink.html from tools/sink_catalog_*.py + sink_info.py. Run: python3 tools/kitchen-sink.py"""
import html, pathlib, sys, re
HERE = pathlib.Path(__file__).parent; sys.path.insert(0, str(HERE))
from sink_catalog_more import C
import sink_catalog_motion  # noqa: adds Motion + Theming groups
import sink_catalog_ai, sink_catalog_blocks  # noqa: Conversation, AI Elements, blocks
import sink_catalog_css  # noqa: Colibri CSS group
import sink_catalog_radix  # noqa: Radix-audit additions
import sink_catalog_applications
from sink_info import INFO
from sink_code import FTL, IMP
from sink_pretty import pretty
from sink_react import render as react_src
from sink_thymeleaf import render as thymeleaf_src
from sink_adapters import adapters
E = html.escape
GROUPS = [("Application components", "Application components"), ("Base", "Basics & feedback"), ("Navigation", "Navigation"), ("Forms", "Forms & inputs"), ("Conversation", "Chat & conversation"), ("AI Elements", "AI elements"), ("Sidebar blocks", "Sidebar blocks"), ("Login blocks", "Login blocks"), ("Signup blocks", "Signup blocks"), ("Motion", "Animation library"), ("Theming", "Theming"), ("Colibri CSS", "Colibri CSS")]
ST = {"done": ("Ready", "Works and is tested in this page."), "partial": ("Partly ready", "Works, but some features are still missing."),
      "planned": ("Planned", "Not built yet."), "css": ("Markup only", "No JavaScript needed: just HTML structure plus your CSS.")}
missing = [c["id"] for c in C if c["id"] not in INFO]
if missing: sys.exit(f"missing INFO for {missing}")

def code(c):
    tabs, support = adapters(c)
    order = {"html": 0, "react": 1, "ftl": 2, "thymeleaf": 3}
    tabs.sort(key=lambda tab: order.get(tab[0], 4))
    if not tabs: return ""
    cid = c["id"]
    trig = "".join(f'<button data-ui-part="trigger" data-value="{k}">{lab}</button>' for k, lab, _ in tabs)
    pan = "".join(f'<div data-ui-part="panel" data-value="{k}"><button class="sink-copy" data-ui="clipboard" data-target="#code-{cid}-{k}" aria-label="Copy {lab} code"><span class="sink-copy-l">Copy</span></button><pre class="sink-pre"><code id="code-{cid}-{k}">{E(src)}</code></pre></div>' for k, lab, src in tabs)
    return '<p class="sink-dim">Framework support: '+E(' · '.join(k+': '+v for k,v in support.items()))+'</p>'+f'<details class="sink-code" open><summary>Code</summary><div data-ui="tabs" class="sink-code-tabs" data-default-value="{tabs[0][0]}"><div data-ui-part="list" aria-label="Code for {E(INFO[cid][0])}">{trig}</div>{pan}</div></details>'

def section(c):
    title, what, when = INFO[c["id"]]; st, st_help = ST[c["status"]]
    technical=('data-chart="area"' if c['id']=='application-chart' else 'data-application-component="'+c['id'].removeprefix('application-')+'"') if c['id'].startswith('application-') else ('data-ui="'+c['id']+'"' if 'data-ui="'+c['id']+'"' in c['demo'] else 'example id="'+c['id']+'"')
    if not c['id'].startswith('application-'):
        controllers=list(dict.fromkeys(re.findall(r'data-ui="([a-z0-9-]+)"',c.get('public_html',c['demo']))))
        if controllers: technical=', '.join('data-ui="'+name+'"' for name in controllers)
    tip = (f'<span data-ui="tooltip" data-side="bottom" data-align="end"><button class="sink-info" data-ui-part="trigger" aria-label="More about {E(title)}">?</button>'
           f'<span data-ui-part="content" class="sink-tip"><b>When to use:</b> {E(when)}<br><b>Status:</b> {st}, {st_help}<br>'
           f'<span class="sink-dim">Code name <code>{E(technical)}</code> · shadcn: {E(c["shadcn"])} · Metronic: {E(c["metronic"])}</span></span></span>')
    demo = c["demo"] or f'<p class="sink-dim">Not built yet. {E(c["notes"])}</p>'
    return f'''<section id="{c["id"]}" class="sink-sec" tabindex="-1" aria-labelledby="h-{c["id"]}">
<header class="sink-sec-h"><div><h3 id="h-{c["id"]}">{E(title)}</h3><p class="sink-what">{E(what)}</p></div>
<div class="sink-sec-meta"><span class="sink-st" data-status="{c["status"]}" title="{E(st_help)}">{st}</span>{tip}</div></header>
<div class="sink-preview ui-root">{demo}</div>
{code(c)}
<details class="sink-a11y"><summary>Accessibility &amp; keyboard</summary><p>{E(c["notes"])}</p>
<p class="sink-dim">Technical names: <code>{E(technical)}</code> · shadcn “{E(c["shadcn"])}” · Metronic “{E(c["metronic"])}”</p></details></section>'''

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
<title>Colibri UI · Component gallery</title><script>/* apply saved light/dark + theme pack BEFORE first paint (no flash) */try{{var H=document.documentElement,m=localStorage.getItem("colibri.sink.theme")||"system",e=m==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;H.dataset.theme=e;H.style.colorScheme=e;var t=JSON.parse(localStorage.getItem("colibri.sink.tokens")||"{{}}"),q=new URLSearchParams(location.search).get("theme");if(q!==null)t.kit=q;if(t.kit)H.dataset.kitTheme=t.kit;if(t.accent)H.dataset.uiTheme=t.accent;if(t.radius)H.style.setProperty("--ui-radius",t.radius);if(t.motion===false)H.dataset.uiMotion="off"}}catch(_){{}}</script><link rel="icon" href="data:,">
<style id="sink-chrome">{chrome_css}</style>
<link id="demo-css" rel="stylesheet" href="../themes/colibri.css"><link id="motion-css" rel="stylesheet" href="../themes/motion.css"><link id="kit-themes" rel="stylesheet" href="../themes/packs/index.css"><link rel="stylesheet" href="kit-bar.css"></head>
<body><a id="top"></a><a class="sink-skip" href="#main">Skip to components</a>
<header class="kbar" data-active="components">
<div data-kbar-lead><button class="sink-icon" data-ui-sidebar-toggle="#sink-sidebar" aria-label="Show or hide the component list (Ctrl/⌘+B)" title="Component list (Ctrl/⌘+B)">☰</button></div>
<button class="sink-btn kbar-icon" data-kbar-tool data-ui="theme-switch" data-storage-key="colibri.sink.theme" title="Cycle light / dark / system" aria-label="Colour mode"><span aria-hidden="true">◐</span><span class="mode-label" hidden>Mode</span></button>
<div data-kbar-custom data-title="Component gallery" hidden>
<label title="Kit theme pack (sets data-kit-theme on html; themes/packs/)">Theme pack <select id="kit-theme"><option value="">Colibri</option><option value="glacier">Glacier</option><option value="ember">Ember</option><option value="midnight">Midnight</option></select></label>
<label title="Accent colour (sets data-ui-theme on html)">Accent <select id="accent"><option value="">Neutral</option><option>blue</option><option>green</option><option>rose</option><option>orange</option><option>violet</option></select></label>
<label title="Corner radius token --ui-radius">Radius <select id="radius"><option value="">Pack default</option><option value="0px">0</option><option value="4px">4</option><option value="8px">8</option><option value="12px">12</option><option value="16px">16</option></select></label>
<label title="Off = the raw, unstyled components exactly as the library ships them">Demo styling <input type="checkbox" id="css-toggle" checked></label>
<label title="Turns the animation library off (same as prefers-reduced-motion)">Animations <input type="checkbox" id="motion-toggle" checked></label>
<button class="kbar-btn" id="log-open" aria-controls="sink-log" aria-expanded="false" title="Show events the components fire (for developers)">⚡ Event log <span id="log-count" class="sink-count">0</span></button>
<a class="kbar-btn" href="index.html">All raw examples</a>
</div></header>
<div class="sink-wrap">
<aside id="sink-sidebar" data-ui="sidebar" data-collapsible="offcanvas" data-storage-key="colibri.sink.sidebar" aria-label="Components">
<input class="sink-filter" id="sink-filter" type="search" placeholder="Find a component…" aria-label="Filter components">
<div class="sink-nav-tools"><button type="button" id="nav-expand" class="sink-mini" title="Expand all groups">Expand all</button><button type="button" id="nav-collapse" class="sink-mini" title="Collapse all groups">Collapse all</button></div><nav data-ui="scrollspy" data-offset="90">{"".join(nav)}</nav></aside>
<main id="main" class="sink-main">
<div class="sink-intro kpage-head"><span class="kpage-eyebrow">Components</span><h1>Component gallery</h1>
<p>Every Colibri UI component on one page. Each one has a plain description, a live demo you can click and use with the keyboard, and accessibility notes. Hover <span class="sink-info sink-info-inline" aria-hidden="true">?</span> for when to use it and its technical names.</p>
<p class="sink-legend kpage-meta">{legend}</p>
<p class="sink-dim">Untick <b>Demo styling</b> to see the components with no CSS at all: the library itself ships no styles. Turn on <b>⚡ Events</b> to watch what each component reports.</p></div>
{"".join(body)}
</main></div>
<button type="button" class="sink-totop" id="sink-totop" aria-label="Back to top" title="Back to top" hidden><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg></button>
<section id="sink-log" class="sink-log" data-dock="bottom" hidden aria-label="Component events">
<header class="sink-log-h" title="Drag to move"><strong>⚡ Events</strong><span class="sink-dim" id="log-hint">what the components just did</span>
<span class="sink-log-tools"><button class="sink-icon" id="log-clear" title="Clear">⌫</button><button class="sink-icon" id="log-dock" title="Dock: bottom / right / floating">⇲</button>
<button class="sink-icon" id="log-min" aria-expanded="true" title="Collapse">▾</button><button class="sink-icon" id="log-close" aria-label="Close event log" title="Close">×</button></span></header>
<ol id="sink-log-list" class="sink-log-list" aria-live="off"></ol></section>
<ol data-ui="toaster" data-position="bottom-right" data-max="4" aria-label="Notifications"></ol>
<script type="module" src="kit-bar.js"></script><script type="module" src="kitchen-sink.js"></script></body></html>'''
out = HERE.parent / "examples" / "kitchen-sink.html"; out.write_text(page)
print(f"wrote {out}: {len(C)} components {counts}")
