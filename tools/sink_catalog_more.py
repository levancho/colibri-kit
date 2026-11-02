from sink_catalog_base import add, C
G = "Navigation"
add(G, "breadcrumb", "Breadcrumb", "css", "Breadcrumb", "Breadcrumb", "nav[aria-label=Breadcrumb] > ol; last item aria-current=page.",
 """<nav aria-label="Breadcrumb" data-ui-part="breadcrumb"><ol><li><a href="#">Home</a></li><li><a href="#">Articles</a></li><li><span aria-current="page">Edit</span></li></ol></nav>""")
add(G, "menu", "Menubar", "done", "Menu (horizontal)", "Menubar", "role=menubar; Left/Right between menus, Down opens; hovering moves between open menus.",
 """<div data-ui="menubar" aria-label="App">
<div data-ui-part="menu"><button data-ui-part="trigger">File</button><div data-ui-part="content"><button data-ui-part="item">New</button><button data-ui-part="item">Open…</button><hr data-ui-part="separator"><button data-ui-part="item">Print</button></div></div>
<div data-ui-part="menu"><button data-ui-part="trigger">Edit</button><div data-ui-part="content"><button data-ui-part="item">Undo</button><button data-ui-part="item">Redo</button></div></div>
<div data-ui-part="menu"><button data-ui-part="trigger">View</button><div data-ui-part="content"><button data-ui-part="item" data-type="checkbox" aria-checked="true">Status bar</button></div></div></div>""")
add(G, "navigation-menu", "Navigation Menu", "done", "Menu (mega)", "Navigation Menu", "Disclosure pattern (not role=menu): links stay links; hover or click opens; Esc closes.",
 """<nav data-ui="navigation-menu" aria-label="Main"><ul data-ui-part="list">
<li data-ui-part="menu"><button data-ui-part="trigger">Products</button><div data-ui-part="content"><a href="#">Colibri CMS</a><br><a href="#">Colibri UI</a></div></li>
<li data-ui-part="menu"><button data-ui-part="trigger">Resources</button><div data-ui-part="content"><a href="#">Documentation</a><br><a href="#">Blog</a></div></li>
<li><a href="#">Contact</a></li></ul></nav>""")
add(G, "pagination", "Pagination", "done", "Pagination", "Pagination", "Renders buttons (or links with data-href); aria-current=page; ellipsis; ui:change {page}.",
 """<nav data-ui="pagination" data-total="20" data-page="7" aria-label="Pages"></nav><nav data-ui="pagination" data-total="5" data-page="1" data-href="?page={page}" aria-label="Link pages"></nav>""")
add(G, "scrollspy", "Scrollspy", "done", "Scrollspy", "-", "IntersectionObserver; sets aria-current + data-state=active on links. This page's sidebar uses it.",
 """<p>See the left sidebar: the active section is highlighted while you scroll.</p>""")
add(G, "scrollto", "Scroll To", "done", "Scrollto", "-", "Smooth scroll + moves focus to target (tabindex=-1), respects prefers-reduced-motion.",
 """<a data-ui="scrollto" href="#top" data-offset="0">↑ Back to top</a>""")
add(G, "sidebar", "Sidebar", "done", "Sidebar (layout)", "Sidebar", "data-state=expanded|collapsed; mobile offcanvas below breakpoint; Ctrl/Cmd+B; persisted. This page's sidebar.",
 """<button data-ui-sidebar-toggle="#sink-sidebar">Toggle page sidebar (Ctrl/Cmd+B)</button>""")
add(G, "stepper", "Stepper", "done", "Stepper", "-", "aria-current=step on the step; linear mode checks native validity; ui:beforechange cancellable; ui:finish.",
 """<div data-ui="stepper" data-linear><ol data-ui-part="list"><li data-ui-part="step">Account</li><li data-ui-part="step">Profile</li><li data-ui-part="step">Finish</li></ol>
<section data-ui-part="panel"><label>Email <input type="email" required></label></section><section data-ui-part="panel"><label>Name <input></label></section><section data-ui-part="panel">Ready!</section>
<div class="row"><button data-ui-part="prev">Back</button><button data-ui-part="next">Next</button><button data-ui-part="finish">Finish</button></div></div>""")
add(G, "sticky", "Sticky", "done", "Sticky", "-", "CSS does sticking; JS only flags data-state=stuck. The page header uses it.", """<p>The top bar of this page is <code>data-ui="sticky"</code>.</p>""")
add(G, "tabs", "Tabs", "done", "Tabs", "Tabs", "role=tablist/tab/tabpanel; Left/Right/Home/End, automatic or manual activation (data-activation=manual), vertical orientation, disabled tabs.",
 """<div data-ui="tabs" data-default-value="news"><div data-ui-part="list" aria-label="Sections"><button data-ui-part="trigger" data-value="news">News</button><button data-ui-part="trigger" data-value="sport">Sports</button><button data-ui-part="trigger" data-value="off" data-disabled>Disabled</button></div>
<div data-ui-part="panel" data-value="news">News panel</div><div data-ui-part="panel" data-value="sport">Sports panel</div><div data-ui-part="panel" data-value="off">-</div></div>
<h4>vertical + manual</h4><div data-ui="tabs" data-orientation="vertical" data-activation="manual" data-default-value="a" style="display:flex;gap:1rem"><div data-ui-part="list" aria-label="Vertical" style="flex-direction:column"><button data-ui-part="trigger" data-value="a">A</button><button data-ui-part="trigger" data-value="b">B</button></div><div data-ui-part="panel" data-value="a">Panel A</div><div data-ui-part="panel" data-value="b">Panel B (Enter to activate)</div></div>""")
add(G, "command", "Command", "done", "(search modal)", "Command", "Combobox + listbox; filter with keywords; Up/Down/Enter; data-hotkey=k opens the parent dialog with Ctrl/Cmd+K.",
 """<div data-ui="dialog" id="cmd-dialog"><button data-ui-part="trigger">Command palette <kbd>Ctrl K</kbd></button><dialog data-ui-part="content" aria-label="Command"><div data-ui="command" data-hotkey="k"><input data-ui-part="input" placeholder="Command…" aria-label="Command"><div data-ui-part="list">
<div data-ui-part="group"><div data-ui-part="label">Pages</div><div data-ui-part="option" data-value="home" data-keywords="main">Home</div><div data-ui-part="option" data-value="articles">Articles</div></div>
<hr data-ui-part="separator"><div data-ui-part="group"><div data-ui-part="label">Settings</div><div data-ui-part="option" data-value="theme" data-keywords="dark light">Change theme</div><div data-ui-part="option" data-value="profile" data-disabled>Profile</div></div>
<div data-ui-part="empty">No results found</div></div></div></dialog></div>""")
add(G, "questionnaire", "Questionnaire", "planned", "-", "Questionnaire", "Compose from Stepper + Field + RadioGroup; dedicated wrapper planned.")
add(G, "marker", "Marker / Trace", "planned", "-", "Marker, Trace", "AI-chat visual elements; structural only, planned.")

G = "Forms"
add(G, "input", "Input", "css", "Input", "Input", "Native input; Field wires label/description/error.", """<input placeholder="Text"> <input disabled value="Disabled"> <input aria-invalid="true" value="Invalid">""")
add(G, "input-group", "Input Group", "css", "Input Group", "Input Group", "Structure: addon parts around an input.",
 """<div data-ui-part="input-group"><span data-ui-part="addon">https://</span><input aria-label="Site" value="despani.ge"><span data-ui-part="addon">.ge</span></div>""")
add(G, "field", "Field / Form", "done", "(form)", "Field, Form", "Generates ids; wires label for, aria-describedby, aria-invalid; shows error on native invalid or server data-invalid.",
 """<div data-ui="field"><label data-ui-part="label">Email</label><input data-ui-part="control" type="email" required><p data-ui-part="description">We will never share your email.</p><p data-ui-part="error"></p></div>
<div data-ui="field" data-invalid><label data-ui-part="label">Username</label><input data-ui-part="control" value="admin"><p data-ui-part="error">Already taken (server error)</p></div>""")
add(G, "checkbox", "Checkbox", "done", "Checkbox", "Checkbox", "Native or button[role=checkbox]; tri-state mixed; select-all via data-controls.",
 """<label><input type="checkbox" data-ui="checkbox" checked> Remember me</label> <label><button data-ui="checkbox" aria-checked="mixed" aria-label="Mixed state"></button> Mixed</label> <label><input type="checkbox" data-ui="checkbox" disabled> Disabled</label>
<fieldset id="cb-group" style="display:grid;gap:.5rem;padding:.75rem 1rem"><legend class="muted" style="font-size:12px">Select-all (tri-state)</legend><label><input type="checkbox" data-ui="checkbox" data-controls="#cb-group .cb-child"> <b>All</b></label><label style="padding-left:1.5rem"><input type="checkbox" class="cb-child"> One</label><label style="padding-left:1.5rem"><input type="checkbox" class="cb-child"> Two</label></fieldset>""")
add(G, "radio-group", "Radio Group / Radio", "done", "Radio", "Radio Group", "role=radiogroup; roving focus, arrows select; native radios also enhanced.",
 """<div data-ui="radio-group" data-default-value="ka" aria-label="Language"><button data-ui-part="item" data-value="ka">Georgian</button><button data-ui-part="item" data-value="en">English</button><button data-ui-part="item" data-value="ru" disabled>Russian</button></div>""")
add(G, "switch", "Switch", "done", "Switch", "Switch", "button[role=switch][aria-checked] or native checkbox; Space toggles.",
 """<label><button data-ui="switch" aria-checked="true"></button> Airplane mode</label> <label><input type="checkbox" data-ui="switch"> native</label> <button data-ui="switch" disabled aria-label="Disabled"></button>""")
add(G, "select", "Select", "done", "Select", "Select, Native Select", "Listbox popup; typeahead; groups; data-multiple; hidden input posts normally. native select = native-select.",
 """<div data-ui="select" data-name="lang" data-placeholder="Choose a language"><button data-ui-part="trigger"><span data-ui-part="value"></span></button><div data-ui-part="content">
<div data-ui-part="group"><div data-ui-part="label">Europe</div><div data-ui-part="option" data-value="ka">Georgian</div><div data-ui-part="option" data-value="en">English</div><div data-ui-part="option" data-value="de" data-disabled>German</div></div></div></div>
<div data-ui="select" data-name="tags" data-multiple data-placeholder="Tags"><button data-ui-part="trigger"><span data-ui-part="value"></span></button><div data-ui-part="content"><div data-ui-part="option" data-value="news">News</div><div data-ui-part="option" data-value="sport">Sports</div><div data-ui-part="option" data-value="tech">Tech.</div></div></div>
<select aria-label="Native select"><option>Native select</option><option>One</option></select>""")
add(G, "combobox", "Combobox", "done", "Select (search)", "Combobox", "input[role=combobox] + listbox; filter, aria-activedescendant; chips in multiple; data-allow-custom; remote via ui:search.",
 """<div data-ui="combobox" data-name="city"><input data-ui-part="input" placeholder="City…" aria-label="City"><button data-ui-part="trigger" aria-label="Show options"></button><div data-ui-part="content">
<div data-ui-part="option" data-value="tbilisi">Tbilisi</div><div data-ui-part="option" data-value="batumi">Batumi</div><div data-ui-part="option" data-value="kutaisi">Kutaisi</div><div data-ui-part="empty">No results found</div></div></div>
<div data-ui="combobox" data-name="langs" data-multiple data-allow-custom><div data-ui-part="chips"></div><input data-ui-part="input" placeholder="Multiple + custom" aria-label="Languages"><div data-ui-part="content"><div data-ui-part="option" data-value="js">JavaScript</div><div data-ui-part="option" data-value="java">Java</div><div data-ui-part="option" data-value="ftl">FreeMarker</div></div></div>""")
add(G, "slider", "Slider", "done", "Slider", "Slider", "role=slider per thumb; arrows, PageUp/Down, Home/End; range; vertical; hidden inputs.",
 """<div data-ui="slider" data-min="0" data-max="100" data-value="40" data-name="vol"><div data-ui-part="track"><div data-ui-part="range"></div></div><span data-ui-part="thumb" aria-label="Volume"></span></div>
<div data-ui="slider" data-min="0" data-max="1000" data-step="10" data-value="200,800" data-name="price"><div data-ui-part="track"><div data-ui-part="range"></div></div><span data-ui-part="thumb" aria-label="Min"></span><span data-ui-part="thumb" aria-label="Max"></span></div>""")
add(G, "pin-input", "Pin Input / Input OTP", "done", "Pin Input", "Input OTP", "Auto-advance, Backspace back, paste fills, numeric filter, autocomplete=one-time-code; ui:complete.",
 """<div data-ui="pin-input" data-length="6" data-name="otp" data-type="numeric" aria-label="Code"></div> <div data-ui="pin-input" data-length="4" data-mask aria-label="PIN"></div>""")
add(G, "toggle-password", "Toggle Password", "done", "Toggle Password", "-", "Switches type and aria-pressed/label.",
 """<div data-ui="toggle-password"><input type="password" data-ui-part="input" value="admin" aria-label="Password"><button data-ui-part="toggle" aria-label="Show password">👁</button></div>""")
add(G, "textarea", "Textarea", "done", "Textarea", "Textarea", "data-autosize grows with content; data-count char count.", """<textarea data-ui="textarea" data-autosize data-max-rows="8" maxlength="200" aria-label="Comment">Write a comment…</textarea>""")
add(G, "file-input", "File Input", "done", "File Input", "(Attachment)", "Native input stays the source; dropzone, list with remove, data-max-size.",
 """<div data-ui="file-input"><input type="file" data-ui-part="input" multiple data-max-size="2MB"><div data-ui-part="dropzone">Drop files here</div><ul data-ui-part="list"></ul></div>""")
add(G, "image-input", "Image Input", "done", "Image Input", "-", "Preview, change, remove (hidden removed flag for server).",
 """<div data-ui="image-input"><img data-ui-part="preview" alt="Avatar preview" width="80" height="80" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 80 80%27%3E%3Crect width=%2780%27 height=%2780%27 fill=%27%23e4e4e7%27/%3E%3Ccircle cx=%2740%27 cy=%2732%27 r=%2713%27 fill=%27%23a1a1aa%27/%3E%3Cpath d=%27M16 72c2-14 12-20 24-20s22 6 24 20%27 fill=%27%23a1a1aa%27/%3E%3C/svg%3E"><input type="file" accept="image/*" data-ui-part="input" hidden><button data-ui-part="change">Change</button><button data-ui-part="remove" data-variant="outline">Delete</button><input type="hidden" data-ui-part="removed" name="avatar_remove"></div>""")
add(G, "repeater", "Repeater", "done", "Repeater", "-", "Template rows; renumbers name=items[i].x for Spring binding; min/max.",
 """<div data-ui="repeater" data-min="1" data-max="5"><template data-ui-part="template"><div data-ui-part="row"><input name="items[__i__].name" placeholder="Name"><button type="button" data-ui-part="remove">−</button></div></template><div data-ui-part="list"></div><button type="button" data-ui-part="add">+ Add</button></div>""")
add(G, "color-picker", "Color Picker", "done", "Color Picker", "-", "Native color input + text field + swatches.",
 """<div data-ui="color-picker" data-name="brand"><input type="color" data-ui-part="input" value="#2563eb" aria-label="Color"><input data-ui-part="text" aria-label="Hex"><button data-ui-part="swatch" data-value="#e11d48" aria-label="Red"></button><button data-ui-part="swatch" data-value="#16a34a" aria-label="Green"></button></div>""")
add(G, "sortable", "Sortable", "done", "Sortable", "-", "Pointer drag + keyboard (Space lift, arrows move, Space drop) with live announcements.",
 """<ul data-ui="sortable" aria-label="Order"><li data-ui-part="item" data-value="a">One</li><li data-ui-part="item" data-value="b">Two</li><li data-ui-part="item" data-value="c">Three</li></ul>""")
add(G, "toggle-group", "Toggle Group", "done", "Toggle Group", "Toggle Group", "single (radio-like) or multiple; roving focus.",
 """<div data-ui="toggle-group" data-type="single" data-default-value="c" aria-label="Align"><button data-ui-part="item" data-value="l">L</button><button data-ui-part="item" data-value="c">C</button><button data-ui-part="item" data-value="r">R</button></div>
<div data-ui="toggle-group" data-type="multiple" data-default-value="b,i" aria-label="Format"><button data-ui-part="item" data-value="b"><b>B</b></button><button data-ui-part="item" data-value="i"><i>I</i></button><button data-ui-part="item" data-value="u"><u>U</u></button></div>""")
add(G, "calendar", "Calendar", "done", "(date-picker grid)", "Calendar", "ARIA grid; arrows/PageUp/PageDown/Home/End; single/range/multiple; min/max; Intl locale ka.",
 """<div data-ui="calendar" data-mode="single" data-value="2026-10-30" data-locale="en"></div><div data-ui="calendar" data-mode="range" data-months="2" data-locale="en"></div>""")
add(G, "date-picker", "Date Picker", "done", "Date Picker", "Date Picker", "Input + popover calendar; typing parses ISO; posts ISO value.",
 """<div data-ui="date-picker" data-name="published"><input data-ui-part="input" placeholder="YYYY-MM-DD" aria-label="Published"><button data-ui-part="trigger" aria-label="Choose date"></button><div data-ui-part="content"><div data-ui="calendar" data-locale="en"></div></div></div>""")
