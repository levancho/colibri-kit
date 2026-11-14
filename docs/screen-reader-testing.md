# Screen-reader testing

Colibri UI has automated checks (axe-core over the gallery and blocks in light and dark, jsdom and Chrome keyboard
tests), but **no screen reader has been run against it yet**. This is the manual script for that pass. Work through
it once per screen-reader and browser pair, write the result in the table at the end, and file an issue for every
"heard" that differs from "expected".

Automated tools cannot tell you whether a name makes sense, whether a change is announced once (not twice, not
never), or whether focus lands where a person expects. That is what this pass is for.

## Setup

1. `npm run build`, then `npm run serve` and open `http://localhost:8395/site/dist/kitchen-sink/examples/kitchen-sink.html`
   (or use the published gallery). Every component below has a demo there: use the gallery's search box or the
   sidebar to jump to it, then press Tab until focus enters the demo.
2. Turn the speech rate down until you can hear every word. Turn on the speech viewer if your screen reader has one
   (NVDA: NVDA menu → Tools → Speech Viewer; VoiceOver: caption panel, VO-F10 → Caption panel; JAWS: Settings Center
   → Speech History, Insert+Space then H). Copy what you hear into the results table.
3. Test in the default page language (English) and once with a `dir="rtl"` page for tabs, menus, radio group,
   toolbar and slider (`<html dir="rtl">` in the browser's dev tools).
4. Reset between tests: reload the page so no toast, open layer or stored state carries over.

## Pairs to test

| Screen reader | Platform | Browser | Start / stop | Modifier ("SR" below) |
|---|---|---|---|---|
| VoiceOver | macOS 14+ | Safari (primary), Chrome | Cmd+F5 | VO = Control+Option |
| VoiceOver | iOS 17+ | Safari | Settings → Accessibility → VoiceOver, or triple-click side button | gestures |
| NVDA 2024+ | Windows 10/11 | Firefox (primary), Chrome | Control+Alt+N / Insert+Q | NVDA = Insert (or Caps Lock) |
| JAWS 2024+ | Windows 10/11 | Chrome | from Start / Insert+F4 | JAWS = Insert |
| TalkBack 14+ | Android 13+ | Chrome | hold both volume keys 3 s | gestures |

Key words used below:

- **Tab / Shift+Tab** move between focusable controls in every pair. On desktop screen readers keep browse mode
  (virtual cursor) on for reading and let the screen reader switch to focus/forms mode when it enters a widget; note
  if it does not. NVDA: Insert+Space toggles the mode; JAWS: Enter or Insert+Z; VoiceOver has no mode switch (use
  VO+Shift+Down to interact with a group when needed).
- **Mobile**: swipe right/left = next/previous item; double-tap = activate; two-finger swipe down (iOS) or
  swipe down-then-right/"read from next item" (TalkBack) = read all. Swipe up/down with one finger on iOS adjusts
  a slider after you set the rotor to "Adjust value"; on TalkBack swipe up/down on a focused slider (or use volume
  keys).
- **Expected** lists the role, name and state that must be spoken. Wording varies by product ("collapsed" vs "not
  expanded"); that is fine as long as the same information is there. Order does not matter.

## Components

Each section: what to press, then what the person must hear. "Esc" on mobile is the two-finger scrub (iOS) or the
back gesture (TalkBack).

### 1. Dialog (modal)

Demo: "Dialog / Modal" ("Edit profile").

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the trigger | "Edit profile, button" |
| 2 | Enter / Space (mobile: double-tap) | "Profile, dialog" followed by the description "Update your details."; focus is on the first field or control inside, which is also spoken with its label |
| 3 | Tab repeatedly | focus cycles inside the dialog only; it never reaches the page behind |
| 4 | Browse mode: arrow down past the last control (NVDA/JAWS), or VO+Right to the end | the page behind is not read (it is inert); you reach the end of the dialog |
| 5 | Esc | dialog closes; focus is back on "Edit profile, button" and that is spoken |
| 6 | Reopen, activate the Close / Cancel button | same as step 5 |
| Mobile | swipe right through the dialog | only dialog content is reachable; after the last item VoiceOver/TalkBack does not move into the page |

### 2. Alert dialog (confirmation)

Demo: "Alert Dialog".

| Step | Do | Expected |
|---|---|---|
| 1 | Activate the trigger | "…, alert dialog" (VoiceOver: "alert" or "web dialog"), the title and the description are read automatically without moving the cursor |
| 2 | Note where focus is | on the least destructive action (Cancel), spoken as "Cancel, button" |
| 3 | Press Esc three times quickly | the dialog stays open each time (a confirmation must be answered) |
| 4 | Activate Cancel | closes; focus returns to the trigger and the trigger is spoken |
| 5 | Reopen, activate the confirm action | closes; focus returns to the trigger |

### 3. Menu (dropdown menu)

Demo: "Dropdown Menu".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the trigger | "Actions, menu button, collapsed" (NVDA/JAWS: "button, submenu" or "has popup menu") (VoiceOver: "pop-up button") |
| 2 | Enter, Space or Down arrow | "expanded", then the first item: "Profile, menu item, 1 of N" |
| 3 | Down / Up | next / previous item with its position; wraps at the ends; disabled items are spoken as "dimmed"/"unavailable" but skipped by the arrows |
| 4 | Home / End | first / last item |
| 5 | Type the first letter of an item | focus jumps to it |
| 6 | On a checkbox or radio item | "…, checkbox menu item, checked" / "radio menu item, selected"; Space or Enter toggles and the new state is spoken |
| 7 | On a submenu item | "More, menu item, submenu" (or "has popup"); Right opens it and speaks its first item; Left (in rtl: Right) or Esc closes only the submenu and returns to "More" |
| 8 | Esc on the top level | menu closes, "Actions, menu button, collapsed" (NVDA/JAWS: "button, submenu" or "has popup menu") is spoken, focus is on the trigger |
| 9 | Enter on an ordinary item | the action happens, the menu closes, focus returns to the trigger |
| Mobile | double-tap the trigger, swipe right through items | items are announced as menu items; double-tap activates; the menu closes afterwards |

### 4. Menubar

Demo: "Menubar".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab into the bar | one stop only: "File, menu item, submenu" ("App, menu bar" on entry) |
| 2 | Right / Left | moves between File, Edit, View… without opening them (in rtl: Left is next) |
| 3 | Home / End | first / last top-level item |
| 4 | Down or Enter | the menu opens and its first item is spoken |
| 5 | In an open menu: Right / Left | closes this menu and opens the next / previous top-level menu, speaking its first item |
| 6 | Esc | menu closes, focus and speech return to the top-level item |
| 7 | Tab | leaves the menubar entirely (one tab stop) |

### 5. Tabs

Demo: "Tabs".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab into the tab list | "Account, tab, selected, 1 of 3" (role tab list announced on entry) |
| 2 | Right / Left (rtl: reversed) | next / previous tab is focused **and** selected (automatic activation): "Password, tab, selected, 2 of 3" |
| 3 | Home / End | first / last tab |
| 4 | Tab | focus moves into the active panel (or its first control); the panel is announced as "Password, tab panel" or its content |
| 5 | Disabled tab | spoken as "dimmed"/"unavailable"; arrows skip it |
| 6 | Manual activation demo (if present) | arrows only move focus; Enter/Space selects |

### 6. Select (listbox popup)

Demo: "Select" ("Choose a language").

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to it | "combo box / pop-up button, Choose a language, collapsed" with its label if the page gives one (note an unnamed select as a failure) |
| 2 | Down, Enter or Space | "expanded"; the current or first option is spoken: "English, 1 of N" |
| 3 | Down / Up / Home / End | each option is spoken with its position; focus stays on the trigger (active descendant) and the screen reader follows the highlighted option |
| 4 | Type letters | jumps to the matching option |
| 5 | Enter | "collapsed" and the new value: "Language, French" |
| 6 | Esc while open | closes without changing the value |
| Mobile | double-tap, swipe through options, double-tap one | the chosen value is spoken on the collapsed control |

### 7. Combobox (autocomplete)

Demo: "Combobox".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the input | "City, combo box, editable, autocomplete list, collapsed" |
| 2 | Type "par" | suggestions open ("expanded"); the screen reader may announce the number of results; the input keeps focus and what you typed is echoed |
| 3 | Down / Up | each suggestion is spoken ("Paris, 1 of 3") while focus stays in the input |
| 4 | Enter | the value is filled in, "collapsed", the input reads "Paris" |
| 5 | Esc | closes the list (second Esc may clear, depending on the demo) |
| 6 | Type text that matches nothing | an empty-state message, if shown, is spoken or reachable; nothing stale is announced |

### 8. Popover

Demo: "Popover".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the trigger | "…, button, collapsed" (may add "has popup dialog") |
| 2 | Enter | "expanded"; focus moves inside: "Dimensions, dialog" (named by its title or trigger), then the first control |
| 3 | Tab through | controls inside are spoken with their labels |
| 4 | Esc | closes; focus returns to the trigger; "collapsed" |
| 5 | Click/tap outside | closes; focus is not lost to the top of the page |

### 9. Tooltip

Demo: "Tooltip".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the trigger | its name, then (after the delay or immediately, depending on the reader) the tooltip text as a description: "Info, button, A longer tooltip text" |
| 2 | Esc | the tooltip hides, focus stays on the trigger; nothing else happens |
| 3 | Mouse: hover the trigger, then move onto the tooltip | it stays open while hovered (not part of speech, but check with a magnifier) |
| Mobile | swipe to the trigger | the tooltip text is read as the hint/description (VoiceOver reads hints after a pause) |

### 10. Date picker

Demo: "Date Picker".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the input | "Date, edit text" with its value |
| 2 | Tab to the calendar button | "Choose date, button, collapsed" (may add "has popup dialog") |
| 3 | Enter | "expanded"; a dialog named "Choose date…"; focus on the selected (or today's) day, spoken as the full date: "Wednesday, 14 October 2026, selected" (today adds "current date") |
| 4 | Left / Right | previous / next day, full date spoken (rtl: reversed) |
| 5 | Up / Down | same weekday, previous / next week |
| 6 | Page Up / Page Down | previous / next month; the month heading ("October 2026") is announced once via its live region |
| 7 | Home / End | start / end of the week |
| 8 | A disabled or out-of-range day | spoken as "dimmed"/"unavailable"; Enter does nothing |
| 9 | Enter on a day | the dialog closes, focus returns to the button (or input), the input now reads the date |
| 10 | Type an out-of-range date in the input and Tab away | the input is reported as "invalid entry" when you return to it |
| Mobile | double-tap the button, swipe through days | each day reads as a full date; double-tap selects |

### 11. Toast

Demo: "Toast / Sonner" (press a demo button that shows a toast).

| Step | Do | Expected |
|---|---|---|
| 1 | Activate "Show toast" | the toast's title and description are spoken **once**, politely (after the current utterance), without focus moving |
| 2 | Show two toasts quickly | each is spoken once, in order; none twice |
| 3 | Press F6 / use the landmarks list (NVDA: D, JAWS: R, VO: rotor → Landmarks) | a "Notifications" region is listed; inside it the toasts are a list ("list, 2 items") |
| 4 | Tab into a toast with an action | "Undo, button", then "Close, button" |
| 5 | Error toast (if the demo has one) | spoken assertively (interrupts) |
| Mobile | trigger a toast | it is announced without moving the VoiceOver/TalkBack cursor |

### 12. Accordion

Demo: "Accordion".

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the first header | "What is Despani?, button, collapsed" (inside a heading: "heading level 3"); the open item says "expanded" |
| 2 | Enter / Space | "expanded"; the panel content follows in reading order and is reachable with the arrow keys / next swipe |
| 3 | Down / Up / Home / End on a header | focus moves between the headers; the disabled item is spoken as "dimmed"/"unavailable" |
| 4 | Browse mode: H to jump between headings | each item's heading is spoken, so the list is navigable by headings |
| 5 | Single-open demo: open another item | the first one reports "collapsed" when you return to it |
| 6 | Panel region | the panel is a region named after its header ("What is Despani?, region") |

### 13. Slider

Demo: "Slider" (also the range slider with two thumbs).

| Step | Do | Expected |
|---|---|---|
| 1 | Tab to the thumb | "Volume, slider, 20" (with a value text if set: "20 percent"); orientation horizontal |
| 2 | Right / Up | +1 step, new value spoken each press (rtl: Left increases) |
| 3 | Left / Down | −1 step |
| 4 | Page Up / Page Down | ±10% of the range |
| 5 | Home / End | minimum / maximum |
| 6 | Range slider: Tab | second thumb "Max, slider, 80"; the first thumb cannot pass the second |
| Mobile (iOS) | swipe to the thumb, swipe up / down | value goes up / down by one step and is spoken |
| Mobile (TalkBack) | focus the thumb, swipe up / down (or volume keys) | same |

### 14. Data table

Demo: "Data Table / Datatable".

| Step | Do | Expected |
|---|---|---|
| 1 | Browse mode: T (NVDA/JAWS) or VO+Command+T | "table with N rows and M columns", caption if present |
| 2 | Table navigation: Control+Alt+arrows (NVDA/JAWS), VO+arrows (macOS) | each cell is read with its column header when the column changes, and the row header when the row changes |
| 3 | Tab to a sortable header | "Name, button" inside a column header; column header reports "sorted ascending/descending" or nothing when unsorted |
| 4 | Enter on the header | rows reorder; the header now reports "sorted ascending"; Enter again: "descending" |
| 5 | Type in the search box | the visible rows change; the result count ("1–5 / 12") is reachable after the table; focus stays in the search box |
| 6 | Row selection checkboxes | "Row 1, checkbox, not checked"; Space checks it; "select all" reports "half checked"/"mixed" when some are selected |
| 7 | Pagination below | a "Pagination" navigation landmark; the current page is "2, current page, button"; Previous on page 1 is "dimmed" |

### 15. Carousel

Demo: "Carousel".

| Step | Do | Expected |
|---|---|---|
| 1 | Reach the carousel | "Featured, carousel" (region with role description), each slide "1 / 5, slide" (group) |
| 2 | Autoplay demo | autoplay pauses as soon as focus enters; the slide text is **not** re-announced on every automatic change; a "Stop slide rotation, button" is the first control |
| 3 | Activate Stop / Start | the label flips to "Start slide rotation"; rotation stops |
| 4 | Tab to Next / Previous | "Next slide, button" / "Previous slide, button"; activating moves one slide and the new slide is announced once (politely) when autoplay is off |
| 5 | Focus the viewport, Right / Left | moves slides (rtl: reversed); arrows typed into a field inside a slide stay in the field |
| 6 | Dots | "Go to slide 3, button"; the current one reports "current" or "selected" if the demo marks it |
| Mobile | swipe through | each slide is a group with its position; swiping does not jump to hidden slides |

## Wider checks (once per pair)

- **Landmarks and headings**: the gallery and a block page have one `main`, named navigation regions, and a
  logical heading order (rotor / Insert+F6 / NVDA+F7).
- **Names**: no control is spoken as just "button" or "edit text" with no name. Icon-only buttons have names.
- **Live regions**: message scroller (chat log): a new message is read once; the viewport can be focused (Tab) and
  scrolled with the arrow keys.
- **Forms**: invalid fields say "invalid entry" and their error text is read as a description.
- **Reduced motion / high contrast**: with Windows High Contrast on, focus is still visible on every control
  above (checked in Chrome automatically, confirm by eye in Edge).

## Results

Copy this table per pair (for example "NVDA 2024.4 + Firefox 132, Windows 11"). Mark each row Pass, Fail (with
the words actually heard) or Not run.

| # | Component | VO macOS + Safari | VO iOS + Safari | NVDA + Firefox | NVDA + Chrome | JAWS + Chrome | TalkBack + Chrome |
|---|---|---|---|---|---|---|---|
| 1 | Dialog | | | | | | |
| 2 | Alert dialog | | | | | | |
| 3 | Menu | | | | | | |
| 4 | Menubar | | | | | | |
| 5 | Tabs | | | | | | |
| 6 | Select | | | | | | |
| 7 | Combobox | | | | | | |
| 8 | Popover | | | | | | |
| 9 | Tooltip | | | | | | |
| 10 | Date picker | | | | | | |
| 11 | Toast | | | | | | |
| 12 | Accordion | | | | | | |
| 13 | Slider | | | | | | |
| 14 | Data table | | | | | | |
| 15 | Carousel | | | | | | |

When every row passes in at least VoiceOver + Safari, NVDA + Firefox and TalkBack + Chrome, tick
"Screen-reader testing has never been done" in `TODO.md` and the homepage can say "screen-reader support" again.
