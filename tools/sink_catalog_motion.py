from sink_catalog_base import add, C
G = "Motion"
PRESETS = ["fade", "slide-up", "slide-down", "slide-left", "slide-right", "scale", "zoom", "flip", "pop", "blur", "collapse", "swing"]
cards = "".join(f'''<div class="mo-card"><div class="mo-stage"><div id="mo-{p}" class="mo-box" data-ui-motion="{p}">{p}</div></div><div class="mo-row"><code>data-ui-motion="{p}"</code><button data-ui="button" data-variant="outline" data-size="sm" data-motion-toggle="mo-{p}" aria-pressed="true">Hide</button></div></div>''' for p in PRESETS)
add(G, "motion", "Enter / exit presets", "done", "-", "(tw-animate / data-[state] animations)",
 "Enter plays whenever the element appears; exit plays a non-interactive ghost copy, so components keep their synchronous state and focus logic. Everything turns off with prefers-reduced-motion or the Animations switch.",
 f'''<div class="mo-grid">{cards}</div><p style="flex-basis:100%;text-align:center"><button data-ui="button" id="mo-all">Toggle all</button> <span class="muted">"swing" is registered at runtime with <code>register()</code>.</span></p>''')
LOOPS = ["spin", "pulse", "bounce", "ping", "float", "shimmer"]
HOV = ["lift", "grow", "shrink", "wiggle", "glow"]
add(G, "motion-states", "Hover, focus and loop presets", "done", "-", "-",
 "Hover and focus presets use CSS transitions; loops are infinite CSS animations that become static with reduced motion.",
 "<h4>hover / press</h4>" + "".join(f'<div class="mo-chip" tabindex="0" data-ui-motion-hover="{h}">{h}</div>' for h in HOV)
 + '<h4>focus (Tab to it)</h4><input placeholder="data-ui-motion-focus=ring" data-ui-motion-focus="ring" aria-label="Focus ring demo"> <button data-ui="button" data-variant="outline" data-ui-motion-focus="grow">grow on focus</button>'
 + "<h4>loops</h4>" + "".join(f'<div class="mo-loop"><span class="mo-dot{" mo-wide" if l=="shimmer" else ""}" data-ui-motion-loop="{l}"></span><code>{l}</code></div>' for l in LOOPS))
SHOTS = ["shake", "bounce", "pop", "flash", "heartbeat", "tada", "wiggle"]
add(G, "motion-play", "One-shot animations (play)", "done", "-", "-",
 "play(el, name) restarts a one-shot animation and resolves a Promise when it ends. Example: shake a form when validation fails.",
 '<div class="mo-box" id="mo-target" style="width:120px">🐦 Colibri</div><div style="display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;flex-basis:100%">'
 + "".join(f'<button data-ui="button" data-variant="outline" data-size="sm" data-motion-play-btn="{s}" data-target="mo-target">{s}</button>' for s in SHOTS)
 + '</div><form id="mo-invalid" style="display:flex;gap:.5rem"><input placeholder="Leave empty, press Check" aria-label="Required value"><button data-ui="button" type="submit">Check</button></form>')
add(G, "motion-wired", "Animated components", "done", "-", "-",
 "These components animate by default through their parts. Override any of them with data-ui-motion on the part, e.g. data-ui-motion=\"flip\" on a dropdown's content.",
 '''<div data-ui="dropdown-menu"><button data-ui-part="trigger">Dropdown (scale)</button><div data-ui-part="content"><button data-ui-part="item">One</button><button data-ui-part="item">Two</button></div></div>
<div data-ui="dropdown-menu"><button data-ui-part="trigger">Dropdown (flip override)</button><div data-ui-part="content" data-ui-motion="flip"><button data-ui-part="item">One</button><button data-ui-part="item">Two</button></div></div>
<div data-ui="tooltip"><button data-ui-part="trigger">Tooltip (fade)</button><div data-ui-part="content">Fades in and out</div></div>
<div data-ui="dialog"><button data-ui-part="trigger">Dialog (scale + backdrop)</button><dialog data-ui-part="content"><h2 data-ui-part="title">Animated dialog</h2><p data-ui-part="description">Native dialog with @starting-style enter and exit.</p><button data-ui-part="close">Close</button></dialog></div>
<div data-ui="sheet" data-side="right"><button data-ui-part="trigger">Sheet (slide)</button><dialog data-ui-part="content"><h2 data-ui-part="title">Sheet</h2><button data-ui-part="close">Close</button></dialog></div>
<button data-ui="button" id="t-success2" onclick="document.getElementById('t-success').click()">Toast (spring)</button>
<div data-ui="collapsible" style="flex-basis:100%;max-width:360px"><button data-ui-part="trigger">Collapsible (height)</button><div data-ui-part="content"><p>ერთი</p><p>ორი</p></div></div>''')

G = "Theming"
TOK = [("--ui-background","Background"),("--ui-foreground","Text"),("--ui-card","Card"),("--ui-muted","Muted"),("--ui-muted-foreground","Muted text"),("--ui-primary","Primary"),("--ui-primary-foreground","On primary"),("--ui-accent","Accent"),("--ui-destructive","Destructive"),("--ui-success","Success"),("--ui-warning","Warning"),("--ui-border","Border"),("--ui-input","Input border"),("--ui-ring","Focus ring")]
sw = "".join(f'<div class="tk"><span class="tk-sw" style="background:var({v})"></span><div><b>{n}</b><code>{v}</code></div></div>' for v, n in TOK)
add(G, "theme-tokens", "Design tokens", "done", "-", "Theming (CSS variables)",
 "All visuals come from --ui-* custom properties: colour, radius, sizes, spacing, type, shadows, focus ring and motion. Change a token and every component follows; no JS or rebuild needed.",
 f'''<div class="tk-grid">{sw}</div>
<div class="tk-row"><div class="tk-box" style="border-radius:var(--ui-radius-sm)">--ui-radius-sm</div><div class="tk-box" style="border-radius:var(--ui-radius)">--ui-radius</div><div class="tk-box" style="border-radius:var(--ui-radius-lg)">--ui-radius-lg</div><div class="tk-box" style="box-shadow:var(--ui-shadow-sm)">--ui-shadow-sm</div><div class="tk-box" style="box-shadow:var(--ui-shadow)">--ui-shadow</div></div>''')
add(G, "theme-scoped", "Scoped theme override", "done", "-", "-",
 "Tokens cascade, so any container can re-theme just its own subtree. This box sets a teal primary, square corners, compact controls and a serif font, with the same components and markup.",
 '''<div style="display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;align-items:flex-start">
<div class="tk-pane"><small class="muted">Default tokens</small><button data-ui="button">Save</button><button data-ui="switch" aria-checked="true" aria-label="On"></button><div data-ui="progress" data-value="60" aria-label="Progress"><div data-ui-part="indicator"></div></div><div data-ui="toggle-group" data-type="single" data-default-value="b" aria-label="Size"><button data-ui-part="item" data-value="a">S</button><button data-ui-part="item" data-value="b">M</button><button data-ui-part="item" data-value="c">L</button></div></div>
<div class="tk-pane" style="--ui-primary:#0f766e;--ui-primary-foreground:#fff;--ui-ring:#14b8a6;--ui-radius:0px;--ui-control-h:30px;--ui-text-sm:13px;--ui-font:Georgia,serif;font-family:Georgia,serif"><small class="muted">style="--ui-primary:#0f766e; --ui-radius:0; --ui-control-h:30px"</small><button data-ui="button">Save</button><button data-ui="switch" aria-checked="true" aria-label="On"></button><div data-ui="progress" data-value="60" aria-label="Progress"><div data-ui-part="indicator"></div></div><div data-ui="toggle-group" data-type="single" data-default-value="b" aria-label="Size"><button data-ui-part="item" data-value="a">S</button><button data-ui-part="item" data-value="b">M</button><button data-ui-part="item" data-value="c">L</button></div></div></div>''')

# ---- Clothline (L3V, l3v.ai) ----
_cells = [("cl-answers", "Answers", "✦", 16, 70, "<p>Ask anything. Minimize me with − and I hang on the line above. Hover the ✦ for transparency and stretch.</p>", ""),
          ("cl-projects", "Projects", "◈", 250, 96, "<p>Drag my header to move, any corner to resize, □ to maximize. I remember where you left me.</p>", ""),
          ("cl-menu", "Menu", "≡", 480, 60, '<a href="#clothline">Home</a><a href="#clothline">Articles</a><a href="#clothline">Fonts</a>', ' data-kind="menu" data-size="tiny"'),
          ("cl-note", "Note", "✎", 480, 150, "<p>A tiny cell: click the chip to open, click my title to fold me back.</p>", ' data-size="tiny"')]
_btns = lambda kind: '<button data-ui-part="minimize" title="Hang on clothline">−</button>' + ('' if 'menu' in kind else '<button data-ui-part="maximize" aria-pressed="false">□</button>') + '<button data-ui-part="close">×</button>'
_cell_html = "".join(f'''<section data-ui="cell" id="{i}" data-line="#cl-line" data-name="{n}" data-mark="{m}" data-persist="sink-{i}"{extra} style="left:{x}px;top:{y}px"><header data-ui-part="header"><span data-ui-part="mark">{m}</span><span data-ui-part="title">{n}</span>{_btns(extra)}</header><div data-ui-part="body">{t}</div></section>''' for i, n, m, x, y, t, extra in _cells)
add("Navigation", "clothline", "Clothline", "done", "-", "- (L3V original)",
 "Cells are regions labelled by their title; minimize/maximize/close buttons get 'Minimize Answers' style labels. Minimizing moves focus to the new tag on the line; restoring moves focus back into the cell. The line is a navigation landmark ('Minimized cells'); ←/→/Home/End move between tags. The ✦ mark is a button: Enter opens Transparency and Stretch; Esc closes it. Any corner resizes. Tiny cells open on click; menu cells fold after you pick an item. data-persist remembers layout. Alt+Arrows on a focused header moves the cell, Alt+Shift+Arrows resizes it; Esc leaves maximize.",
 f'<div class="cl-desk"><nav data-ui="clothline" id="cl-line" aria-label="Minimized cells" hidden></nav>{_cell_html}</div><p style="flex-basis:100%;text-align:center"><button data-ui="button" data-variant="outline" id="cl-reset">Reset desk</button></p>')
