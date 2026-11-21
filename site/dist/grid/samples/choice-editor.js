import { selectionSummary } from './selection-summary.js';

// Renderers own their cell. Only the active cell creates an input and an option list.
const make = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });
const split = (value) =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
let sequence = 0;

export function choiceRenderer(choices, { multiple = false, duplicates = false, status = false, searchable = true, allowNew = true } = {}) {
  function token(label) {
    const chip = make('span', 'choice-chip');
    chip.dataset.tone = String(choices.indexOf(label) % 5);
    if (status) chip.classList.add('choice-status');
    chip.textContent = label;
    return chip;
  }
  return () => {
    const element = make('span', 'cell-choice');
    const trigger = make('button', 'choice-trigger');
    trigger.type = 'button';
    const summary = multiple ? selectionSummary(trigger) : null;
    trigger.tabIndex = -1;
    trigger.dataset.inlineTrigger = '';
    if (choices.length) trigger.setAttribute('aria-haspopup', 'listbox');
    else trigger.classList.add('free-tags');
    element.append(trigger);
    let session;
    const item = {
      element,
      focusTarget: trigger,
      prepare() {
        if (session) return;
        const labels = multiple ? split(item.value) : [item.value].filter(Boolean);
        trigger.replaceChildren(...labels.map(token));
        trigger.title = labels.join(', ');
        summary?.refresh();
        trigger.setAttribute('aria-label', 'Edit ' + item.column.label);
        if (choices.length) trigger.setAttribute('aria-expanded', 'false');
        trigger.disabled = !item.column.editable;
      },
      beginInlineEdit: open,
      discard() { close(false); summary?.disconnect(); },
      destroy() { close(false); summary?.disconnect(); },
    };

    function close(restoreFocus) {
      if (!session) return;
      const { scope, input, list } = session;
      session = null;
      scope.abort();
      list.remove();
      input.remove();
      element.replaceChildren(trigger);
      element.classList.remove('editing');
      item.prepare();
      if (restoreFocus) element.closest('[role=grid]')?.focus({ preventScroll: true });
    }
    function open() {
      if (session || trigger.disabled) return;
      item.owner?.activate(item.rowIndex, item.columnIndex);
      const input = make('input', 'choice-input');
      const list = make('div', 'choice-list');
      const tokens = make('span', 'choice-tokens');
      const scope = new AbortController();
      const { signal } = scope;
      const original = String(item.value ?? '');
      let selected = multiple ? split(original) : [original];
      let active = -1;
      const cell = element.closest('[role=gridcell]');
      const port = element.closest('[role=grid]');
      session = { scope, input, list };
      list.id = 'choice-list-' + ++sequence;
      list.setAttribute('popover', 'manual');
      const optionsBox = make('div', 'choice-options');
      optionsBox.id = list.id + '-options';
      optionsBox.setAttribute('role', 'listbox');
      list.append(optionsBox);
      // Keep option presses in the editor, outside the grid's range-selection gesture.
      list.onpointerdown = (event) => event.stopPropagation();
      optionsBox.setAttribute('aria-label', item.column.label);
      if (multiple) optionsBox.setAttribute('aria-multiselectable', 'true');
      input.type = 'text';
      input.readOnly = !searchable;
      input.autocomplete = 'off';
      if (choices.length) {
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', searchable ? 'list' : 'none');
        input.setAttribute('aria-controls', optionsBox.id);
      }
      input.setAttribute('aria-label', item.column.label);
      input.placeholder = multiple ? 'Select…' : !searchable ? 'Choose…' : 'Find ' + item.column.label.toLowerCase() + '…';
      element.classList.add('editing');
      const counter = make('span', 'choice-count');
      const fixedChoices = multiple && choices.length > 0;
      if (fixedChoices) {
        list.prepend(tokens);
        element.replaceChildren(counter, input, list);
      } else element.replaceChildren(tokens, input, list);

      function drawTokens() {
        tokens.replaceChildren(
          ...(multiple ? selected : []).map((label, i) => {
            const chip = token(label);
            const remove = make('button', 'choice-remove');
            remove.type = 'button';
            remove.tabIndex = -1;
            remove.textContent = '×';
            remove.setAttribute('aria-label', 'Remove ' + label);
            remove.onmousedown = (event) => event.preventDefault();
            remove.onclick = () => {
              selected.splice(i, 1);
              refresh();
              input.focus();
            };
            chip.append(remove);
            return chip;
          }),
        );
        counter.textContent = selected.length + ' selected';
        if (!fixedChoices) tokens.scrollLeft = tokens.scrollWidth;
      }
      function add(text) {
        for (const value of split(text)) if ((allowNew || choices.includes(value)) && (duplicates || !selected.includes(value))) selected.push(value);
      }
      function finish(focus = true) {
        if (multiple) add(input.value);
        const value = multiple ? selected.join(', ') : selected[0];
        const commit = item.commit;
        // A successful write can synchronously recycle this renderer. Close before the write.
        close(false);
        if (value !== original) commit(value);
        if (focus) port.focus({ preventScroll: true });
      }
      function position() {
        const box = cell.getBoundingClientRect();
        const width = Math.min(Math.max(185, box.width), window.innerWidth - 12);
        list.style.width = width + 'px';
        list.style.left = Math.max(6, Math.min(box.left, window.innerWidth - width - 6)) + 'px';
        const above = box.top - 6,
          below = window.innerHeight - box.bottom - 6;
        const up = below < Math.min(205, list.scrollHeight) && above > below;
        list.style.maxHeight = Math.max(0, Math.min(230, (up ? above : below) - 4)) + 'px';
        list.style.top = (up ? box.top - list.offsetHeight - 3 : box.bottom + 3) + 'px';
      }
      function highlight(index) {
        const options = [...list.querySelectorAll('[role=option]')];
        active = index;
        options.forEach((option, i) => option.classList.toggle('current', i === index));
        if (options[index]) {
          input.setAttribute('aria-activedescendant', options[index].id);
          options[index].scrollIntoView({ block: 'nearest' });
        } else input.removeAttribute('aria-activedescendant');
      }
      function choose(label, create) {
        if (!multiple) {
          selected = [label];
          finish();
          return;
        }
        if (!create && selected.includes(label)) selected = selected.filter((s) => s !== label);
        else add(label);
        input.value = '';
        refresh();
        input.focus();
      }
      function refresh() {
        drawTokens();
        const term = input.value.trim();
        const matches = choices.filter((value) => value.toLowerCase().includes(term.toLowerCase()));
        optionsBox.replaceChildren();
        function option(label, create = false) {
          const entry = make('div', 'choice-option');
          entry.setAttribute('role', 'option');
          entry.id = list.id + '-' + optionsBox.children.length;
          entry.setAttribute('aria-label', create ? 'Add ' + label : label);
          entry.setAttribute('aria-selected', String(!create && selected.includes(label)));
          if (status && !create) entry.append(token(label));
          else entry.textContent = create ? 'Add “' + label + '”' : label;
          entry.onmousedown = (event) => event.preventDefault();
          entry.onclick = () => choose(label, create);
          optionsBox.append(entry);
        }
        matches.forEach((label) => option(label));
        if (multiple && allowNew && choices.length && term && ![...choices, ...selected].includes(term)) option(term, true);
        if (!optionsBox.childElementCount && choices.length) {
          const empty = make('div', 'choice-empty');
          empty.textContent = 'No matches';
          optionsBox.append(empty);
        }
        const visible = optionsBox.childElementCount > 0;
        if (visible) {
          if (!list.matches(':popover-open')) list.showPopover();
          position();
        } else if (list.matches(':popover-open')) list.hidePopover();
        if (choices.length) input.setAttribute('aria-expanded', String(visible));
        highlight(term && !multiple && matches.length ? 0 : -1);
      }
      if (multiple && choices.length) {
        const done = make('button', 'choice-done');
        done.type = 'button';
        done.textContent = 'Done';
        done.onmousedown = event => event.preventDefault();
        done.onclick = () => finish();
        list.append(done);
      }
      input.oninput = refresh;
      input.onkeydown = (event) => {
        if (event.isComposing) return;
        const options = list.querySelectorAll('[role=option]');
        if (event.key === 'Escape') close(true);
        else if (event.key === 'Tab') {
          if (!multiple && options[active]) selected = [options[active].textContent];
          const direction = event.shiftKey ? -1 : 1;
          const move = item.moveFocus;
          const owner = item.owner,
            row = item.rowIndex,
            col = item.columnIndex;
          finish();
          if (owner) owner.activate(row, col + direction);
          else move?.(direction);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          if (options.length)
            highlight(
              (active < 0
                ? event.key === 'ArrowDown'
                  ? 0
                  : options.length - 1
                : active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length,
            );
        } else if (event.key === 'Enter') {
          if (active >= 0 && options[active]) options[active].click();
          else if (multiple && input.value.trim()) {
            add(input.value);
            input.value = '';
            refresh();
          } else if (!multiple && options.length === 1) options[0].click();
          else finish();
        } else if (multiple && event.key === ',') {
          add(input.value);
          input.value = '';
          refresh();
        } else if (multiple && event.key === 'Backspace' && !input.value) {
          selected.pop();
          refresh();
        } else return;
        event.preventDefault();
        event.stopPropagation();
      };
      document.addEventListener(
        'pointerdown',
        (event) => {
          if (!element.contains(event.target)) finish(false);
        },
        { capture: true, signal },
      );
      document.addEventListener(
        'focusin',
        (event) => {
          if (!element.contains(event.target)) finish(false);
        },
        { signal },
      );
      document.addEventListener(
        'scroll',
        (event) => {
          if (list.contains(event.target) || element.contains(event.target)) return;
          const rect = cell.getBoundingClientRect(),
            viewport = port.getBoundingClientRect();
          if (rect.bottom <= Math.max(0, viewport.top) || rect.top >= Math.min(innerHeight, viewport.bottom))
            close(false);
          else if (list.matches(':popover-open')) position();
        },
        { capture: true, signal },
      );
      window.addEventListener(
        'resize',
        () => {
          if (list.matches(':popover-open')) position();
        },
        { signal },
      );
      refresh();
      input.focus({ preventScroll: true });
    }
    element.onclick = (event) => event.stopPropagation();
    element.ondblclick = (event) => event.stopPropagation();
    trigger.onclick = open;
    return item;
  };
}
