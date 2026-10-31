// Colibri UI: auto-initialise every [data-ui] element on the page (FreeMarker / plain HTML / HTMX).
// React apps should NOT use this; they call createX(ref.current) themselves.
import { createTabs } from "./tabs.js";
import { createButtonGroup, createSpinner } from "./button-group.js";
import { initMotion } from "./motion.js";
import { createDialog } from "./dialog.js";
import { createCollapsible, createAccordion } from "./collapsible.js";
import { createToggle, createToggleGroup } from "./toggle.js";
import { createCheckbox, createSwitch, createRadioGroup } from "./checkbox.js";
import { createPopover, createTooltip, createHoverCard } from "./popover.js";
import { createDropdownMenu, createContextMenu, createMenubar, createNavigationMenu } from "./menu.js";
import { createSelect, createCombobox, createCommand } from "./listbox.js";
import { createField, createSlider, createPinInput, createTogglePassword, createFileInput, createImageInput, createRepeater, createRating, createTextarea, createColorPicker, createSortable } from "./forms.js";
import { createCalendar, createDatePicker } from "./calendar.js";
import { createPagination, createStepper, createScrollspy, createScrollTo, createSticky, createSidebar } from "./navigation.js";
import * as AI from "./ai.js";
import { createAuthForm } from "./blocks.js";
import { createClothline, createCell } from "./clothline.js";
import { createDismiss, createToaster, createProgress, createCarousel, createAvatar, createThemeSwitch, createDataTable, createResizable, createReparent, createScrollArea, createMessageScroller, createClipboard, createButton, createSeparator, createItemGroup, createBadge } from "./base.js";

export const registry = {
  tabs: createTabs, dialog: createDialog, "alert-dialog": createDialog, sheet: AI.withDragDismiss(createDialog), drawer: AI.withDragDismiss(createDialog),
  collapsible: createCollapsible, accordion: createAccordion,
  toggle: createToggle, "toggle-group": createToggleGroup, "button-group": createButtonGroup, spinner: createSpinner,
  checkbox: createCheckbox, switch: createSwitch, "radio-group": createRadioGroup,
  popover: createPopover, tooltip: createTooltip, "hover-card": createHoverCard,
  "dropdown-menu": createDropdownMenu, "context-menu": createContextMenu, menubar: createMenubar, "navigation-menu": createNavigationMenu,
  select: createSelect, combobox: createCombobox, command: createCommand,
  field: createField, slider: createSlider, "pin-input": createPinInput, "input-otp": createPinInput, "toggle-password": createTogglePassword,
  "file-input": createFileInput, "image-input": createImageInput, repeater: createRepeater, rating: createRating, textarea: createTextarea,
  "color-picker": createColorPicker, sortable: createSortable,
  calendar: createCalendar, "date-picker": createDatePicker,
  pagination: createPagination, stepper: createStepper, scrollspy: createScrollspy, scrollto: createScrollTo, sticky: createSticky, sidebar: createSidebar,
  dismiss: createDismiss, alert: createDismiss, toaster: createToaster, progress: createProgress, carousel: createCarousel, avatar: createAvatar,
  "theme-switch": createThemeSwitch, datatable: createDataTable, "data-table": createDataTable, resizable: createResizable, reparent: createReparent,
  "scroll-area": createScrollArea, scrollable: createScrollArea, "message-scroller": createMessageScroller, clipboard: createClipboard,
  button: createButton, separator: createSeparator, "item-group": createItemGroup, badge: createBadge, clothline: createClothline, cell: createCell,
  bubble: AI.createBubble, message: AI.createMessage, marker: AI.createMarker, trace: AI.createTrace,
  attachment: AI.createAttachment, questionnaire: AI.createQuestionnaire, chart: AI.createChart,
  "chain-of-thought": AI.createChainOfThought, task: AI.createTask, plan: AI.createPlan, tool: AI.createTool, reasoning: AI.createReasoning,
  sources: AI.createSources, subagent: AI.createSubagent, "stack-trace": AI.createStackTrace, "test-results": AI.createTestResults, terminal: AI.createTerminal,
  checkpoint: AI.createCheckpoint, confirmation: AI.createConfirmation, context: AI.createContextUsage, "file-tree": AI.createFileTree,
  "prompt-input": AI.createPromptInput, queue: AI.createQueue, suggestion: AI.createSuggestion, "auth-form": createAuthForm,
};

/** Initialise components inside `scope`. Inner components first, so outer ones (e.g. a calendar inside
 *  a date-picker, or tabs inside a dialog) find their children already wired. */
export function init(scope = document) {
  const els = [...scope.querySelectorAll("[data-ui]")];
  if (scope.matches?.("[data-ui]")) els.unshift(scope);
  for (const el of els.reverse()) {
    const f = registry[el.dataset.ui];
    if (!f || el.closest("template")) continue;
    // date-picker owns its calendar; repeater rows initialise after insertion
    if (el.dataset.ui === "calendar" && el.closest('[data-ui="date-picker"]')) continue;
    try { f(el); } catch (e) { console.error(`[colibri-ui] ${el.dataset.ui}:`, e, el); }
  }
}

if (typeof document !== "undefined" && !globalThis.__COLIBRI_UI_NO_AUTO__) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init());
  else init();
  initMotion(document); // exit animations (no-op without themes/motion.css tokens)
  document.addEventListener("ui:refresh", (e) => init(e.target instanceof Element ? e.target : document));
  document.addEventListener("htmx:afterSwap", (e) => init(e.target)); // HTMX support, no-op otherwise
}
