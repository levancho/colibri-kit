# Colibri UI component reference

Generated from `registry/colibri.json` and `src/core/registry.js`. Root: `data-ui="NAME"` (or `<ui-NAME>` after importing `src/elements/all.js`). Parts: `data-ui-part="PART"`. For full markup run `node bin/colibri.mjs view NAME`.

## Base

### `accordion`
A stack of headings that each expand to reveal a section of content.
- When: FAQs, settings groups: when users only need one or two sections at a time.
- Parts: `content`, `item`, `trigger`
- A11y / attributes: Trigger = button[aria-expanded][aria-controls]; content role=region. Up/Down/Home/End move between triggers. data-type=single|multiple, data-collapsible.

### `alert`
A message box that tells the user something important, with an optional close button.
- When: Success / error / info messages inside the page (not popups).
- Parts: `close`
- A11y / attributes: role=alert or role=status. Close removes node; cancel ui:beforedismiss to veto; data-remove=false hides instead.

### `alert-dialog`
A popup that asks the user to confirm or cancel a risky action. It can't be dismissed by clicking outside.
- When: Before deleting, publishing, or anything that can't be undone.
- Parts: `close`, `content`, `description`, `title`, `trigger`
- A11y / attributes: role=alertdialog; Esc and backdrop do NOT close by default; focus on [autofocus]; ui:close {returnValue}.

### `aspect-ratio` (CSS/markup only, no JS behaviour)
A box that keeps a fixed width-to-height shape (e.g. 16:9) as it resizes.
- When: Videos, images, maps, embeds.
- Parts: `aspect-ratio`
- A11y / attributes: Structure only: native CSS aspect-ratio.

### `avatar`
A round user picture that shows initials when there's no image or it fails to load.
- When: User lists, comments, the account menu.
- Parts: `fallback`, `image`
- A11y / attributes: Image with fallback while loading / on error. data-state=loading|loaded|error.

### `badge`
A small coloured label for a status or count.
- When: "New", "Draft", unread counts, categories.
- Parts: `badge`, `remove`
- A11y / attributes: Presentational; with a remove button the badge deletes itself (ui:remove, cancellable) and focus moves on.

### `button`
A clickable button in several styles and sizes, including a loading state.
- When: Any action. Use the destructive style for deletes.
- A11y / attributes: Native button. api.loading=true sets disabled + aria-busy + data-state=loading. data-variant / data-size are styling only.

### `button-group`
Related buttons joined into one control; optionally pick one or several.
- When: Toolbars: copy/paste actions, text alignment, bold/italic toggles.
- A11y / attributes: role=group with aria-label. One Tab stop: Left/Right (Up/Down when vertical), Home and End move between buttons. With data-type=single|multiple the buttons are toggles with aria-pressed and the group emits ui:change {value}; data-required keeps one pressed; data-name submits the value with a form.

### `card` (CSS/markup only, no JS behaviour)
A bordered box that groups a title, content and actions.
- When: Article previews, dashboard tiles, settings panels.
- Parts: `card`, `content`, `description`, `title`
- A11y / attributes: Structure: header/title/description/content/footer parts.

### `carousel`
Slides you can swipe or step through with arrows and dots.
- When: Featured articles, image galleries.
- Parts: `dots`, `next`, `prev`, `slide`, `viewport`
- A11y / attributes: Scroll-snap viewport + prev/next/dots; Left/Right when focused; aria-roledescription; data-loop, data-autoplay pauses on hover/focus.

### `code-block` (CSS/markup only, no JS behaviour)
A code snippet or text with a Copy button that shows "Copied".
- When: Install commands, share links, API keys.
- Parts: `code-block`
- A11y / attributes: data-ui=clipboard copies data-text or target text; data-state=copied; ui:copy.

### `collapsible`
A single button that shows or hides one block of content.
- When: "Show more" lists, advanced options.
- Parts: `content`, `trigger`
- A11y / attributes: button[aria-expanded][aria-controls]; content[hidden]; data-default-open.

### `datatable`
A table with search, column sorting, row selection and pages.
- When: Admin lists: articles, users, orders.
- Parts: `empty`, `info`, `row`, `row-select`, `search`, `select-all`
- A11y / attributes: Enhances a server-rendered table: sort (aria-sort, Shift=multi), search, client paging, select-all tri-state, column visibility. data-remote emits ui:query.

### `dialog`
A popup window over the page. Focus stays inside until it's closed.
- When: Short forms or details without leaving the page.
- Parts: `close`, `content`, `description`, `title`, `trigger`
- A11y / attributes: Native dialog showModal (focus trap, inert page), Esc/backdrop close, focus returns to opener, aria-labelledby/-describedby, cancellable ui:beforeclose, form method=dialog.

### `drawer`
A panel that slides in from an edge of the screen.
- When: Filters, mobile navigation, quick edit forms.
- Parts: `close`, `content`, `handle`, `title`, `trigger`
- A11y / attributes: Dialog variant: data-ui=sheet|drawer + data-side=left|right|top|bottom. Drag the panel (or its data-ui-part=handle) toward its edge to dismiss, like vaul; data-drag=false turns that off. Esc, backdrop and the close button still work.

### `dropdown-menu`
A button that opens a list of actions, with sub-menus, checkmarks and shortcuts.
- When: "⋯" action menus, account menu.
- Parts: `content`, `item`, `label`, `radio-group`, `separator`, `sub`, `sub-content`, `sub-trigger`, `trigger`
- A11y / attributes: role=menu; Down/Up/Home/End, typeahead, Enter/Space; Right/Left for submenus; checkbox/radio items; Esc/outside/Tab close; focus returns; ui:select (cancel to keep open).

### `context-menu`
A menu that opens where you right-click, or with Shift+F10 on the keyboard.
- When: File managers, editors, table rows.
- Parts: `area`, `content`, `item`, `separator`
- A11y / attributes: Same menu core; opens at pointer on right-click, or Shift+F10 / ContextMenu key on the focused area.

### `empty` (CSS/markup only, no JS behaviour)
A friendly placeholder shown when a list has nothing in it, with a call to action.
- When: No search results, no articles yet.
- Parts: `empty-state`
- A11y / attributes: Structure: media/title/description/actions.

### `hover-card`
Hover over or focus a link and a small preview card pops up next to it.
- When: Previewing a user profile or link without clicking it.
- Parts: `content`, `fallback`, `trigger`
- A11y / attributes: Opens after hovering 300 ms or on keyboard focus; stays open while the pointer is over the card; Esc closes. The trigger stays a normal link.

### `item` (CSS/markup only, no JS behaviour)
One row of a list: icon, title, subtitle and actions on the right. Rows can be clickable and you can move between them with the arrow keys.
- When: Settings lists, notification lists, file lists.
- Parts: `actions`, `content`, `description`, `item`, `media`, `title`, `title-link`
- A11y / attributes: role=list / listitem. One Tab stop for the whole list; Up/Down/Home/End move between rows; Enter or click opens a clickable row (ui:activate); Right arrow goes into the row's controls, Left/Esc goes back to the row.

### `kbd` (CSS/markup only, no JS behaviour)
Shows a keyboard shortcut as key caps.
- When: Help text and menu shortcuts.
- A11y / attributes: Native kbd.

### `label` (CSS/markup only, no JS behaviour)
The text label linked to a form input. Clicking it focuses the input.
- When: Every form input.
- A11y / attributes: Native label[for]; Field wires it automatically.

### `link` (CSS/markup only, no JS behaviour)
A normal text link, with a style for the current page.
- When: Navigation inside text.
- A11y / attributes: Native a; aria-current=page for active.

### `popover`
A click-to-open floating panel that can hold any content, including form fields.
- When: Quick settings, filters, small forms next to a button.
- Parts: `close`, `content`, `trigger`
- A11y / attributes: Click trigger; role=dialog; Esc/outside close; [autofocus] gets focus; data-side/data-align; data-position=none to self-position.

### `progress`
A bar showing how much of a task is done, or an animated bar while waiting.
- When: Uploads, multi-step processes.
- Parts: `indicator`
- A11y / attributes: role=progressbar + aria-valuenow; no value = indeterminate; sets --ui-progress.

### `rating`
Pick 1 to 5 stars (or show a read-only score).
- When: Reviews, feedback.
- A11y / attributes: Native radios (arrow keys work), hover preview, data-readonly.

### `reparent`
Moves an element to a different place in the page at a breakpoint.
- When: Putting a toolbar into the header on mobile.
- Parts: `badge`
- A11y / attributes: Moves an element between containers by media query.

### `resizable`
Panels with a draggable divider between them.
- When: Editor + preview, sidebar + content.
- Parts: `handle`, `panel`
- A11y / attributes: role=separator; Left/Right (Shift=10%), Home/End, pointer drag; data-min; persist with data-storage-key.

### `scroll-area`
A fixed-height box whose content scrolls, with fade hints at the edges.
- When: Long tag lists, chat, logs.
- A11y / attributes: Native scroll; focusable region; data-scroll-top/bottom flags for edge shadows.

### `separator`
A horizontal or vertical line between content.
- When: Separating sections or menu groups.
- A11y / attributes: role=separator + aria-orientation; data-decorative = role none.

### `skeleton` (CSS/markup only, no JS behaviour)
Skeleton shapes preview the layout while content loads.
- When: Any slow-loading area.
- Parts: `card`, `skeleton`
- A11y / attributes: decorative skeleton shapes use `aria-hidden`; the loading region supplies its accessible status. Use the separate `spinner` component for activity indicators.

### `table` (CSS/markup only, no JS behaviour)
A simple styled table with caption and headers.
- When: Static tabular data. Use Data table for sorting/search.
- A11y / attributes: Native table with caption/thead/scope; behaviour in Data Table.

### `theme-switch`
Cycles between light, dark and following the system setting, and remembers the choice.
- When: Site header or user settings.
- A11y / attributes: Cycles light, dark, system; sets html data-theme + color-scheme; persisted; follows prefers-color-scheme.

### `toast` (CSS/markup only, no JS behaviour)
Small messages that pop up in the corner and disappear by themselves.
- When: "Saved", "Deleted (Undo)", background task results.
- A11y / attributes: Region + polite/assertive announcer; pause on hover/focus; action button; toast.promise(); max stack.

### `toggle`
A button that stays pressed or unpressed.
- When: Bold / italic in editors, pin / unpin.
- A11y / attributes: button[aria-pressed]; data-state=on|off.

### `tooltip`
A small text hint that appears when you hover over or focus something.
- When: Explaining icon-only buttons.
- Parts: `content`, `trigger`
- A11y / attributes: role=tooltip + aria-describedby; hover (500ms) and focus; Esc closes.

### `typography` (CSS/markup only, no JS behaviour)
Headings, paragraphs, quotes and inline code.
- When: Article content.
- A11y / attributes: Pure CSS concern.

### `message-scroller`
A chat log that sticks to the newest message, with a "new messages" jump button.
- When: Comments, support chat, AI chat.
- Parts: `bubble`, `jump`, `message`, `viewport`
- A11y / attributes: role=log; sticks to bottom unless user scrolled up; jump button.

### `direction` (CSS/markup only, no JS behaviour)
Layout for right-to-left languages, using the browser's dir attribute.
- When: Arabic / Hebrew content.
- Parts: `addon`, `close`, `input-group`
- A11y / attributes: Use the native dir=rtl attribute; layout mirrors automatically through CSS logical properties. Arrow-key mirroring inside RTL tabs and menus is planned.

### `spinner`
A spinning indicator that says something is loading, announced to screen readers.
- When: Inside a button while saving, or in place of content that is still loading.
- A11y / attributes: role=status + aria-live=polite with a visually hidden label (data-label, default 'Loading…'). Keeps turning, slower, with reduced motion or Animations off, because it reports status. api: start(), stop(), label.

## Navigation

### `breadcrumb` (CSS/markup only, no JS behaviour)
Shows where you are: Home › Articles › Edit.
- When: Top of deep pages.
- Parts: `breadcrumb`
- A11y / attributes: nav[aria-label=Breadcrumb] > ol; last item aria-current=page.

### `menu` (CSS/markup only, no JS behaviour)
A desktop-app style bar of menus (File, Edit, View).
- When: Editors, admin tools.
- Parts: `content`, `item`, `menu`, `separator`, `trigger`
- A11y / attributes: role=menubar; Left/Right between menus, Down opens; hovering moves between open menus.

### `navigation-menu`
Top navigation whose items open panels of links.
- When: Main site header.
- Parts: `content`, `list`, `menu`, `trigger`
- A11y / attributes: Disclosure pattern (not role=menu): links stay links; hover or click opens; Esc closes.

### `pagination`
Page number buttons with previous / next.
- When: Below lists and tables.
- A11y / attributes: Renders buttons (or links with data-href); aria-current=page; ellipsis; ui:change {page}.

### `scrollspy`
Highlights the menu link of the section currently on screen.
- When: Docs sidebars; this page's left menu uses it.
- A11y / attributes: IntersectionObserver; sets aria-current + data-state=active on links. This page's sidebar uses it.

### `scrollto`
A link that scrolls smoothly to a section and moves keyboard focus there.
- When: "Back to top", table of contents.
- A11y / attributes: Smooth scroll + moves focus to target (tabindex=-1), respects prefers-reduced-motion.

### `sidebar`
A side navigation that can collapse, and becomes a slide-out panel on mobile.
- When: Admin layouts; this page uses it.
- A11y / attributes: data-state=expanded|collapsed; mobile offcanvas below breakpoint; Ctrl/Cmd+B; persisted. This page's sidebar.

### `stepper`
A multi-step form with Back and Next. It can check each step before moving on.
- When: Sign-up, checkout, setup wizards.
- Parts: `finish`, `list`, `next`, `panel`, `prev`, `step`
- A11y / attributes: aria-current=step on the step; linear mode checks native validity; ui:beforechange cancellable; ui:finish.

### `sticky`
Stays at the top while scrolling and marks itself when stuck.
- When: Page headers, table headers.
- A11y / attributes: CSS does sticking; JS only flags data-state=stuck. The page header uses it.

### `tabs`
Switch between panels of content with a row of tabs.
- When: Settings sections, profile pages.
- Parts: `list`, `panel`, `trigger`
- A11y / attributes: role=tablist/tab/tabpanel; Left/Right/Home/End, automatic or manual activation (data-activation=manual), vertical orientation, disabled tabs.

### `command`
Type to search commands and pages. Opens with Ctrl/⌘+K.
- When: Power-user navigation and admin search.
- Parts: `content`, `empty`, `group`, `input`, `label`, `list`, `option`, `separator`, `trigger`
- A11y / attributes: Combobox + listbox; filter with keywords; Up/Down/Enter; data-hotkey=k opens the parent dialog with Ctrl/Cmd+K.

## Forms

### `input` (CSS/markup only, no JS behaviour)
A text field in normal, disabled and invalid states.
- When: Any free-text value.
- A11y / attributes: Native input; Field wires label/description/error.

### `input-group` (CSS/markup only, no JS behaviour)
A text field with fixed text or icons attached on the left or right.
- When: URLs, prices, search boxes.
- Parts: `addon`, `input-group`
- A11y / attributes: Structure: addon parts around an input.

### `field`
Groups a label, input, help text and error message, and links them for screen readers.
- When: Every form field, server or browser validation.
- Parts: `control`, `description`, `error`, `label`
- A11y / attributes: Generates ids; wires label for, aria-describedby, aria-invalid; shows error on native invalid or server data-invalid.

### `checkbox`
A tick box, including a "partly selected" state and a select-all box.
- When: Agreeing to terms, picking several options.
- A11y / attributes: Native or button[role=checkbox]; tri-state mixed; select-all via data-controls.

### `radio-group`
Pick exactly one option from a short list.
- When: Choosing one of 2–5 options.
- Parts: `item`
- A11y / attributes: role=radiogroup; roving focus, arrows select; native radios also enhanced.

### `switch`
An on/off switch that takes effect immediately.
- When: Settings like notifications on/off.
- A11y / attributes: button[role=switch][aria-checked] or native checkbox; Space toggles.

### `select`
Pick one or several options from a styled dropdown list.
- When: Choosing from a fixed list (language, category).
- Parts: `content`, `group`, `label`, `option`, `trigger`, `value`
- A11y / attributes: Listbox popup; typeahead; groups; data-multiple; hidden input posts normally. native select = native-select.

### `combobox`
Type to filter options. It can pick several as chips and accept custom values.
- When: Long lists: cities, tags, users.
- Parts: `chips`, `content`, `empty`, `input`, `option`, `trigger`
- A11y / attributes: input[role=combobox] + listbox; filter, aria-activedescendant; chips in multiple; data-allow-custom; remote via ui:search.

### `slider`
Drag a handle to choose a number or a min–max range.
- When: Volume, price range filters.
- Parts: `range`, `thumb`, `track`
- A11y / attributes: role=slider per thumb; arrows, PageUp/Down, Home/End; range; vertical; hidden inputs.

### `pin-input`
Separate boxes for each digit of a code. Pasting a code fills all the boxes.
- When: SMS / email verification codes, PINs.
- A11y / attributes: Auto-advance, Backspace back, paste fills, numeric filter, autocomplete=one-time-code; ui:complete.

### `toggle-password`
A password field with an eye button to reveal it.
- When: Login and sign-up forms.
- Parts: `input`, `toggle`
- A11y / attributes: Switches type and aria-pressed/label.

### `textarea`
A text area that grows as you type and counts characters.
- When: Comments, descriptions.
- A11y / attributes: data-autosize grows with content; data-count char count.

### `file-input`
Drop files or browse. It lists the chosen files with remove buttons and checks sizes.
- When: Attachments, imports.
- Parts: `dropzone`, `input`, `list`
- A11y / attributes: Native input stays the source; dropzone, list with remove, data-max-size.

### `image-input`
Choose an image, see a preview, change or remove it.
- When: Avatars, cover images.
- Parts: `change`, `input`, `preview`, `remove`, `removed`
- A11y / attributes: Preview, change, remove (hidden removed flag for server).

### `repeater`
Add or remove rows of fields. Names are renumbered so the server gets a clean list.
- When: Order lines, phone numbers, links.
- Parts: `add`, `list`, `remove`, `row`, `template`
- A11y / attributes: Template rows; renumbers name=items[i].x for Spring binding; min/max.

### `color-picker`
Choose a colour from the system picker, a hex code or preset swatches.
- When: Theme / brand colour settings.
- Parts: `input`, `swatch`, `text`
- A11y / attributes: Native color input + text field + swatches.

### `sortable`
Reorder items by dragging, or with Space and the arrow keys.
- When: Menu order, priority lists.
- Parts: `item`
- A11y / attributes: Pointer drag + keyboard (Space lift, arrows move, Space drop) with live announcements.

### `toggle-group`
A row of toggle buttons; one or several can be on.
- When: Text alignment, formatting toolbars.
- Parts: `item`
- A11y / attributes: single (radio-like) or multiple; roving focus.

### `calendar`
A month grid to pick a date, a range or several dates. Georgian locale.
- When: Booking ranges, schedules.
- A11y / attributes: ARIA grid; arrows/PageUp/PageDown/Home/End; single/range/multiple; min/max; Intl locale ka.

### `date-picker`
A date input with a calendar popup.
- When: Publish date, birthday.
- Parts: `content`, `input`, `trigger`
- A11y / attributes: Input + popover calendar; typing parses ISO; posts ISO value.

## Conversation

### `bubble`
One message balloon in a conversation, with optional reactions and a show-more toggle.
- When: Chat UIs, comments, AI replies. Group consecutive bubbles from the same sender.
- Parts: `bubble-group`, `content`, `count`, `reaction`, `reactions`, `toggle`
- A11y / attributes: Reactions are toggle buttons (aria-pressed) whose count updates; long bubbles get a Show more / Show less button with aria-expanded/aria-controls. ui:react {value,on}.

### `message`
A whole turn in a conversation: avatar, name/time, the bubble and copy/like/retry actions.
- When: Any chat or AI assistant thread; wrap a list of them in a Message scroller.
- Parts: `action`, `actions`, `avatar`, `body`, `content`, `fallback`, `header`, `icon`
- A11y / attributes: Each message is role=article. Actions are buttons: copy (copies the content), like/dislike (exclusive toggles, aria-pressed), retry emits ui:action {action}.

### `marker`
A small inline line in a conversation: a system note, a status, a bordered row or a labelled divider.
- When: "Explored 4 files", "Yesterday" separators, "Thinking…" while streaming.
- Parts: `content`, `icon`
- A11y / attributes: Icons are aria-hidden. Variant separator gets role=separator with the label as its name; data-live makes it a polite status (for 'Thinking…').

### `trace`
A compact list of the steps something took (searches, commands, files), each expandable for detail.
- When: The building block for AI reasoning, tool calls and sources; also build/deploy logs.
- Parts: `content`, `icon`, `line`, `title`, `trigger`
- A11y / attributes: The trace is a list; each line a listitem. Lines that have details use a nested Collapsible (button + aria-expanded). Running lines shimmer.

### `attachment`
A file chip showing name, type/size, upload progress or an error, with a remove button.
- When: Files attached to a message, form or prompt input.
- Parts: `action`, `actions`, `content`, `description`, `icon`, `media`, `progress`, `title`
- A11y / attributes: role=group labelled by the file name. Upload progress is a progressbar driven by data-progress; data-error shows the error state. Remove is a labelled button; ui:remove is cancelable and focus moves to the next attachment.

### `questionnaire`
Asks one question at a time (single choice, multiple choice or free text) with Back/Skip/Next and a progress bar.
- When: Onboarding, surveys, or an AI asking clarifying questions before it starts.
- Parts: `actions`, `choice`, `choices`, `description`, `error`, `input`, `item`, `label`, `next`, `previous`, `progress`, `skip`, `submit`, `summary`, `title`
- A11y / attributes: One question at a time. Single choice is a radiogroup (arrows move + select), multiple is a group of checkboxes, freeform is a textarea. Required questions show an inline error (aria-invalid + aria-describedby). Progress is a progressbar ('Question 2 of 3'). ui:step, ui:submit {answers}.

### `native-select` (CSS/markup only, no JS behaviour)
The browser's own select box, styled to match the theme.
- When: Simple choices in forms, especially on mobile; use Select when you need search, groups or custom rendering.
- A11y / attributes: A real <select>: the browser handles keyboard, mobile pickers and forms. Only styling is added (chevron via CSS mask).

### `chart`
Turns a data table into a simple bar or line chart, keeping the table for accessibility.
- When: Dashboards and reports. For heavy charting, wrap a chart library but keep the table fallback.
- A11y / attributes: Charts are drawn from a real <table> (kept in the page; 'Show data table' reveals it), so screen readers get the numbers. The SVG is role=img with a summary label; each bar/point has a <title> tooltip. Colours come from --ui-chart-1..5.

## AI Elements

### `chain-of-thought`
A collapsible summary that expands into the steps an AI agent took.
- When: Show how an answer was reached without cluttering the reply.
- Parts: `chevron`, `content`, `icon`, `label`, `status`, `step`, `steps`, `trigger`
- A11y / attributes: A disclosure (button aria-expanded → region) holding the steps; the running step has aria-current=step; status text is a polite live region.

### `chat` (CSS/markup only, no JS behaviour)
A working chat: scrolling thread, suggestion chips and a message box with attachments.
- When: Building an assistant or support chat; compose your own from these parts.
- Parts: `attach`, `attachments`, `content`, `file`, `icon`, `input`, `item`, `jump`, `submit`, `toolbar`, `viewport`
- A11y / attributes: Composition: Message scroller (role=log, sticks to bottom, jump button) + Messages + Prompt input + Suggestions. Type and press Enter; a fake reply streams in.

### `checkpoint`
A marker in a conversation you can go back to, with a Restore button.
- When: Undo points in AI editing sessions.
- Parts: `icon`, `label`, `restore`
- A11y / attributes: role=separator with a labelled Restore button; ui:restore {id} is cancelable; data-state=restored afterwards.

### `confirmation`
Asks the user to approve or reject an action before it runs.
- When: Before an AI agent runs a risky tool (delete, send, pay).
- Parts: `actions`, `approve`, `description`, `reject`, `result`, `title`
- A11y / attributes: role=group labelled by its title. Approve / Reject are buttons; the decision replaces them with a status message. ui:approve / ui:reject are cancelable.

### `context`
Shows how much of the model's context window the conversation has used.
- When: AI chats with long sessions, so users know when to start fresh.
- Parts: `bar`, `content`, `meter`, `percent`, `trigger`
- A11y / attributes: role=meter (aria-valuenow/max, valuetext '62% of context used (124k of 200k tokens)'); data-level ok|warning|critical; details in a hover card.

### `file-tree`
A folder tree of files (for example the files an agent changed); keyboard navigable.
- When: Code changes, document browsers, project explorers.
- Parts: `file`, `folder`, `group`, `label`
- A11y / attributes: WAI-ARIA tree: role=tree/treeitem/group, aria-expanded, aria-level, aria-selected; ↑/↓ move, → opens / goes in, ← closes / goes up, Home/End, Enter selects. ui:select {path}.

### `inline-citation` (CSS/markup only, no JS behaviour)
A numbered source inside a sentence that previews the source on hover.
- When: AI answers or articles that cite sources.
- Parts: `citation`, `content`, `trigger`
- A11y / attributes: Composition: a Hover card whose trigger is a numbered citation link; opens on hover and focus, Esc closes.

### `ai-message` (CSS/markup only, no JS behaviour)
One full AI turn: the question, the agent's thinking and tool call, and the answer with actions.
- When: Reference for laying out assistant replies.
- Parts: `action`, `actions`, `body`, `chevron`, `content`, `icon`, `input`, `label`, `output`, `status`, `trigger`
- A11y / attributes: Composition: user Message + assistant Message whose body holds a Reasoning block, a Tool block, the answer bubble and actions.

### `model-selector` (CSS/markup only, no JS behaviour)
Two dropdowns: which AI model to use and how hard it should think.
- When: Assistants that offer several models or effort levels.
- Parts: `content`, `group`, `label`, `option`, `trigger`, `value`
- A11y / attributes: Composition: two Selects (listbox pattern): one for the model, one for reasoning effort.

### `plan`
The steps an agent plans to take, with how many are done.
- When: Multi-step agent work the user should follow.
- Parts: `chevron`, `content`, `label`, `progress`, `status`, `step`, `steps`, `trigger`
- A11y / attributes: Disclosure + ordered steps with data-status; the progress part shows 'n of m' and drives --ui-value; the running step has aria-current=step.

### `prompt-input`
A growing text box with attach and send buttons; Enter sends, and Send turns into Stop while answering.
- When: The input of any chat or AI assistant.
- Parts: `attach`, `attachments`, `file`, `icon`, `input`, `submit`, `toolbar`
- A11y / attributes: A form: auto-growing textarea (Enter sends, Shift+Enter new line), attach button opens a file picker and adds Attachment chips, Send is disabled while empty and becomes Stop (ui:stop) while data-status=streaming. ui:submit {text, files} is cancelable.

### `queue`
A checklist split into what is left and what is done.
- When: An agent's todo list, or any lightweight task list.
- Parts: `completed`, `completed-count`, `item`, `pending`, `pending-count`
- A11y / attributes: Todo list split into To do / Done; each item is a real checkbox, checking moves it between lists and keeps focus. Counts update. ui:change {id, done}.

### `reasoning`
Shows the AI's thinking while it streams, then folds away as 'Thought for Ns'.
- When: Reasoning models; keeps the reply clean while staying transparent.
- Parts: `chevron`, `content`, `icon`, `label`, `status`, `trigger`
- A11y / attributes: Opens automatically while data-status=streaming (the label shimmers), then closes and reads 'Thought for Ns'. The user can always toggle it.

### `sources`
A collapsible "Used N sources" list of links.
- When: Under an AI answer that used web or document sources.
- Parts: `chevron`, `content`, `count`, `icon`, `label`, `source`, `status`, `trigger`
- A11y / attributes: Disclosure 'Used N sources' (N counted from the links) revealing a list of links.

### `stack-trace`
A failed call's error message that expands into its stack frames, with copy.
- When: Showing tool or build failures.
- Parts: `chevron`, `content`, `copy`, `icon`, `label`, `output`, `status`, `trigger`
- A11y / attributes: Disclosure with the error message as its label; frames in a <pre>; Copy button copies them.

### `subagent`
A collapsible block for work handed to a helper agent: its steps and its result.
- When: Multi-agent systems.
- Parts: `chevron`, `content`, `icon`, `label`, `line`, `status`, `title`, `trigger`
- A11y / attributes: Disclosure for a delegated run: name, status, a nested Trace of its tool calls and its result.

### `suggestion`
Short ready-made prompts the user can send in one click.
- When: Empty chats and follow-up ideas.
- Parts: `item`
- A11y / attributes: A labelled group of buttons; clicking fills the linked Prompt input (data-target) or sends it (data-submit). ui:suggest {text} is cancelable.

### `task`
The steps an agent takes, appearing as it takes them.
- When: Searches, file reads and other background work.
- Parts: `chevron`, `content`, `icon`, `label`, `progress`, `status`, `step`, `steps`, `trigger`
- A11y / attributes: Disclosure listing steps as they happen, with file chips; progress 'n of m'.

### `terminal`
A command and its streaming output, like a small terminal.
- When: When an agent or build runs shell commands.
- Parts: `chevron`, `content`, `copy`, `icon`, `label`, `output`, `status`, `trigger`
- A11y / attributes: Disclosure with a command; output is role=log (polite) and focusable for scrolling; it sticks to the bottom while streaming. api.write(text). Copy button.

### `test-results`
A test run with pass/fail counts and suites you can expand.
- When: CI output, agent test runs.
- Parts: `chevron`, `content`, `label`, `status`, `suite`, `summary`, `test`, `trigger`
- A11y / attributes: Summary computed from the tests ('5 passed · 1 failed'), status error when anything failed; suites are nested disclosures marked passed/failed.

### `tool`
One tool call from input to output, with a pending/running/completed/error badge.
- When: Any agent that calls tools or APIs.
- Parts: `chevron`, `content`, `icon`, `input`, `label`, `output`, `status`, `trigger`
- A11y / attributes: Disclosure: tool name + status badge (pending, running, completed, error) as a polite live region; input and output sections.

## Blocks (copy-paste compositions)

- `sidebar-01`: A simple sidebar with navigation grouped by section.
- `sidebar-02`: A sidebar whose sections fold open and closed.
- `sidebar-03`: A sidebar with always-visible submenus.
- `sidebar-04`: A floating (detached, rounded) sidebar with submenus.
- `sidebar-05`: Each top-level item folds open to show its submenu.
- `sidebar-06`: Top-level items open their submenu as a dropdown to the side.
- `sidebar-07`: Collapses to a narrow icon rail (Ctrl/Cmd+B on the real app); hover icons for tooltips.
- `sidebar-08`: The content sits in an inset card; extra links are pinned at the bottom.
- `sidebar-09`: An icon rail next to a second, collapsible list sidebar (mail-style).
- `sidebar-10`: A sidebar whose workspace switcher and page actions open in popovers.
- `sidebar-11`: A sidebar with a changes list and a keyboard-navigable file tree.
- `sidebar-12`: A sidebar holding a date picker calendar and calendar lists.
- `sidebar-13`: A settings dialog with its own sidebar navigation.
- `sidebar-14`: The same sidebar docked on the right side.
- `sidebar-15`: Navigation on the left and a calendar/details sidebar on the right.
- `sidebar-16`: A full-width sticky header above the sidebar and content.
- `login-01`: A simple centered login card: email, password, remember me, Google, plus magic-link, forgot-password and code-verification steps.
- `login-02`: A two column login page: the form on one side, a cover image on the other.
- `login-03`: A login card on a muted page with Apple and Google first, then email.
- `login-04`: A wide card split into the login form and an image.
- `login-05`: An email-only login: enter your email, get a link (or code); social buttons below.
- `signup-01`: A simple signup card: name, email, password + confirm, terms, then email verification code.
- `signup-02`: A two column signup page with a cover image.
- `signup-03`: A signup card on a muted page.
- `signup-04`: A wide card split into the signup form and an image.
- `signup-05`: A signup page that leads with Apple, Google and GitHub, then email.

## Motion presets

- `motion`: Named animations any element or component part can use when it appears or disappears.
- `motion-states`: Ready-made effects for hover, keyboard focus and continuous loops (spinners, pulses, shimmer).
- `motion-play`: Play an attention animation once from JavaScript, e.g. shake a form when input is wrong.
- `motion-wired`: Dialogs, sheets, menus, tooltips, toasts, tabs and accordions animate through the library by default.
- `theme-tokens`: The colours, corner radius and shadows every component uses. Change them to restyle everything.
- `theme-scoped`: Restyle just one area of a page by setting tokens on a container.

## Other registered behaviours

`toolbar`, `segmented-control`, `checkbox-cards`, `radio-cards`, `checkbox-group`, `tab-nav`, `accessible-icon`, `sheet`, `menubar`, `input-otp`, `dismiss`, `toaster`, `data-table`, `scrollable`, `clipboard`, `item-group`, `auth-form`
