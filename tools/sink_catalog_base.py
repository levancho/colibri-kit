"""Colibri UI kitchen-sink catalog: BASE. Each add(): group,id,name,status(done|partial|planned|css),metronic,shadcn,notes,demo."""
C = []
def add(group, id, name, status, metronic, shadcn, notes, demo=""):
    C.append(dict(group=group, id=id, name=name, status=status, metronic=metronic, shadcn=shadcn, notes=notes, demo=demo))

G = "Base"
add(G, "accordion", "Accordion", "done", "Accordion", "Accordion",
 "Trigger = button[aria-expanded][aria-controls]; content role=region. Up/Down/Home/End move between triggers. data-type=single|multiple, data-collapsible.",
 """<h4>single</h4><div data-ui="accordion" data-type="single" data-default-value="a">
<div data-ui-part="item" data-value="a"><h3><button data-ui-part="trigger">რა არის Despani?</button></h3><div data-ui-part="content">ქართული საზოგადოებრივი პორტალი.</div></div>
<div data-ui-part="item" data-value="b"><h3><button data-ui-part="trigger">Colibri UI?</button></h3><div data-ui-part="content">Headless UI primitives.</div></div>
<div data-ui-part="item" data-value="c" data-disabled><h3><button data-ui-part="trigger">Disabled item</button></h3><div data-ui-part="content">-</div></div></div>
<h4>multiple</h4><div data-ui="accordion" data-type="multiple" data-default-value="x,y">
<div data-ui-part="item" data-value="x"><button data-ui-part="trigger">X</button><div data-ui-part="content">Open by default</div></div>
<div data-ui-part="item" data-value="y"><button data-ui-part="trigger">Y</button><div data-ui-part="content">Also open</div></div></div>""")
add(G, "alert", "Alert / Dismiss", "done", "Dismiss", "Alert",
 "role=alert or role=status. Close removes node; cancel ui:beforedismiss to veto; data-remove=false hides instead.",
 """<div data-ui="dismiss" role="status"><span><strong>ინფორმაცია:</strong> ცვლილებები შენახულია.</span> <button data-ui-part="close" aria-label="Close">×</button></div>
<div data-ui="dismiss" role="alert" data-variant="destructive" data-remove="false"><span><strong>შეცდომა:</strong> ვერ მოხერხდა.</span> <button data-ui-part="close" aria-label="Close">×</button></div>""")
add(G, "alert-dialog", "Alert Dialog", "done", "Modal (confirm)", "Alert Dialog",
 "role=alertdialog; Esc and backdrop do NOT close by default; focus on [autofocus]; ui:close {returnValue}.",
 """<div data-ui="alert-dialog"><button data-ui-part="trigger">სტატიის წაშლა…</button><dialog data-ui-part="content"><h2 data-ui-part="title">დარწმუნებული ხართ?</h2><p data-ui-part="description">ამ მოქმედების გაუქმება შეუძლებელია.</p>
<div class="row"><button data-ui-part="close" data-ui-return="cancel" autofocus>გაუქმება</button><button data-ui-part="close" data-ui-return="ok" data-variant="destructive">წაშლა</button></div></dialog></div>""")
add(G, "aspect-ratio", "Aspect Ratio", "css", "-", "Aspect Ratio", "Structure only: native CSS aspect-ratio.",
 """<div data-ui-part="aspect-ratio" style="aspect-ratio:16/9;max-width:320px;background:var(--muted)">16 / 9</div>""")
add(G, "avatar", "Avatar", "done", "Avatar", "Avatar", "Image with fallback while loading / on error. data-state=loading|loaded|error.",
 """<span data-ui="avatar"><img data-ui-part="image" src="https://avatars.githubusercontent.com/u/1?v=4" alt="User"><span data-ui-part="fallback">LD</span></span>
<span data-ui="avatar"><img data-ui-part="image" src="data:image/png;base64,AAAA" alt="Broken"><span data-ui-part="fallback">ბწ</span></span> <span data-ui="avatar"><span data-ui-part="fallback">GR</span></span>""")
add(G, "badge", "Badge", "done", "Badge", "Badge", "Presentational; with a remove button the badge deletes itself (ui:remove, cancellable) and focus moves on.",
 """<span data-ui-part="badge">Default</span> <span data-ui-part="badge" data-variant="secondary">Secondary</span> <span data-ui-part="badge" data-variant="destructive">ახალი</span> <span data-ui="badge" data-ui-part="badge" data-variant="outline">ტეგი <button data-ui-part="remove">×</button></span> <span data-ui="badge" data-ui-part="badge" data-variant="outline">სპორტი <button data-ui-part="remove">×</button></span>""")
add(G, "button", "Button", "done", "Button", "Button", "Native button. api.loading=true sets disabled + aria-busy + data-state=loading. data-variant / data-size are styling only.",
 """<button data-ui="button">Default</button> <button data-ui="button" data-variant="outline">Outline</button> <button data-ui="button" data-variant="ghost">Ghost</button>
<button data-ui="button" data-variant="destructive">წაშლა</button> <button data-ui="button" disabled>Disabled</button> <button data-ui="button" id="loading-btn">Click: loading 2s</button>""")
add(G, "button-group", "Button Group", "done", "Button Group", "Button Group",
 "role=group with aria-label. One Tab stop: Left/Right (Up/Down when vertical), Home and End move between buttons. With data-type=single|multiple the buttons are toggles with aria-pressed and the group emits ui:change {value}; data-required keeps one pressed; data-name submits the value with a form.",
 """<div class="bg-demo"><div><small class="muted">Actions (click flashes; not a toggle)</small><div data-ui="button-group" data-label="File actions" id="bg-actions"><button>Copy</button><button>Paste</button><button>Delete</button></div></div>
<div><small class="muted">Pick one (required)</small><div data-ui="button-group" data-label="Text align" data-type="single" data-required data-value="center" data-name="align" id="bg-align"><button data-value="left">Left</button><button data-value="center">Center</button><button data-value="right">Right</button></div></div>
<div><small class="muted">Pick several</small><div data-ui="button-group" data-label="Text style" data-type="multiple" data-value="bold" id="bg-style"><button data-value="bold" aria-label="Bold"><b>B</b></button><button data-value="italic" aria-label="Italic"><i>I</i></button><button data-value="underline" aria-label="Underline"><u>U</u></button><button data-value="strike" disabled aria-label="Strikethrough (unavailable)"><s>S</s></button></div></div>
<div><small class="muted">Vertical</small><div data-ui="button-group" data-label="View" data-type="single" data-orientation="vertical" data-value="list" id="bg-view"><button data-value="list">List</button><button data-value="grid">Grid</button><button data-value="board">Board</button></div></div>
<p class="bg-out" id="bg-out" aria-live="polite">Align: center · Style: bold · View: list</p></div>
""")
add(G, "card", "Card", "css", "Card / KT Card", "Card", "Structure: header/title/description/content/footer parts.",
 """<article data-ui-part="card" aria-labelledby="card-t"><header><h3 data-ui-part="title" id="card-t">სტატია</h3><p data-ui-part="description">2026-10-30</p></header><div data-ui-part="content">Card body…</div><footer><button>წაკითხვა</button></footer></article>""")
add(G, "carousel", "Carousel", "done", "Carousel", "Carousel", "Scroll-snap viewport + prev/next/dots; Left/Right when focused; aria-roledescription; data-loop, data-autoplay pauses on hover/focus.",
 """<div data-ui="carousel" data-loop aria-label="Featured"><div data-ui-part="viewport"><div data-ui-part="slide">სლაიდი 1</div><div data-ui-part="slide">სლაიდი 2</div><div data-ui-part="slide">სლაიდი 3</div></div>
<button data-ui-part="prev" aria-label="Previous slide"></button><button data-ui-part="next" aria-label="Next slide"></button><div data-ui-part="dots"></div></div>""")
add(G, "code-block", "Code Block / Clipboard", "done", "Clipboard (plugin)", "Code Block", "data-ui=clipboard copies data-text or target text; data-state=copied; ui:copy.",
 """<pre data-ui-part="code-block"><code id="snippet">import { createTabs } from "@colibri-kit/ui/core/tabs";</code></pre><button data-ui="clipboard" data-target="#snippet">Copy</button> <button data-ui="clipboard" data-text="გამარჯობა">Copy Georgian</button>""")
add(G, "collapsible", "Collapsible / Collapse", "done", "Collapse", "Collapsible", "button[aria-expanded][aria-controls]; content[hidden]; data-default-open.",
 """<div data-ui="collapsible"><button data-ui-part="trigger">Show 3 more</button><div data-ui-part="content"><p>ერთი</p><p>ორი</p><p>სამი</p></div></div>""")

rows = "".join(f'<tr data-ui-part="row" data-id="{i}"><td><input type="checkbox" data-ui-part="row-select" aria-label="Row {i}"></td><td>{t}</td><td>{v}</td><td>{d}</td></tr>'
  for i, (t, v, d) in enumerate([("თბილისი", 120, "2026-10-01"), ("ბათუმი", 98, "2026-09-15"), ("ქუთაისი", 300, "2026-10-20"), ("გორი", 5, "2025-12-31"), ("ზუგდიდი", 42, "2026-01-11")], 1))
add(G, "datatable", "Data Table / Datatable", "done", "Datatable", "Data Table",
 "Enhances a server-rendered table: sort (aria-sort, Shift=multi), search, client paging, select-all tri-state, column visibility. data-remote emits ui:query.",
 f"""<div data-ui="datatable" data-page-size="3"><input data-ui-part="search" placeholder="ძებნა…" aria-label="Search">
<table><thead><tr><th data-ui-part="select-all"><input type="checkbox" aria-label="Select all"></th><th data-sort="title">სათაური</th><th data-sort="views" data-type="number">ნახვები</th><th data-sort="date" data-type="date">თარიღი</th></tr></thead><tbody>{rows}</tbody></table>
<p data-ui-part="empty" hidden>ვერაფერი მოიძებნა</p><div data-ui-part="info" aria-live="polite"></div><nav data-ui="pagination" data-total="1" data-page="1"></nav></div>""")
add(G, "dialog", "Dialog / Modal", "done", "Modal", "Dialog",
 "Native dialog showModal (focus trap, inert page), Esc/backdrop close, focus returns to opener, aria-labelledby/-describedby, cancellable ui:beforeclose, form method=dialog.",
 """<div data-ui="dialog"><button data-ui-part="trigger">Edit profile</button><dialog data-ui-part="content"><h2 data-ui-part="title">პროფილი</h2><p data-ui-part="description">შეცვალეთ მონაცემები.</p>
<form method="dialog"><label>სახელი <input value="ლევანი" autofocus></label><div class="row"><button value="cancel">Cancel</button><button value="save">Save</button></div></form></dialog></div>
<div data-ui="dialog" data-modal="false"><button data-ui-part="trigger">Non-modal</button><dialog data-ui-part="content"><h2 data-ui-part="title">Non-modal</h2><button data-ui-part="close">Close</button></dialog></div>""")
add(G, "drawer", "Drawer / Sheet", "partial", "Drawer", "Sheet, Drawer",
 "Dialog variant: data-ui=sheet|drawer + data-side=left|right|top|bottom; CSS positions by [data-side]. Drag-to-dismiss (shadcn Drawer/vaul): planned.",
 """<div data-ui="sheet" data-side="right"><button data-ui-part="trigger">Sheet (right)</button><dialog data-ui-part="content"><h2 data-ui-part="title">ფილტრები</h2><p>Sheet content…</p><button data-ui-part="close">Close</button></dialog></div>
<div data-ui="drawer" data-side="bottom"><button data-ui-part="trigger">Drawer (bottom)</button><dialog data-ui-part="content"><h2 data-ui-part="title">Drawer</h2><button data-ui-part="close">Close</button></dialog></div>""")
add(G, "dropdown-menu", "Dropdown Menu", "done", "Dropdown, Menu", "Dropdown Menu",
 "role=menu; Down/Up/Home/End, typeahead, Enter/Space; Right/Left for submenus; checkbox/radio items; Esc/outside/Tab close; focus returns; ui:select (cancel to keep open).",
 """<div data-ui="dropdown-menu"><button data-ui-part="trigger">მოქმედებები</button><div data-ui-part="content">
<div data-ui-part="label">სტატია</div><button data-ui-part="item">რედაქტირება <kbd>⌘E</kbd></button><button data-ui-part="item">დუბლირება</button><button data-ui-part="item" disabled>არქივი</button>
<hr data-ui-part="separator"><button data-ui-part="item" data-type="checkbox" aria-checked="true">გამოქვეყნებული</button>
<div data-ui-part="radio-group"><button data-ui-part="item" data-type="radio" data-value="ka" aria-checked="true">ქართული</button><button data-ui-part="item" data-type="radio" data-value="en">English</button></div>
<div data-ui-part="sub"><button data-ui-part="sub-trigger">გაზიარება</button><div data-ui-part="sub-content" hidden><button data-ui-part="item">Facebook</button><button data-ui-part="item">Email</button></div></div>
<hr data-ui-part="separator"><button data-ui-part="item" data-variant="destructive">წაშლა</button></div></div>""")
add(G, "context-menu", "Context Menu", "done", "Menu (right-click)", "Context Menu", "Same menu core; opens at pointer on right-click, or Shift+F10 / ContextMenu key on the focused area.",
 """<div data-ui="context-menu"><div data-ui-part="area" style="padding:2rem;border:1px dashed var(--border)">მარჯვენა ღილაკი აქ (or focus + Shift+F10)</div>
<div data-ui-part="content"><button data-ui-part="item">Back</button><button data-ui-part="item">Reload</button><hr data-ui-part="separator"><button data-ui-part="item" data-type="checkbox">Show bookmarks</button></div></div>""")
add(G, "empty", "Empty", "css", "-", "Empty", "Structure: media/title/description/actions.",
 """<div data-ui-part="empty-state"><div>📭</div><h3>სტატიები არ არის</h3><p>შექმენით პირველი სტატია.</p><button>ახალი სტატია</button></div>""")
add(G, "hover-card", "Hover Card", "done", "Tooltip (rich)", "Hover Card", "Opens after hovering 300 ms or on keyboard focus; stays open while the pointer is over the card; Esc closes. The trigger stays a normal link.",
 """<p>Hover or Tab to the username: <span data-ui="hover-card"><a href="#hover-card" data-ui-part="trigger">@levancho</a><span data-ui-part="content" class="hc"><span data-ui="avatar"><span data-ui-part="fallback">LD</span></span><span><strong>ლევან დვალიშვილი</strong><br><small>Despani founder. Building Colibri CMS.</small><br><small class="muted">📅 Joined 2007</small></span></span></span></p>""")
add(G, "item", "Item", "done", "-", "Item", "role=list / listitem. One Tab stop for the whole list; Up/Down/Home/End move between rows; Enter or click opens a clickable row (ui:activate); Right arrow goes into the row's controls, Left/Esc goes back to the row.",
 """<div data-ui="item-group" aria-label="Notification settings" class="demo-w">
<div data-ui-part="item"><span data-ui-part="media">🔔</span><div data-ui-part="content"><div data-ui-part="title">შეტყობინებები</div><div data-ui-part="description">Email and push notifications</div></div><div data-ui-part="actions"><button data-ui="switch" aria-checked="true" aria-label="Notifications"></button></div></div>
<div data-ui-part="item" data-value="profile"><span data-ui-part="media">👤</span><div data-ui-part="content"><a data-ui-part="title-link" href="#item"><span data-ui-part="title">პროფილი</span></a><div data-ui-part="description">Clickable row: opens a page</div></div><div data-ui-part="actions"><span class="chev" aria-hidden="true"></span></div></div>
<div data-ui-part="item"><span data-ui-part="media">📄</span><div data-ui-part="content"><div data-ui-part="title">report-2026.pdf</div><div data-ui-part="description">2.4 MB · 30 Oct</div></div><div data-ui-part="actions"><button data-ui="button" data-variant="outline" data-size="sm">Download</button><button data-ui="button" data-variant="ghost" data-size="sm" aria-label="Delete file">🗑</button></div></div>
<div data-ui-part="item" data-disabled><span data-ui-part="media">🔒</span><div data-ui-part="content"><div data-ui-part="title">Two-factor login</div><div data-ui-part="description">Disabled row</div></div></div></div>""")
add(G, "kbd", "Kbd", "css", "Kbd", "Kbd", "Native kbd.", """Press <kbd>Ctrl</kbd> + <kbd>K</kbd> for the command palette.""")
add(G, "label", "Label", "css", "-", "Label", "Native label[for]; Field wires it automatically.", """<label for="lbl-demo">ელ-ფოსტა</label> <input id="lbl-demo" type="email">""")
add(G, "link", "Link", "css", "Link", "-", "Native a; aria-current=page for active.", """<a href="#link">Regular link</a> · <a href="#link" aria-current="page">Current page</a>""")
add(G, "popover", "Popover", "done", "Dropdown (panel)", "Popover", "Click trigger; role=dialog; Esc/outside close; [autofocus] gets focus; data-side/data-align; data-position=none to self-position.",
 """<div data-ui="popover"><button data-ui-part="trigger">ზომები</button><div data-ui-part="content"><label>Width <input value="100%" autofocus></label><br><label>Height <input value="25px"></label><br><button data-ui-part="close">Done</button></div></div>""")
add(G, "progress", "Progress", "done", "Progress", "Progress", "role=progressbar + aria-valuenow; no value = indeterminate; sets --ui-progress.",
 """<div data-ui="progress" data-value="66" aria-label="Upload"><div data-ui-part="indicator"></div></div><div data-ui="progress" aria-label="Loading"><div data-ui-part="indicator"></div></div>""")
add(G, "rating", "Rating", "done", "Rating", "-", "Native radios (arrow keys work), hover preview, data-readonly.",
 """<div data-ui="rating" data-name="stars" data-max="5" data-value="3" aria-label="Rating"></div> <div data-ui="rating" data-max="5" data-value="4" data-readonly aria-label="Read-only"></div>""")
add(G, "reparent", "Reparent", "done", "Reparent", "-", "Moves an element between containers by media query.",
 """<div id="rp-desktop" style="border:1px dashed var(--border);padding:.5rem">Wide slot (&gt;= 700px): <span data-ui="reparent" data-target="#rp-desktop" data-target-mobile="#rp-mobile" data-media="(max-width: 699px)" data-ui-part="badge">I move</span></div>
<div id="rp-mobile" style="border:1px dashed var(--border);padding:.5rem">Narrow slot (&lt; 700px)</div>""")
add(G, "resizable", "Resizable", "done", "-", "Resizable", "role=separator; Left/Right (Shift=10%), Home/End, pointer drag; data-min; persist with data-storage-key.",
 """<div data-ui="resizable" style="height:120px;border:1px solid var(--border)"><div data-ui-part="panel" data-size="30" data-min="15">Sidebar</div><div data-ui-part="handle" aria-label="Resize"></div><div data-ui-part="panel" data-size="70">Content</div></div>""")
add(G, "scroll-area", "Scroll Area / Scrollable", "done", "Scrollable", "Scroll Area", "Native scroll; focusable region; data-scroll-top/bottom flags for edge shadows.",
 '<div data-ui="scroll-area" data-max-height="120px" aria-label="Tags">' + "".join(f"<p>ტეგი #{i}</p>" for i in range(1, 16)) + "</div>")
add(G, "separator", "Separator", "done", "Separator", "Separator", "role=separator + aria-orientation; data-decorative = role none.", """<p>ზემოთ</p><hr data-ui="separator"><p>ქვემოთ</p>""")
add(G, "skeleton", "Skeleton / Spinner", "css", "Skeleton", "Skeleton, Spinner", "skeleton aria-hidden; spinner role=status + visually-hidden label.",
 """<div style="display:flex;gap:.9rem;align-items:center" aria-hidden="true"><div data-ui-part="skeleton" style="width:44px;height:44px;border-radius:50%"></div><div style="display:grid;gap:.5rem"><div data-ui-part="skeleton" style="width:220px;height:14px"></div><div data-ui-part="skeleton" style="width:160px;height:14px"></div></div></div>
<div data-ui-part="card" aria-hidden="true" style="width:240px;padding:1rem;display:grid;gap:.6rem"><div data-ui-part="skeleton" style="height:110px"></div><div data-ui-part="skeleton" style="height:14px;width:70%"></div><div data-ui-part="skeleton" style="height:14px;width:45%"></div></div>
<span data-ui-part="spinner" role="status"><span class="sr-only">იტვირთება…</span></span>""")
add(G, "table", "Table", "css", "Table", "Table", "Native table with caption/thead/scope; behaviour in Data Table.",
 """<table><caption>ბოლო სტატიები</caption><thead><tr><th scope="col">სათაური</th><th scope="col">ავტორი</th></tr></thead><tbody><tr><td>Hello</td><td>Levan</td></tr></tbody></table>""")
add(G, "theme-switch", "Theme Switch", "done", "Theme Switch", "(dark mode)", "Cycles light, dark, system; sets html data-theme + color-scheme; persisted; follows prefers-color-scheme.",
 """<button data-ui="theme-switch" data-storage-key="colibri.sink.theme">Theme: <span class="mode-label"></span></button>""")
add(G, "toast", "Toast / Sonner", "done", "Toast", "Toast, Sonner", "Region + polite/assertive announcer; pause on hover/focus; action button; toast.promise(); max stack.",
 """<button id="t-default">Default</button> <button id="t-success">Success</button> <button id="t-error">Error</button> <button id="t-action">With action</button> <button id="t-promise">Promise (2s)</button>""")
add(G, "toggle", "Toggle", "done", "Toggle", "Toggle", "button[aria-pressed]; data-state=on|off.",
 """<button data-ui="toggle" aria-label="Bold"><b>B</b></button> <button data-ui="toggle" aria-pressed="true" aria-label="Italic"><i>I</i></button> <button data-ui="toggle" disabled aria-label="Underline"><u>U</u></button>""")
add(G, "tooltip", "Tooltip", "done", "Tooltip", "Tooltip", "role=tooltip + aria-describedby; hover (500ms) and focus; Esc closes.",
 """<div data-ui="tooltip"><button data-ui-part="trigger">Hover / focus me</button><div data-ui-part="content">ეს არის მინიშნება</div></div> <div data-ui="tooltip" data-side="right" data-delay="0"><button data-ui-part="trigger">Instant (right)</button><div data-ui-part="content">Right side</div></div>""")
add(G, "typography", "Typography", "css", "-", "Typography", "Pure CSS concern.", """<h1>H1 სათაური</h1><p>პარაგრაფი <code>code</code> <a href="#">link</a>.</p><blockquote>ციტატა</blockquote>""")
add(G, "message-scroller", "Message Scroller", "done", "-", "Message, Message Scroller, Bubble", "role=log; sticks to bottom unless user scrolled up; jump button.",
 '<div data-ui="message-scroller"><div data-ui-part="viewport" style="height:140px;overflow:auto;border:1px solid var(--border)">' + "".join(f'<div data-ui-part="message" data-from="{"me" if i % 2 else "them"}"><span data-ui-part="bubble">შეტყობინება {i}</span></div>' for i in range(1, 9)) + '</div><button data-ui-part="jump" hidden>↓ ახალი</button></div><button id="msg-add">Add message</button>')
add(G, "chart", "Chart", "planned", "ApexCharts (plugin)", "Chart", "Out of headless scope: wrap a chart lib + accessible table fallback.")
add(G, "attachment", "Attachment", "partial", "-", "Attachment", "Covered by File Input (list/remove); inline preview chips planned.")
add(G, "direction", "Direction (RTL)", "css", "RTL", "Direction", "Use the native dir=rtl attribute; layout mirrors automatically through CSS logical properties. Arrow-key mirroring inside RTL tabs and menus is planned.",
 """<div dir="rtl" lang="ar" style="display:grid;gap:.75rem;justify-items:start"><div data-ui="dismiss" role="status"><span><strong>مرحبا:</strong> هذا تنبيه من اليمين إلى اليسار.</span> <button data-ui-part="close" aria-label="إغلاق">×</button></div>
<div data-ui-part="input-group"><span data-ui-part="addon">@</span><input aria-label="اسم المستخدم" value="levancho"></div></div>""")

from sink_info import INFO as _I
_I["spinner"] = ("Spinner", "A spinning indicator that says something is loading, announced to screen readers.", "Inside a button while saving, or in place of content that is still loading.")
add("Base", "spinner", "Spinner", "done", "Spinner", "Spinner",
 "role=status + aria-live=polite with a visually hidden label (data-label, default 'Loading…'). Keeps turning, slower, with reduced motion or Animations off, because it reports status. api: start(), stop(), label.",
 """<div class="sp-demo">
<div class="sp-cell"><span data-ui="spinner" data-size="sm"></span><span data-ui="spinner"></span><span data-ui="spinner" data-size="lg"></span><span data-ui="spinner" data-size="xl"></span><code>ring · sm md lg xl</code></div>
<div class="sp-cell"><span data-ui="spinner" data-variant="dots" data-size="lg"></span><code>dots</code></div>
<div class="sp-cell"><span data-ui="spinner" data-variant="bars" data-size="lg"></span><code>bars</code></div>
<div class="sp-cell"><span data-ui="spinner" data-tone="muted" data-size="lg"></span><code>muted tone</code></div>
<div class="sp-cell"><button data-ui="button" disabled><span data-ui="spinner" data-size="sm" data-label="Saving…"></span> Saving…</button><code>in a button</code></div>
<div class="sp-cell"><button data-ui="button" data-variant="outline" id="sp-run">Load data</button><span data-ui="spinner" id="sp-live" data-label="Loading data…" hidden></span><span id="sp-msg" class="muted"></span><code>start() / stop()</code></div>
</div>""")
