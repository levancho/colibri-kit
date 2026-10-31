// @colibri/ui core: Tabs controller. Headless: no styles, no framework, no custom elements.
// Works on any markup that follows the data-* contract below (FreeMarker, plain HTML, React refs).
//
//   <div data-ui="tabs" [data-orientation="horizontal|vertical"] [data-activation="auto|manual"]>
//     <div data-ui-part="list">
//       <button data-ui-part="trigger" data-value="a">A</button>
//       <button data-ui-part="trigger" data-value="b" disabled>B</button>
//     </div>
//     <div data-ui-part="panel" data-value="a">...</div>
//     <div data-ui-part="panel" data-value="b">...</div>
//   </div>
//
// State is exposed ONLY via attributes, so any external CSS can style it:
//   [data-state="active|inactive"], [aria-selected], [hidden], [data-disabled]
// Events (bubble): "ui:change" detail {value, previous}

let uid = 0;
const q = (root, part) =>
  [...root.querySelectorAll(`[data-ui-part="${part}"]`)].filter(
    (el) => el.closest('[data-ui="tabs"]') === root // ignore nested tabs
  );

export function createTabs(root, options = {}) {
  if (root.__uiTabs) return root.__uiTabs;
  const id = root.id || `ui-tabs-${++uid}`;
  const orientation = options.orientation || root.dataset.orientation || "horizontal";
  const activation = options.activation || root.dataset.activation || "auto";
  const onChange = options.onChange;
  let value = null;

  const triggers = () => q(root, "trigger");
  const panels = () => q(root, "panel");
  const enabled = () => triggers().filter((t) => !t.disabled && t.dataset.disabled == null);

  function wire() {
    const list = q(root, "list")[0];
    if (list) {
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-orientation", orientation);
    }
    triggers().forEach((t) => {
      const v = t.dataset.value;
      t.id ||= `${id}-trigger-${v}`;
      t.setAttribute("role", "tab");
      t.setAttribute("aria-controls", `${id}-panel-${v}`);
      if (t.tagName === "BUTTON" && !t.hasAttribute("type")) t.type = "button";
      if (t.disabled) t.dataset.disabled = "";
    });
    panels().forEach((p) => {
      const v = p.dataset.value;
      p.id ||= `${id}-panel-${v}`;
      p.setAttribute("role", "tabpanel");
      p.setAttribute("aria-labelledby", `${id}-trigger-${v}`);
      p.tabIndex = 0;
    });
  }

  function render() {
    triggers().forEach((t) => {
      const on = t.dataset.value === value;
      t.setAttribute("aria-selected", String(on));
      t.dataset.state = on ? "active" : "inactive";
      t.tabIndex = on ? 0 : -1;
    });
    panels().forEach((p) => {
      const on = p.dataset.value === value;
      p.dataset.state = on ? "active" : "inactive";
      p.hidden = !on;
    });
    root.dataset.value = value ?? "";
  }

  function select(next, { focus = false, silent = false } = {}) {
    const t = triggers().find((x) => x.dataset.value === next);
    if (!t || t.disabled || t.dataset.disabled != null) return;
    const previous = value;
    value = next;
    render();
    if (focus) t.focus();
    if (!silent && previous !== next) {
      onChange?.(next, previous);
      root.dispatchEvent(new CustomEvent("ui:change", { bubbles: true, detail: { value: next, previous } }));
    }
  }

  function onClick(e) {
    const t = e.target.closest('[data-ui-part="trigger"]');
    if (t && triggers().includes(t)) select(t.dataset.value);
  }

  function onKeydown(e) {
    const t = e.target.closest('[data-ui-part="trigger"]');
    if (!t || !triggers().includes(t)) return;
    const list = enabled();
    const i = list.indexOf(t);
    const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    let target = null;
    if (e.key === next) target = list[(i + 1) % list.length];
    else if (e.key === prev) target = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") target = list[0];
    else if (e.key === "End") target = list[list.length - 1];
    else if ((e.key === "Enter" || e.key === " ") && activation === "manual") {
      e.preventDefault();
      return select(t.dataset.value);
    } else return;
    e.preventDefault();
    if (activation === "auto") select(target.dataset.value, { focus: true });
    else target.focus();
  }

  wire();
  const initial =
    options.value ?? root.dataset.defaultValue ??
    triggers().find((t) => t.getAttribute("aria-selected") === "true")?.dataset.value ??
    enabled()[0]?.dataset.value;
  select(initial, { silent: true });

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeydown);

  const api = {
    get value() { return value; },
    select: (v) => select(v),
    refresh() { wire(); render(); },   // call after adding/removing tabs
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeydown);
      delete root.__uiTabs;
    },
  };
  root.__uiTabs = api;
  return api;
}
