const initialColors = [
  ['Apricot', '#FFCDB2'], ['Melon', '#FFB4A2'], ['Salmon pink', '#E5989B'],
  ['Old rose', '#C492AC'], ['Wisteria', '#9F97C1'], ['French gray', '#B0B8CD'], ['Naples yellow', '#FFE08A'],
];
export const colorRows = () => initialColors.map(([name, color], index) => ({
  id: index + 1, name, color, accents: initialColors[(index + 1) % initialColors.length][1],
}));

const hexPattern = /^#[0-9a-f]{6}$/i;
const component = n => Math.round(n).toString(16).padStart(2, '0');
const hues = ['536481', 'D93B42', 'EBA500', '369459', '009E98', '0088D8', '405DC2', '725598', '9F507D', '855F53'];
const palette = [
  ...Array.from({length: 10}, (_, i) => '#' + component(i * 255 / 9).repeat(3)),
  ...[0.77, 0.56, 0.32, 0.1, -0.14, -0.36, -0.57].flatMap(light =>
    hues.map(hex => '#' + hex.match(/../g).map(pair => {
      const channel = parseInt(pair, 16);
      return component(light >= 0 ? channel + (255 - channel) * light : channel * (1 + light));
    }).join(''))),
].map(color => color.toUpperCase());

function ink(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(pair => {
    const n = parseInt(pair, 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#000' : '#fff';
}

function node(tag, cls, text) {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  if (tag === 'button') el.type = 'button';
  return el;
}

function colorRenderer(custom, multiple) {
  return () => {
    const element = node('span', 'palette-cell');
    const trigger = node('button', 'palette-trigger');
    trigger.tabIndex = -1;
    trigger.dataset.inlineTrigger = '';
    trigger.setAttribute('aria-haspopup', 'dialog');
    element.append(trigger);
    let close;
    const item = {
      element, focusTarget: trigger, beginInlineEdit: open,
      discard() { close?.(false, false); },
      destroy() { close?.(false, false); },
      prepare() {
        if (close) return;
        const colors = String(item.value ?? '').toUpperCase().split(/,\s*/).filter(color => hexPattern.test(color));
        trigger.disabled = !item.column.editable;
        trigger.setAttribute('aria-label', 'Edit ' + item.column.label);
        trigger.setAttribute('aria-expanded', 'false');
        paintColors(colors);
      },
    };
    function paintColors(colors) {
        trigger.replaceChildren();
        trigger.title = colors.join(', ');
        for (const color of colors) {
          const tag = node('span', 'palette-value', color);
          tag.style.backgroundColor = color;
          tag.style.color = ink(color);
          trigger.append(tag);
        }
        if (!colors.length) trigger.textContent = 'Choose color';
        trigger.classList.toggle('palette-single', !multiple);
    }
    function open() {
      if (close || trigger.disabled) return;
      item.owner?.activate(item.rowIndex, item.columnIndex);
      const port = element.closest('[role=grid]');
      const cell = element.closest('[role=gridcell]');
      const selected = new Set(String(item.value ?? '').toUpperCase().split(/,\s*/).filter(color => hexPattern.test(color)));
      const original = [...selected].join(', ');
      const panel = node('div', 'palette-panel');
      panel.setAttribute('popover', 'manual');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', item.column.label + ' palette');
      const colors = node('div', 'palette-swatches');
      const extras = node('div', 'palette-custom');
      const scope = new AbortController();
      const { signal } = scope;
      const hex = node('input', 'palette-hex');
      hex.placeholder = '#RRGGBB';
      hex.setAttribute('aria-label', 'Custom hex color');
      hex.maxLength = 7;
      const add = node('button', '', 'Add');
      const apply = node('button', '', 'Done');
      const swatches = new Map();
      const swatch = (value, container) => {
        if (swatches.has(value)) return;
        const b = node('button', 'palette-swatch');
        b.style.backgroundColor = value;
        b.style.color = ink(value);
        b.title = value;
        b.tabIndex = -1;
        b.setAttribute('aria-label', value);
        b.setAttribute('aria-pressed', selected.has(value));
        b.onclick = () => choose(value);
        container.append(b);
        swatches.set(value, b);
      };
      for (const value of palette) swatch(value, colors);
      for (const value of new Set([...custom, ...selected])) swatch(value, extras);
      const form = node('div', 'palette-entry');
      form.append(hex, add);
      if (multiple) form.append(apply);
      panel.append(colors, node('strong', '', 'Custom colors'), extras, form);
      const commit = item.commit;
      close = (save, restore) => {
        close = undefined;
        scope.abort();
        panel.remove();
        item.prepare();
        const value = [...selected].join(', ');
        if (save && value !== original) commit(value);
        if (restore) port.focus({preventScroll: true});
      };
      function choose(color) {
        if (!multiple) {
          selected.clear();
          selected.add(color);
          close(true, true);
        } else {
          if (selected.has(color)) selected.delete(color);
          else selected.add(color);
          swatches.get(color).setAttribute('aria-pressed', selected.has(color));
          paintColors([...selected]);
        }
      }
      add.onclick = () => {
        const value = '#' + hex.value.trim().replace(/^#/, '').toUpperCase();
        if (!hexPattern.test(value)) {
          hex.setCustomValidity('Enter a six-digit hex color.');
          hex.reportValidity();
          return;
        }
        if (!palette.includes(value)) custom.add(value);
        swatch(value, extras);
        hex.value = '';
        if (multiple && selected.has(value)) return;
        choose(value);
      };
      hex.oninput = () => hex.setCustomValidity('');
      apply.onclick = () => close(true, true);
      panel.onkeydown = e => {
        if (e.key === 'Escape') { e.preventDefault(); close(false, true); }
        else if (e.key === 'Enter' && e.target === hex) { e.preventDefault(); add.click(); }
        else if (e.target.classList.contains('palette-swatch') && ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const buttons = [...swatches.values()];
          const step = { ArrowDown:10, ArrowUp:-10, ArrowLeft:-1, ArrowRight:1 }[e.key];
          buttons[Math.max(0, Math.min(buttons.length - 1, buttons.indexOf(e.target) + step))].focus();
        }
        e.stopPropagation();
      };
      panel.onpointerdown = e => e.stopPropagation();
      panel.onmousedown = e => { if (e.target.closest('button')) e.preventDefault(); };
      panel.onfocusin = e => {
        if (!e.target.classList.contains('palette-swatch')) return;
        for (const button of swatches.values()) button.tabIndex = button === e.target ? 0 : -1;
      };
      panel.onclick = e => e.stopPropagation();
      element.append(panel);
      panel.showPopover();
      const position = () => {
        const box = cell.getBoundingClientRect();
        const space = port.getBoundingClientRect();
        if (box.bottom <= Math.max(0, space.top) || box.top >= Math.min(innerHeight, space.bottom) ||
            box.right <= space.left || box.left >= space.right) { close(true, false); return; }
        const above = box.top - 6, below = innerHeight - box.bottom - 6;
        panel.style.maxHeight = Math.max(0, Math.max(above, below)) + 'px';
        panel.style.left = Math.max(4, Math.min(box.left, innerWidth - panel.offsetWidth - 4)) + 'px';
        panel.style.top = (below < panel.offsetHeight && above > below ? box.top - panel.offsetHeight - 2 : box.bottom + 2) + 'px';
      };
      for (const type of ['focusin', 'pointerdown']) document.addEventListener(type, e => {
        if (!element.contains(e.target)) close(true, false);
      }, {capture:true, signal});
      document.addEventListener('scroll', e => { if (!panel.contains(e.target)) position(); }, {capture:true, signal});
      window.addEventListener('resize', position, {signal});
      position();
      if (!close) return;
      trigger.setAttribute('aria-expanded', 'true');
      (swatches.get(selected.values().next().value) ?? colors.firstChild).focus({preventScroll:true});
    }
    trigger.onclick = e => { e.stopPropagation(); open(); };
    element.ondblclick = e => e.stopPropagation();
    return item;
  };
}

export function colorColumns() {
  const custom = new Set(initialColors.map(([, color]) => color));
  function column(field, label, multiple) {
    return { field, label, width: multiple ? 290 : 175, editable: true, rendererIsEditor: true,
      itemRenderer: colorRenderer(custom, multiple),
      validator: value => (multiple ? !value || String(value).split(/,\s*/).every(v => hexPattern.test(v)) : hexPattern.test(value)) || 'Use six-digit hex colors.',
    };
  }
  return [{field:'name',label:'Name',width:150,editable:false}, column('color','Color',false), column('accents','Accent colors',true)];
}
