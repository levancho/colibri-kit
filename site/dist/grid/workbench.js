/* Colibri Grid workbench. Data, column definitions and the host element are supplied by the caller. */
window.ColibriGrid.Workbench = (() => {
  const chartFamilies = {
    Column: ['Grouped', 'Stacked', '100% Stacked'],
    Bar: ['Grouped', 'Stacked', '100% Stacked'],
    Pie: ['Pie', 'Donut'],
    Line: ['Line', 'Stacked', '100% Stacked'],
    Area: ['Area', 'Stacked', '100% Stacked'],
    'X Y (Scatter)': ['Scatter', 'Bubble'],
    Polar: ['Radar Line', 'Radar Area', 'Nightingale', 'Radial Column', 'Radial Bar'],
    Statistical: ['Box Plot', 'Histogram', 'Range Bar', 'Range Area'],
    Hierarchical: ['Treemap', 'Sunburst'],
    Specialized: ['Heatmap', 'Waterfall'],
    Funnel: ['Funnel', 'Cone Funnel', 'Pyramid'],
    Combination: ['Column & Line', 'Area & Column'],
  };

  const chartModule = new URL('charts.js', document.currentScript?.src || new URL('/grid/workbench.js', location.href));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const button = (text, fn, label = text) => {
    const n = el('button', '', text);
    n.type = 'button';
    n.title = label;
    n.setAttribute('aria-label', label);
    n.onclick = fn;
    return n;
  };
  const select = (list, value, fn, label) => {
    const n = el('select');
    n.setAttribute('aria-label', label);
    for (const [id, text] of list) n.add(new Option(text, id));
    n.value = value;
    n.onchange = () => fn(n.value);
    return n;
  };
  const check = (label, value, fn) => {
    const l = el('label', 'wb-check'),
      n = el('input');
    n.type = 'checkbox';
    n.checked = value;
    n.onchange = () => fn(n.checked);
    l.append(n, document.createTextNode(label));
    return l;
  };
  const sum = (values) => values.reduce((a, b) => a + b, 0);
  function aggregate(rows, field, op) {
    if (op === 'count') return rows.length;
    let n = 0,
      total = 0,
      min = Infinity,
      max = -Infinity;
    for (const r of rows) {
      const v = r[field];
      if (!Number.isFinite(v)) continue;
      n++;
      total += v;
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    if (!n) return null;
    return op === 'min' ? min : op === 'max' ? max : op === 'mean' ? total / n : total;
  }
  const german = {
    File: 'Datei',
    Edit: 'Bearbeiten',
    View: 'Ansicht',
    Columns: 'Spalten',
    Filters: 'Filter',
    'Search records': 'Datensätze durchsuchen',
    'Search columns': 'Spalten suchen',
    'Import from': 'Importieren aus',
    'Export as': 'Exportieren als',
    Localization: 'Sprache',
    Show: 'Anzeigen',
    Theme: 'Thema',
    'Add row': 'Zeile hinzufügen',
    'Delete selected rows': 'Ausgewählte Zeilen löschen',
    Undo: 'Rückgängig',
    Redo: 'Wiederholen',
    'Column filters': 'Spaltenfilter',
    Resizer: 'Größe ändern',
    Totals: 'Summen',
    Pagination: 'Seitennummerierung',
    'Cell data': 'Zellendaten',
    'Row summary': 'Zeilensumme',
    Off: 'Aus',
    'Row groups': 'Zeilengruppen',
    'Expand all': 'Alle aufklappen',
    'Collapse all': 'Alle zuklappen',
    'Expand this branch': 'Diesen Zweig aufklappen',
    'Collapse this branch': 'Diesen Zweig zuklappen',
    'Group actions': 'Gruppenaktionen',
    Group: 'Gruppe',
    'Remove group': 'Gruppe entfernen',
    '(Blanks)': '(Leer)',
    Values: 'Werte',
    'Pivot columns': 'Pivot-Spalten',
    'Pivot mode': 'Pivot-Modus',
    'Insert above': 'Oberhalb einfügen',
    'Insert below': 'Unterhalb einfügen',
    'Clear row': 'Zeile leeren',
    'Delete row': 'Zeile löschen',
    'Select all': 'Alle auswählen',
    Project: 'Projekt',
    Team: 'Team',
    Property: 'Objekt',
    Client: 'Kunde',
    'Start date': 'Startdatum',
    'End date': 'Enddatum',
    Before: 'Vorher',
    After: 'Nachher',
    Country: 'Land',
    Participant: 'Teilnehmer',
    Language: 'Sprache',
    Name: 'Name',
    Rating: 'Bewertung',
    Bought: 'Gekauft',
    'Bank balance': 'Kontostand',
    'Total winnings': 'Gesamtgewinn',
    Game: 'Spiel',
    Light: 'Hell',
    Dark: 'Dunkel',
    'Move left': 'Nach links',
    'Move right': 'Nach rechts',
    'Pin left': 'Links fixieren',
    'Pin right': 'Rechts fixieren',
    Unpin: 'Lösen',
    'Hide column': 'Spalte ausblenden',
    'Sort ascending': 'Aufsteigend sortieren',
    'Sort descending': 'Absteigend sortieren',
    'Clear sort': 'Sortierung löschen',
    'Import CSV': 'CSV importieren',
    'Import JSON': 'JSON importieren',
    'Group by': 'Gruppieren nach',
    'Filters cleared': 'Filter entfernt',
    'Clear filters': 'Filter entfernen',
    'Drop columns to group rows': 'Spalten zum Gruppieren hierher ziehen',
    'Rows per page': 'Zeilen pro Seite',
    'rows per page': 'Zeilen pro Seite',
    'First page': 'Erste Seite',
    'Last page': 'Letzte Seite',
    'Page number': 'Seitennummer',
    'Records from': 'Datensätze von',
    'Rows from': 'Zeilen von',
    to: 'bis',
    of: 'von',
    '0 records': '0 Datensätze',
    '0 rows': '0 Zeilen',
    pinned: 'fixiert',
    selected: 'ausgewählt',
    Previous: 'Zurück',
    Next: 'Weiter',
    Actions: 'Aktionen',
    'Game of choice': 'Spielauswahl',
    Performance: 'Leistung',
    'Monthly breakdown': 'Monatliche Übersicht',
    Projects: 'Projekte',
    Dates: 'Termine',
    Budget: 'Budget',
    'Pin row': 'Zeile fixieren',
    'Unpin row': 'Zeile lösen',
    English: 'Englisch',
    German: 'Deutsch',
  };
  const cells = ColibriGrid.cells;
  const factory = (Component) => new ColibriGrid.ClassFactory(Component);
  class StatusRenderer extends ColibriGrid.LabelRenderer {
    prepare() {
      this.element.className = 'wb-status';
      this.element.dataset.state = this.value;
      super.prepare();
    }
  }
  class TeamRenderer extends ColibriGrid.LabelRenderer {
    prepare() {
      const people = String(this.value || '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      this.element.replaceChildren(
        ...people.map((name) => {
          const avatar = el(
            'span',
            'wb-avatar',
            name
              .split(' ')
              .map((p) => p[0])
              .join(''),
          );
          avatar.title = name;
          return avatar;
        }),
      );
      this.element.className = 'wb-people';
    }
  }
  class CheckRenderer {
    constructor() {
      this.element = el('input');
      this.element.type = 'checkbox';
      this.element.onchange = () => {
        const {owner, data, column} = this;
        const checked = this.element.checked;
        owner.choose(this.rowIndex, this.columnIndex);
        if (!this.commit(checked)) this.element.checked = !!this.value;
        else {
          const cell = owner.port.querySelector('[data-id="' + CSS.escape(String(data._key)) +
            '"] [data-field="' + CSS.escape(column.field) + '"] input');
          (cell || owner.port).focus({preventScroll:true});
        }
      };
    }
    prepare() {
      this.element.checked = !!this.value;
      this.element.disabled = !this.column.editable;
      this.element.setAttribute('aria-label', this.column.label + ' ' + (this.rowIndex + 1));
    }
  }
  class PinRenderer {
    constructor() {
      this.element = button('', () => this.owner.pinRow(this.data));
    }
    prepare() {
      const on = this.owner.pinned.has(this.data._key);
      this.element.textContent = on ? '★' : '☆';
      this.element.setAttribute('aria-label', this.owner.t(on ? 'Unpin row' : 'Pin row'));
    }
  }
  class GroupRenderer {
    constructor() {
      this.element = button('', () => {
        const g = this.owner.openGroups,
          key = this.data._groupKey;
        const owner = this.owner;
        if (g.has(key)) g.delete(key);
        else g.add(key);
        owner.redraw();
        owner.content.querySelector('[data-id="' + CSS.escape('group' + key) + '"] .wb-tree-toggle')?.focus({ preventScroll: true });
      });
      this.element.className = 'wb-tree-toggle';
      this.caption = el('span', 'wb-tree-label');
      this.count = el('span', 'wb-tree-count');
      this.element.append(this.caption, this.count);
    }
    prepare() {
      this.element.title = this.label;
      this.element.setAttribute('aria-label', this.label + ' (' + this.data._rows.length + ')');
      this.element.setAttribute('aria-expanded', this.owner.openGroups.has(this.data._groupKey));
      this.caption.textContent = this.label;
      this.count.textContent = '(' + this.data._rows.length.toLocaleString(this.owner.lang) + ')';
    }
  }
  class TrendRenderer {
    constructor() {
      this.element = el('canvas');
      this.element.width = 134;
      this.element.height = 27;
    }
    prepare() {
      const cols = this.owner.baseCols.filter((c) => c.group === 'Monthly breakdown');
      const trend = cols.map((c) => Number(this.data[c.field]) || 0),
        max = Math.max(1, ...trend);
      const ctx = this.element.getContext('2d');
      ctx.clearRect(0, 0, 134, 27);
      ctx.beginPath();
      ctx.moveTo(0, 26);
      trend.forEach((v, i) => ctx.lineTo((i * 132) / Math.max(1, trend.length - 1), 24 - (22 * v) / max));
      ctx.lineTo(132, 26);
      ctx.closePath();
      ctx.fillStyle = '#3b9b87';
      ctx.fill();
      this.element.title = cols.map((c) => c.label + ' ' + this.owner.display(this.data, c)).join(' · ');
    }
  }
  class ChoiceEditor {
    constructor() {
      this.element = el('div', 'wb-choice-editor');
      this.focusTarget = el('input');
      this.list = el('div', 'wb-editor-options');
      this.list.id = 'choices-' + crypto.randomUUID();
      this.list.setAttribute('role', 'listbox');
      this.focusTarget.setAttribute('role', 'combobox');
      this.focusTarget.setAttribute('aria-controls', this.list.id);
      this.focusTarget.setAttribute('aria-expanded', 'true');
      this.focusTarget.setAttribute('aria-autocomplete', 'list');
      this.element.append(this.focusTarget, this.list);
    }
    prepare() {
      const input = this.focusTarget;
      input.value = this.value ?? '';
      input.setAttribute('aria-label', this.column.label);
      const draw = (filter) => {
        const matches = this.column.options.filter((v) => v.toLowerCase().includes(filter.toLowerCase()));
        this.list.replaceChildren(
          ...matches.map((v, index) => {
            const option = el('div', '', v);
            option.id = this.list.id + '-' + index;
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', String(v === input.value));
            option.onpointerdown = (e) => e.preventDefault();
            option.onclick = () => {
              input.value = v;
              this.owner.endItemEditorSession();
            };
            return option;
          }),
        );
        this.active = this.list.querySelector('[aria-selected="true"]');
        input.removeAttribute('aria-activedescendant');
        if (this.active) input.setAttribute('aria-activedescendant', this.active.id);
      };
      draw('');
      input.oninput = () => draw(input.value);
      input.onkeydown = (e) => {
        const options = [...this.list.children];
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const i = this.active ? options.indexOf(this.active) : e.key === 'ArrowUp' ? 0 : -1;
          this.active?.setAttribute('aria-selected', 'false');
          this.active = options[(i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length];
          if (this.active) {
            this.active.setAttribute('aria-selected', 'true');
            input.setAttribute('aria-activedescendant', this.active.id);
            this.active.scrollIntoView({ block: 'nearest' });
          }
        } else if (['Tab', 'Enter'].includes(e.key) && (this.active || options.length === 1))
          input.value = (this.active || options[0]).textContent;
      };
    }
    get editedValue() {
      return this.focusTarget.value;
    }
  }
  class TeamEditor {
    constructor() {
      this.element = el('div', 'wb-team-editor');
      this.focusTarget = el('input');
      this.focusTarget.type = 'search';
      this.list = el('div', 'wb-editor-options');
      this.list.id = 'team-' + crypto.randomUUID();
      this.list.setAttribute('role', 'group');
      this.focusTarget.setAttribute('aria-controls', this.list.id);
    }
    prepare() {
      const input = this.focusTarget;
      const chosen = new Set(String(this.value || '').split(',').map(name => name.trim()).filter(Boolean));
      const update = () => {
        input.placeholder = chosen.size + ' ' + this.owner.t('selected');
      };
      input.setAttribute('aria-label', this.column.label);
      this.list.setAttribute('aria-label', this.column.label);
      this.list.replaceChildren(...this.column.options.map(name => check(name, chosen.has(name), on => {
        if (on) chosen.add(name);
        else chosen.delete(name);
        update();
      })));
      input.oninput = () => {
        const term = input.value.trim().toLowerCase();
        for (const label of this.list.children) label.hidden = !label.textContent.toLowerCase().includes(term);
      };
      // WebKit otherwise moves focus to the grid before a checkbox click completes.
      this.element.onmousedown = event => {
        if (event.target.closest('label, button')) event.preventDefault();
      };
      this.element.onkeydown = event => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        const options = [...this.list.querySelectorAll('label:not([hidden]) input')];
        if (!options.length) return;
        event.preventDefault();
        const index = options.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? index + 1 : (index <= 0 ? options.length - 1 : index - 1);
        options[next % options.length].focus();
      };
      const save = button('✓', () => this.owner.endItemEditorSession(), this.owner.t('Save'));
      this.element.replaceChildren(input, save, this.list);
      update();
    }
    get editedValue() {
      return [...this.list.querySelectorAll('input:checked')].map(n => n.parentElement.textContent).join(', ');
    }
  }
  const renderers = {
    status: factory(StatusRenderer),
    team: factory(TeamRenderer),
    boolean: factory(CheckRenderer),
    pin: factory(PinRenderer),
    group: factory(GroupRenderer),
    trend: factory(TrendRenderer),
  };
  const teamEditor = factory(TeamEditor),
    choiceEditor = factory(ChoiceEditor);
  ColibriGrid.renderers = Object.freeze({ ...renderers, text: cells.text });
  ColibriGrid.editors = Object.freeze({ input: cells.input, team: teamEditor, choice: choiceEditor });
  return class Workbench {
    constructor(host, { columns, rows = [], dataProvider, label = 'Records', language = 'en' }) {
      this.renderPool = new cells.RendererPool();
      this.headerPool = new cells.RendererPool();
      this.dataProvider = dataProvider;
      if (dataProvider) rows = dataProvider.source;
      this.host = host;
      this.label = label;
      this.lang = language;
      this.baseCols = columns.map((c) => ({ ...cells.normalizeColumn(c), width: c.width || 130 }));
      this.initialColumns = this.baseCols.map((c) => ({ ...c }));
      this.rows = rows.map((r, i) => ({ ...r, _key: dataProvider ? r[dataProvider.key] : i + 1 }));
      this.nextId = rows.length + 1;
      this.collapsedBands = new Set();
      this.pivotSort = null;
      this.selected = new Set();
      this.pinned = new Set();
      this.filters = new Map();
      this.groups = [];
      this.values = [];
      this.axes = [];
      this.openGroups = new Set();
      this.treeColumn = { field: '_label', label: 'Group', group: 'Group', width: 220, pin: 'left', editable: false };
      this.sorts = [];
      this.query = '';
      this.panel = 'Columns';
      this.pivot = false;
      this.showFilters = true;
      this.resize = true;
      this.totals = false;
      this.paged = false;
      this.page = 0;
      this.pageSize = 50;
      this.tip = 'Cell data';
      this.undoStack = [];
      this.redoStack = [];
      this.anchor = null;
      this.active = null;
      this.drag = null;
      this.rowHeight = 35;
      this.root = el('section', 'wb ui-root');
      host.replaceChildren(this.root);
      this.bar = el('div', 'wb-menu');
      this.groupbar = el('div', 'wb-groups');
      this.layout = el('div', 'wb-layout');
      this.port = el('div', 'wb-port');
      this.port.tabIndex = 0;
      this.port.setAttribute('role', 'grid');
      this.port.setAttribute('aria-label', label);
      this.sheet = el('div', 'wb-sheet');
      this.head = el('div', 'wb-head');
      this.pinBody = el('div', 'wb-pins');
      this.content = el('div', 'wb-content');
      this.summary = el('div', 'wb-summary');
      this.sheet.append(this.head, this.pinBody, this.content, this.summary);
      this.port.append(this.sheet);
      this.side = el('aside', 'wb-side');
      this.foot = el('div', 'wb-foot');
      this.layout.append(this.port, this.side);
      this.root.append(this.bar, this.groupbar, this.layout, this.foot);
      this.life = new AbortController();
      if (dataProvider) this.observeProvider(dataProvider);
      document.addEventListener(
        'pointerup',
        () => {
          if (this.fillStart) this.fill();
          if (this.dragRange) this.updateHandle();
          this.dragRange = false;
        },
        { signal: this.life.signal },
      );
      this.port.onscroll = () => this.paintRows();
      this.port.onkeydown = (e) => this.key(e);
      for (const action of ['copy', 'cut', 'paste'])
        document.addEventListener(
          action,
          (event) => {
            if (!this.active || document.activeElement !== this.port || !event.clipboardData) return;
            event.preventDefault();
            try {
              if (action === 'paste') this.paste(ColibriGrid.delimited.readClipboard(event.clipboardData));
              else {
                ColibriGrid.delimited.writeClipboard(event.clipboardData, this.range());
                if (action === 'cut') {
                  const b = this.bounds(),
                    changes = [];
                  for (let r = b.top; r <= b.bottom; r++)
                    for (let c = b.left; c <= b.right; c++) changes.push([this.visible[r], this.cols[c], null]);
                  this.write(changes);
                }
              }
            } catch (error) {
              this.notice(error.message);
            }
          },
          { signal: this.life.signal },
        );
      this.root.oncontextmenu = (e) => {
        const cell = e.target.closest('[data-cell]');
        if (!cell) return;
        e.preventDefault();
        if (!this.within(+cell.dataset.r, +cell.dataset.c)) this.choose(+cell.dataset.r, +cell.dataset.c);
        this.cellMenu(cell, this.visible[+cell.dataset.r]);
      };
      document.addEventListener(
        'pointerdown',
        (e) => {
          if (this.popup && !this.popup.contains(e.target) && !this.trigger?.contains(e.target)) this.closeMenu();
        },
        { signal: this.life.signal },
      );
      document.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape') this.closeMenu();
        },
        { signal: this.life.signal },
      );
      this.redraw();
      this.observer = new ResizeObserver(() => this.paintRows());
      this.observer.observe(this.port);
    }
    t(s) {
      return this.lang === 'de' ? german[s] || s : s;
    }
    destroy() {
      this.providerLife?.abort();
      this.discardEditor('destroy');
      this.renderPool.destroy();
      this.headerPool.destroy();
      this.observer.disconnect();
      this.life.abort();
      this.closeMenu();
      this.root.remove();
    }
    closeMenu() {
      this.popup?.remove();
      this.popup = null;
    }
    menu(target, items) {
      this.closeMenu();
      this.trigger = target;
      const box = el('div', 'wb-popup');
      box.setAttribute('role', 'menu');
      const populate = (panel, entries, parent) => {
        let submenu;
        const dismiss = () => {
          submenu?.remove();
          submenu = null;
          panel.querySelector(':scope > [aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
        };
        for (const [name, command, disabled] of entries) {
          const nested = Array.isArray(command);
          const open = (focus) => {
            dismiss();
            submenu = el('div', 'wb-popup');
            submenu.setAttribute('role', 'menu');
            panel.append(submenu);
            populate(submenu, command, b);
            const r = b.getBoundingClientRect();
            submenu.style.left =
              (r.right + submenu.offsetWidth < innerWidth ? r.right : Math.max(0, r.left - submenu.offsetWidth)) +
              'px';
            submenu.style.top = Math.max(0, Math.min(r.top, innerHeight - submenu.offsetHeight)) + 'px';
            b.setAttribute('aria-expanded', 'true');
            if (focus) submenu.querySelector('button:not(:disabled)')?.focus();
          };
          const b = button(this.t(name), () => {
            if (nested) open(true);
            else {
              this.closeMenu();
              command();
            }
          });
          b.disabled = !!disabled;
          b.setAttribute('role', 'menuitem');
          if (nested) {
            b.setAttribute('aria-haspopup', 'menu');
            b.setAttribute('aria-expanded', 'false');
          }
          b.onpointerenter = () => (nested ? open(false) : dismiss());
          b.onkeydown = (event) => {
            const buttons = [...panel.querySelectorAll(':scope > button:not(:disabled)')];
            const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
            if (step) buttons[(buttons.indexOf(b) + step + buttons.length) % buttons.length].focus();
            else if (nested && event.key === 'ArrowRight') open(true);
            else if (parent && ['ArrowLeft', 'Escape'].includes(event.key)) {
              parent.focus();
              parent.setAttribute('aria-expanded', 'false');
              panel.remove();
            } else if (event.key === 'Escape') {
              this.closeMenu();
              target.focus();
            } else return;
            event.preventDefault();
            event.stopPropagation();
          };
          panel.append(b);
        }
      };
      populate(box, items);
      this.root.append(box);
      this.popup = box;
      const r = target.getBoundingClientRect();
      box.style.left = Math.max(4, Math.min(innerWidth - box.offsetWidth - 6, r.left)) + 'px';
      box.style.top = Math.max(4, Math.min(innerHeight - box.offsetHeight - 6, r.bottom)) + 'px';
      box.querySelector('button:not(:disabled)')?.focus();
    }
    redraw(expandFrom) {
      this.discardEditor('redraw');
      this.model(expandFrom);
      this.drawTotals();
      this.toolbar();
      this.groupZone();
      this.headers();
      this.sidebar();
      this.paintRows();
      this.footer();
    }
    matches(row, c, q) {
      const v = c.kind === 'pin' ? this.pinned.has(row._key) : row[c.field];
      if (q?.rules) {
        const match = ({ op, a, b }) => {
          if (op === 'Blank') return v == null || v === '';
          if (op === 'Not blank') return v != null && v !== '';
          if (!Number.isFinite(v)) return false;
          switch (op) {
            case 'Equals':
              return v === a;
            case 'Does not equal':
              return v !== a;
            case 'Greater than':
              return v > a;
            case 'Greater than or equal':
              return v >= a;
            case 'Less than':
              return v < a;
            case 'Less than or equal':
              return v <= a;
            case 'In range':
              return v >= a && v <= b;
            default:
              return false;
          }
        };
        return q.join === 'OR' ? q.rules.some(match) : q.rules.every(match);
      }
      if (q && typeof q === 'object' && !Array.isArray(q)) {
        if ((q.start && (!v || v < q.start)) || (q.end && (!v || v > q.end))) return false;
        if (
          q.text &&
          !String(v ?? '')
            .toLocaleLowerCase()
            .includes(q.text.toLocaleLowerCase())
        )
          return false;
        q = q.set || [];
      }
      if (Array.isArray(q))
        return (
          !q.length ||
          q.some((entry) =>
            c.kind === 'team'
              ? String(v || '')
                  .split(',')
                  .map((n) => n.trim())
                  .includes(entry)
              : String(v ?? '') === entry,
          )
        );
      if (typeof q !== 'string') return true;
      if (c.type === 'number') {
        const m = q.match(/^\s*(<=|>=|<|>|=)?\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (m) {
          const x = Number(m[2]);
          return (
            Number.isFinite(v) && { '<': v < x, '>': v > x, '<=': v <= x, '>=': v >= x, '=': v === x }[m[1] || '=']
          );
        }
      }
      return String(v ?? '')
        .toLocaleLowerCase()
        .includes(q.toLocaleLowerCase());
    }
    orderRows(records) {
      const ordering = this.sorts.map((s) => ({ ...s, column: this.col(s.field) }));
      if (ordering.length)
        records.sort((a, b) => {
          for (const { field, dir, column } of ordering) {
            const x = a[field],
              y = b[field];
            const cmp = column?.sortCompareFunction
              ? column.sortCompareFunction(a, b, column)
              : typeof x === 'number' && typeof y === 'number'
                ? x - y
                : String(x ?? '').localeCompare(String(y ?? ''), this.lang, { numeric: true });
            if (cmp) return dir * cmp;
          }
          return 0;
        });
      return records;
    }
    model(expandFrom) {
      this.source = this.rows.filter(
        (r) =>
          (this.searchBehavior === 'highlight' ||
            !this.query ||
            this.baseCols.some((c) =>
              String(r[c.field] ?? '')
                .toLocaleLowerCase()
                .includes(this.query),
            )) &&
          this.baseCols.every((c) => !this.filters.has(c.field) || this.matches(r, c, this.filters.get(c.field))),
      );
      this.orderRows(this.source);
      let cols = this.baseCols.filter((c) => !c.hidden),
        records = this.source;
      if (this.collapsedBands.has('Monthly breakdown')) {
        const first = cols.findIndex((c) => c.group === 'Monthly breakdown');
        if (first >= 0) {
          cols = cols.filter((c) => c.group !== 'Monthly breakdown');
          cols.splice(first, 0, {
            field: '_trend',
            label: 'Winning trends',
            group: 'Monthly breakdown',
            kind: 'trend',
            width: 160,
          });
        }
      }
      if (this.pivot) {
        const buckets = new Map(),
          groups = new Map();
        const measures = this.values.length ? this.values : [{ field: '_key', op: 'count' }];
        for (const r of records) {
          const rowPath = this.groups.map((k) => r[k]),
            axis = this.axes.map((k) => r[k]),
            g = JSON.stringify(rowPath),
            a = JSON.stringify(axis);
          if (!buckets.has(a)) buckets.set(a, { axis, key: 'p' + buckets.size });
          if (!groups.has(g))
            groups.set(g, {
              _groupKey: g,
              _key: 'pivot' + g,
              _label: rowPath.join(' / ') || 'All records',
              _rows: [],
              bins: new Map(),
            });
          const group = groups.get(g);
          group._rows.push(r);
          if (!group.bins.has(a)) group.bins.set(a, []);
          group.bins.get(a).push(r);
        }
        cols = [
          { field: '_label', label: this.groups.map((k) => this.col(k).label).join(' / ') || 'Group', width: 170 },
        ];
        for (const [a, b] of buckets)
          measures.forEach(({ field, op }, i) =>
            cols.push({
              field: b.key + 'm' + i,
              label: (this.col(field)?.label || 'Records') + ' · ' + op,
              group: b.axis.join(' / ') || 'Values',
              width: 145,
              type: 'number',
              bucket: a,
            }),
          );
        records = [...groups.values()];
        for (const g of records)
          for (const [a, b] of buckets)
            measures.forEach(({ field, op }, i) => {
              g[b.key + 'm' + i] = aggregate(g.bins.get(a) || [], field, op);
            });
      } else if (this.groups.length) {
        this.leafLabelColumn = this.baseCols.find(c => c.rowLabel && !c.hidden);
        this.treeColumn.width = Math.max(220, this.groups.length * 16 + 130);
        cols = [this.treeColumn, ...cols.filter(c => !this.groups.includes(c.field))];
        const flat = [];
        const walk = (rows, depth, path, expandDescendants) => {
          if (depth === this.groups.length) {
            for (const r of rows) flat.push(r);
            return;
          }
          const field = this.groups[depth];
          const column = this.col(field);
          const bins = new Map();
          for (const r of rows) {
            const v = column.kind === 'pin' ? this.pinned.has(r._key) : r[field] ?? '';
            if (!bins.has(v)) bins.set(v, []);
            bins.get(v).push(r);
          }
          const entries = [...bins];
          const order = this.sorts.find(s => s.field === field);
          if (order) entries.sort(([a, ar], [b, br]) => order.dir * (column.sortCompareFunction
            ? column.sortCompareFunction(ar[0], br[0], column)
            : typeof a === 'number' && typeof b === 'number' ? a - b
            : String(a).localeCompare(String(b), this.lang, { numeric: true })));
          for (const [v, items] of entries) {
            const next = [...path, [field, v]],
              key = JSON.stringify(next);
            const node = { _key: 'group' + key, _groupKey: key, _label: String(v) || this.t('(Blanks)'), _rows: items, _depth: depth };
            for (const m of this.values) node[m.field] = aggregate(items, m.field, m.op);
            flat.push(node);
            const expand = expandDescendants || key === expandFrom;
            if (expand) this.openGroups.add(key);
            if (this.openGroups.has(key)) walk(items, depth + 1, next, expand);
          }
        };
        walk(records, 0, [], expandFrom === null);
        records = flat;
      }
      if (this.pivot && this.pivotSort) {
        const { field, dir } = this.pivotSort;
        records.sort(
          (a, b) =>
            (typeof a[field] === 'number' && typeof b[field] === 'number'
              ? a[field] - b[field]
              : String(a[field] ?? '').localeCompare(String(b[field] ?? ''), this.lang, { numeric: true })) * dir,
        );
      }
      this.cols = [
        ...cols.filter((c) => c.pin === 'left'),
        ...cols.filter((c) => !c.pin),
        ...cols.filter((c) => c.pin === 'right'),
      ];
      this.recordCount = records.length;
      this.allRecords = records;
      this.pinRows = this.groups.length || this.pivot ? [] : records.filter((r) => this.pinned.has(r._key));
      const free = this.pinRows.length ? records.filter((r) => !this.pinned.has(r._key)) : records;
      this.page = Math.min(this.page, Math.max(0, Math.ceil(free.length / this.pageSize) - 1));
      this.list = this.paged ? free.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize) : free;
      this.visible = [...this.pinRows, ...this.list];
      if (
        (this.active && (!this.visible[this.active.r] || !this.cols[this.active.c])) ||
        (this.anchor && (!this.visible[this.anchor.r] || !this.cols[this.anchor.c]))
      )
        this.anchor = this.active = null;
      this.content.style.height = this.list.length * this.rowHeight + 'px';
      this.port.setAttribute('role', this.groups.length && !this.pivot ? 'treegrid' : 'grid');
      this.port.setAttribute('aria-rowcount', this.visible.length + 3);
      this.port.setAttribute('aria-colcount', this.cols.length + 2);
    }
    col(key) {
      return this.baseCols.find((c) => c.field === key);
    }
    resetPosition() {
      this.page = 0;
      this.port.scrollTop = 0;
      this.anchor = this.active = null;
    }
    refreshData() {
      this.model();
      this.drawTotals();
      this.paintRows();
      this.footer();
    }
    toolbar() {
      this.bar.replaceChildren();
      const menuButton = (name, options) => {
        const b = button(this.t(name), () => this.menu(b, options()));
        this.bar.append(b);
      };
      menuButton('File', () => [
        ['Import from', ['CSV', 'JSON'].map((f) => ['Import ' + f, () => this.importFile(f)])],
        ['Export as', ['CSV', 'JSON', 'XLSX', 'PDF', 'PNG'].map((f) => ['Export ' + f, () => this.exportFile(f)])],
        [
          'Localization',
          ['English', 'German'].map((n, i) => [
            n,
            () => {
              this.lang = i ? 'de' : 'en';
              this.redraw();
            },
          ]),
        ],
      ]);
      menuButton('Edit', () => [
        [
          'Add row',
          () =>
            this.insert(this.active && !this.visible[this.active.r]?._rows ? this.visible[this.active.r] : null),
        ],
        [
          'Delete row',
          () => this.removeRows(new Set([this.visible[this.active.r]._key])),
          !this.active || !!this.visible[this.active.r]?._rows,
        ],
        ['Delete selected rows', () => this.removeRows(this.selected), !this.selected.size],
        ['Undo', () => this.history(false), !this.undoStack.length],
        ['Redo', () => this.history(true), !this.redoStack.length],
        ['Copy range', () => this.clipCopy(), !this.active],
        ['Paste range', () => this.clipPaste(), !this.active],
        ['Chart range', () => this.chart(), !this.active],
      ]);
      menuButton('View', () => [
        [
          'Show',
          ['Column filters', 'Resizer', 'Totals', 'Pagination'].map((n, i) => {
            const k = ['showFilters', 'resize', 'totals', 'paged'][i];
            return [
              (this[k] ? '✓ ' : '') + this.t(n),
              () => {
                this[k] = !this[k];
                this.resetPosition();
                this.redraw();
              },
            ];
          }),
        ],
        [
          'Tooltip',
          ['Cell data', 'Row summary', 'Off'].map((n) => [
            'Tooltip · ' + this.t(n),
            () => {
              this.tip = n;
              this.paintRows();
            },
          ]),
        ],
        [
          'Theme',
          [
            'Colibri',
            'Light',
            'Dark',
            'Light contrast',
            'Dark contrast',
            'Marine',
            'Quartz',
            'Alpine',
            'Balham',
            'Material',
          ].map((skin) => ['Theme · ' + this.t(skin), () => this.setTheme(skin)]),
        ],
        [
          'Clear filters',
          () => {
            this.query = '';
            this.filters.clear();
            this.resetPosition();
            this.redraw();
          },
        ],
      ]);
      const search = el('input', 'wb-search');
      search.type = 'search';
      search.placeholder = this.t('Search records');
      search.setAttribute('aria-label', search.placeholder);
      search.value = this.query;
      search.oninput = () => {
        this.query = search.value.toLocaleLowerCase();
        this.resetPosition();
        this.refreshData();
      };
      this.bar.append(search);
      for (const name of ['Columns', 'Filters']) {
        const b = button(this.t(name), () => {
          this.panel = this.panel === name ? '' : name;
          this.toolbar();
          this.sidebar();
        });
        b.setAttribute('aria-pressed', this.panel === name);
        this.bar.append(b);
      }
    }
    setTheme(skin) {
      const mode = skin === 'Colibri'
        ? document.documentElement.dataset.kitMode
        : skin.includes('Dark') || skin === 'Marine' ? 'dark' : 'light';
      this.root.dataset.theme = mode || 'light';
      this.root.dataset.skin = skin.includes('contrast') ? 'contrast' : skin.toLowerCase();
      cells.event(this, 'themeChange', { skin, theme: this.root.dataset.theme, style: this.root.dataset.skin });
    }
    drop(node, kind, fn) {
      node.ondragover = (e) => {
        if (this.drag?.kind === kind) {
          e.preventDefault();
          node.classList.add('wb-over');
        }
      };
      node.ondragleave = () => node.classList.remove('wb-over');
      node.ondrop = (e) => {
        node.classList.remove('wb-over');
        if (this.drag?.kind !== kind) return;
        e.preventDefault();
        e.stopPropagation();
        const value = this.drag.value;
        this.drag = null;
        fn(value);
      };
    }
    draggable(node, kind, value) {
      node.draggable = true;
      node.ondragstart = (e) => {
        this.drag = { kind, value };
        e.dataTransfer.setData('text/plain', String(value));
        e.dataTransfer.effectAllowed = 'move';
      };
      node.ondragend = () => {
        this.groupbar.classList.remove('wb-over');
        this.groupbar.querySelector('[data-insert]')?.removeAttribute('data-insert');
        this.drag = null;
      };
    }
    addField(zone, field) {
      if (zone === 'values') {
        if (!this.values.some((m) => m.field === field))
          this.values.push({ field, op: this.col(field)?.type === 'number' ? 'sum' : 'count' });
      } else if (!this[zone].includes(field)) this[zone].push(field);
      this.resetPosition();
      this.redraw();
    }
    setGroupOrder(fields) {
      this.groups = fields;
      this.resetPosition();
      this.redraw();
    }
    focusGroup(field) {
      (field && this.groupbar.querySelector('[data-group-field="' + CSS.escape(field) + '"] button') || this.port).focus({ preventScroll: true });
    }
    setGroupsExpanded(expanded, group = null) {
      const key = group?._groupKey ?? null;
      if (!expanded && group) {
        // Keys encode complete JSON paths. Match only children of this exact path.
        const childPrefix = key.slice(0, -1) + ',';
        for (const open of this.openGroups) {
          if (open === key || open.startsWith(childPrefix)) this.openGroups.delete(open);
        }
      } else if (!expanded) this.openGroups.clear();
      if (!group) this.resetPosition();
      this.redraw(expanded ? key : undefined);
      const control = group
        ? this.content.querySelector('[data-id="' + CSS.escape(group._key) + '"] .wb-branch-menu')
        : this.groupbar.querySelector('[data-expand="' + expanded + '"]');
      control?.focus({ preventScroll: true });
    }
    groupZone() {
      const label = this.t('Group by');
      this.groupbar.setAttribute('role', 'group');
      this.groupbar.setAttribute('aria-label', label);
      this.groupbar.replaceChildren(el('strong', '', label));
      if (!this.groups.length) this.groupbar.append(el('span', 'wb-hint', this.t('Drop columns to group rows')));
      this.groups.forEach((field, index) => {
        const name = this.t(this.col(field).label);
        const chip = el('span', 'wb-group-chip');
        chip.dataset.groupField = field;
        this.draggable(chip, 'group', field);
        const sort = this.sorts.find(s => s.field === field);
        const sortName = this.t(sort?.dir === 1 ? 'Sort descending' : 'Sort ascending') + ' · ' + name;
        const title = this.pivot ? el('span', '', name) : button(name, () => {
          this.sort(this.col(field), sort?.dir === 1 ? -1 : 1, true);
          this.focusGroup(field);
        }, sortName);
        if (!this.pivot) title.append(el('span', 'wb-group-sort', sort ? (sort.dir === 1 ? '↑' : '↓') : '↕'));
        chip.append(title, button('×', () => {
          this.setGroupOrder(this.groups.filter(f => f !== field));
          this.focusGroup(this.groups[Math.min(index, this.groups.length - 1)]);
        }, this.t('Remove group') + ' ' + name));
        chip.onkeydown = e => {
          if (!e.altKey || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
          e.preventDefault();
          const dest = index + (e.key === 'ArrowLeft' ? -1 : 1);
          if (dest < 0 || dest >= this.groups.length) return;
          const fields = this.groups.slice();
          [fields[index], fields[dest]] = [fields[dest], fields[index]];
          this.setGroupOrder(fields);
          this.focusGroup(field);
        };
        if (index) this.groupbar.append(el('span', 'wb-group-separator', '›'));
        this.groupbar.append(chip);
      });
      if (this.groups.length && !this.pivot) {
        const actions = el('span', 'wb-group-actions');
        for (const [label, expanded] of [['Expand all', true], ['Collapse all', false]]) {
          const control = button(this.t(label), () => this.setGroupsExpanded(expanded));
          control.dataset.expand = expanded;
          actions.append(control);
        }
        this.groupbar.append(actions);
      }
      const accepts = () => ['col', 'group'].includes(this.drag?.kind);
      const placement = e => {
        const chip = e.target.closest('[data-group-field]');
        if (!chip) return {};
        const bounds = chip.getBoundingClientRect();
        return { chip, after: e.clientX >= bounds.left + bounds.width / 2 };
      };
      const clear = () => {
        this.groupbar.classList.remove('wb-over');
        this.groupbar.querySelector('[data-insert]')?.removeAttribute('data-insert');
      };
      this.groupbar.ondragover = e => {
        if (!accepts()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        clear();
        this.groupbar.classList.add('wb-over');
        const { chip, after } = placement(e);
        if (chip) chip.dataset.insert = after ? 'after' : 'before';
      };
      this.groupbar.ondragleave = e => {
        if (!this.groupbar.contains(e.relatedTarget)) clear();
      };
      this.groupbar.ondrop = e => {
        if (!accepts()) return;
        e.preventDefault();
        const { chip, after } = placement(e);
        const field = this.drag.value;
        this.drag = null;
        clear();
        if (chip?.dataset.groupField === field) return;
        const fields = this.groups.filter(f => f !== field);
        const index = chip ? fields.indexOf(chip.dataset.groupField) + Number(after) : fields.length;
        fields.splice(index, 0, field);
        this.setGroupOrder(fields);
      };
    }
    numberFilter(target, column, apply) {
      this.closeMenu();
      this.trigger = target;
      const box = el('form', 'wb-popup wb-rule-filter');
      box.setAttribute('aria-label', 'Number filter ' + column.label);
      this.root.append(box);
      this.popup = box;
      const current = this.filters.get(column.field);
      const operators = [
        'Equals',
        'Does not equal',
        'Greater than',
        'Greater than or equal',
        'Less than',
        'Less than or equal',
        'In range',
        'Blank',
        'Not blank',
      ];
      const read = [];
      const logic = select(
        [
          ['AND', 'AND'],
          ['OR', 'OR'],
        ],
        current?.join || 'AND',
        () => {},
        'Combine conditions',
      );
      for (let i = 0; i < 2; i++) {
        const saved = current?.rules?.[i],
          row = el('div', 'wb-rule');
        const input = (label, value) => {
          const n = el('input');
          n.type = 'number';
          n.step = 'any';
          n.value = value ?? '';
          n.setAttribute('aria-label', label + ' ' + (i + 1));
          return n;
        };
        const a = input('Filter value', saved?.a),
          b = input('Through', saved?.b);
        const sync = () => {
          a.hidden = !op.value || ['Blank', 'Not blank'].includes(op.value);
          b.hidden = op.value !== 'In range';
          a.required = !a.hidden;
          b.required = !b.hidden;
        };
        const entries = operators.map((k) => [k, k]);
        if (i) entries.unshift(['', 'None']);
        const op = select(entries, saved?.op || (i ? '' : 'Equals'), sync, 'Condition ' + (i + 1));
        if (i) box.append(logic);
        row.append(op, a, b);
        box.append(row);
        sync();
        read.push(() => op.value && { op: op.value, a: a.valueAsNumber, b: b.valueAsNumber });
      }
      const commit = el('button', '', 'Apply');
      commit.type = 'submit';
      const reset = button('Reset', () => {
        apply('');
        this.closeMenu();
      });
      box.append(commit, reset);
      box.onsubmit = (e) => {
        e.preventDefault();
        const rules = read.map((fn) => fn()).filter(Boolean);
        const summary = rules
          .map((r) => r.op + (!Number.isFinite(r.a) ? '' : ' ' + r.a) + (r.op === 'In range' ? ' – ' + r.b : ''))
          .join(' ' + logic.value + ' ');
        apply({ rules, join: logic.value, summary });
        this.closeMenu();
      };
      const r = target.getBoundingClientRect();
      box.style.left = Math.max(0, Math.min(innerWidth - box.offsetWidth, r.left)) + 'px';
      box.style.top = Math.max(0, Math.min(innerHeight - box.offsetHeight, r.bottom)) + 'px';
      box.querySelector('select').focus();
    }
    filterControl(c) {
      let n;
      const current = this.filters.get(c.field);
      const caption = (v) => {
        if (!v) return 'All ▾';
        if (c.type === 'date') return [v.start, v.end].filter(Boolean).join(' – ') || 'All ▾';
        return [...(v.set || []), v.text || ''].filter(Boolean).join(', ') || 'All ▾';
      };
      const apply = (v) => {
        const empty =
          !v || (typeof v === 'object' && !v.text && !v.start && !v.end && !v.set?.length && !v.rules?.length);
        if (empty) this.filters.delete(c.field);
        else this.filters.set(c.field, v);
        this.resetPosition();
        this.refreshData();
        for (const input of this.root.querySelectorAll('[data-filter]'))
          if (input.dataset.filter === c.field) {
            if (input.tagName === 'BUTTON') input.textContent = caption(empty ? null : v);
            else if (input !== n || typeof v === 'object' || !v) input.value = v?.summary || v;
          }
      };
      if (c.options || c.type === 'date') {
        n = button(caption(current), () => {
          this.closeMenu();
          this.trigger = n;
          const box = el('div', 'wb-popup');
          this.root.append(box);
          this.popup = box;
          const state = { ...(this.filters.get(c.field) || {}) };
          if (c.type === 'date') {
            for (const [key, label] of [
              ['start', 'From'],
              ['end', 'Through'],
            ]) {
              const field = el('label', 'wb-field', label),
                input = el('input');
              input.type = 'date';
              input.value = state[key] || '';
              input.onchange = () => {
                state[key] = input.value;
                apply({ ...state });
              };
              field.append(input);
              box.append(field);
            }
          } else {
            const search = el('input');
            search.type = 'search';
            search.placeholder = 'Contains…';
            search.value = state.text || '';
            search.setAttribute('aria-label', 'Contains ' + c.label);
            search.oninput = () => {
              state.text = search.value;
              apply({ ...state });
            };
            box.append(search);
            for (const v of c.options)
              box.append(
                check(v, (state.set || []).includes(v), (on) => {
                  const set = new Set(state.set || []);
                  if (on) set.add(v);
                  else set.delete(v);
                  state.set = [...set];
                  apply({ ...state });
                }),
              );
          }
          box.append(
            button('Reset', () => {
              apply('');
              this.closeMenu();
            }),
          );
          const r = n.getBoundingClientRect();
          box.style.left = Math.max(0, Math.min(innerWidth - box.offsetWidth, r.left)) + 'px';
          box.style.top = Math.max(0, Math.min(innerHeight - box.offsetHeight, r.bottom)) + 'px';
        });
      } else {
        n = el('input');
        n.type = 'search';
        n.placeholder = c.type === 'number' ? '=, >, <' : 'Filter…';
        n.value = current?.summary || current || '';
        n.oninput = () => apply(n.value);
      }
      n.dataset.filter = c.field;
      n.setAttribute('aria-label', 'Filter ' + this.t(c.label));
      if (c.type === 'number' && !c.options) {
        const group = el('div', 'wb-number-filter');
        const more = button('≡', () => this.numberFilter(more, c, apply), 'Number filter ' + c.label);
        group.append(n, more);
        return group;
      }
      return n;
    }
    sidebar() {
      this.side.replaceChildren();
      this.side.hidden = !this.panel;
      if (!this.panel) return;
      const title = el('div', 'wb-side-title');
      title.append(
        el('strong', '', this.t(this.panel)),
        button(
          '×',
          () => {
            this.panel = '';
            this.toolbar();
            this.sidebar();
          },
          'Close panel',
        ),
      );
      this.side.append(title);
      if (this.panel === 'Filters') {
        for (const c of this.baseCols) {
          const label = el('label', 'wb-field', this.t(c.label));
          label.append(this.filterControl(c));
          this.side.append(label);
        }
        return;
      }
      this.side.append(
        check(this.t('Pivot mode'), this.pivot, (on) => {
          this.pivot = on;
          this.resetPosition();
          this.redraw();
        }),
      );
      const search = el('input', 'wb-find');
      search.type = 'search';
      search.placeholder = this.t('Search columns');
      search.setAttribute('aria-label', search.placeholder);
      this.side.append(search);
      const tree = el('div', 'wb-tree');
      this.side.append(tree);
      const drawTree = () => {
        tree.replaceChildren();
        const matches = this.baseCols.filter((c) =>
          this.t(c.label).toLowerCase().includes(search.value.toLowerCase()),
        );
        for (const group of new Set(matches.map((c) => c.group || 'Fields'))) {
          const section = el('details');
          section.open = true;
          const summary = el('summary');
          const members = matches.filter((c) => (c.group || 'Fields') === group);
          const fieldToggle = check(
            this.t(group),
            members.every((c) => !c.hidden),
            (on) => {
              if (!on && this.baseCols.every((c) => c.hidden || members.includes(c))) {
                this.sidebar();
                return;
              }
              members.forEach((c) => {
                c.hidden = !on;
              });
              this.resetPosition();
              this.redraw();
            },
          );
          fieldToggle.querySelector('input').indeterminate =
            members.some((c) => c.hidden) && members.some((c) => !c.hidden);
          summary.append(fieldToggle);
          section.append(summary);
          for (const c of matches.filter((c) => (c.group || 'Fields') === group)) {
            const field = check(this.t(c.label), !c.hidden, (on) => {
              if (!on && this.baseCols.filter((k) => !k.hidden).length === 1) {
                this.sidebar();
                return;
              }
              c.hidden = !on;
              this.resetPosition();
              this.redraw();
            });
            this.draggable(field, 'col', c.field);
            section.append(field);
          }
          tree.append(section);
        }
      };
      search.oninput = drawTree;
      drawTree();
      for (const [zone, name] of [
        ['groups', 'Row groups'],
        ['values', 'Values'],
        ['axes', 'Pivot columns'],
      ]) {
        const block = el('section', 'wb-zone');
        block.append(el('strong', '', this.t(name)));
        const entries = this[zone];
        entries.forEach((item, i) => {
          const f = zone === 'values' ? item.field : item;
          const line = el('div', 'wb-zone-line');
          line.append(el('span', '', this.t(this.col(f).label)));
          if (zone === 'values')
            line.append(
              select(
                ['sum', 'mean', 'min', 'max', 'count'].map((v) => [v, v]),
                item.op,
                (v) => {
                  item.op = v;
                  this.redraw();
                },
                'Aggregation ' + f,
              ),
            );
          line.append(
            button(
              '×',
              () => {
                entries.splice(i, 1);
                this.redraw();
              },
              'Remove ' + name + ' ' + f,
            ),
          );
          block.append(line);
        });
        const options = this.baseCols.filter((c) => !entries.some((x) => (x.field || x) === c.field));
        block.append(
          select(
            [['', '+ ' + this.t(name)], ...options.map((c) => [c.field, this.t(c.label)])],
            '',
            (v) => {
              if (v) this.addField(zone, v);
            },
            'Add ' + name,
          ),
        );
        this.drop(block, 'col', (f) => this.addField(zone, f));
        this.side.append(block);
      }
    }
    pinStyle(node, c) {
      if (!c.pin) return;
      node.classList.add('wb-frozen');
      const i = this.cols.indexOf(c);
      if (c.pin === 'left')
        node.style.left =
          82 +
          sum(
            this.cols
              .slice(0, i)
              .filter((x) => x.pin === 'left')
              .map((x) => x.width),
          ) +
          'px';
      else
        node.style.right =
          44 +
          sum(
            this.cols
              .slice(i + 1)
              .filter((x) => x.pin === 'right')
              .map((x) => x.width),
          ) +
          'px';
    }
    headers() {
      this.headerPool.recycle();
      this.head.replaceChildren();
      const template = '82px ' + this.cols.map((c) => c.width + 'px').join(' ') + ' 44px';
      this.sheet.style.setProperty('--wb-tracks', template);
      this.sheet.style.width = 126 + sum(this.cols.map((c) => c.width)) + 'px';
      const groups = el('div', 'wb-line wb-band');
      groups.append(el('span', 'wb-rail'));
      let last = null,
        cell,
        span = 0;
      this.cols.forEach((c) => {
        const group = c.group || 'Fields';
        if (last !== group) {
          cell = el('strong', '', c === this.treeColumn ? '' : this.t(group));
          if (group === 'Monthly breakdown' && !this.pivot) {
            const collapsed = this.collapsedBands.has(group);
            cell.append(
              button(
                collapsed ? '▸' : '▾',
                () => {
                  if (collapsed) this.collapsedBands.delete(group);
                  else this.collapsedBands.add(group);
                  this.resetPosition();
                  this.redraw();
                },
                collapsed ? 'Expand monthly breakdown' : 'Collapse monthly breakdown',
              ),
            );
          }
          groups.append(cell);
          last = group;
          span = 0;
        }
        cell.style.gridColumn = 'span ' + ++span;
      });
      groups.append(el('span', 'wb-actions'));
      this.head.append(groups);
      const row = el('div', 'wb-line wb-titles');
      row.setAttribute('role', 'row');
      const rail = el('div', 'wb-rail');
      rail.append(
        check('', this.source.length > 0 && this.source.every((r) => this.selected.has(r._key)), (on) => {
          for (const r of this.source)
            if (on) this.selected.add(r._key);
            else this.selected.delete(r._key);
          this.paintRows();
          this.footer();
        }),
        el('span', '', '#'),
      );
      rail.querySelector('input').setAttribute('aria-label', this.t('Select all'));
      row.append(rail);
      const filters = el('div', 'wb-line wb-filters');
      filters.append(el('span', 'wb-rail'));
      for (const c of this.cols) {
        const h = el('div', 'wb-title');
        h.setAttribute('role', 'columnheader');
        if (c.type === 'number') h.classList.add('wb-number-title');
        this.pinStyle(h, c);
        if (c === this.treeColumn) {
          h.classList.add('wb-tree-title');
          h.textContent = this.t('Group');
          row.append(h);
          const blank = el('div');
          this.pinStyle(blank, c);
          filters.append(blank);
          continue;
        }
        const order = this.pivot
          ? this.pivotSort?.field === c.field
            ? this.pivotSort
            : null
          : this.sorts.find((x) => x.field === c.field);
        const title = button(
          this.t(c.label) + (order ? (order.dir === 1 ? ' ↑' : ' ↓') : ''),
          (e) => this.sort(c, order?.dir === 1 ? -1 : 1, e.shiftKey),
          this.t(c.label),
        );
        h.append(title);
        if (c.headerRenderer)
          this.headerPool.attach(
            title,
            c.headerRenderer,
            cells.context(this, null, c, -1, this.cols.indexOf(c), this.t(c.label), { sortDirection: order?.dir }),
          );
        if (!this.pivot && this.col(c.field)) {
          this.draggable(title, 'col', c.field);
          this.drop(h, 'col', (f) => this.moveCol(f, c.field));
        }
        const more = button('⋮', () => this.columnMenu(more, c), 'Options ' + c.label);
        h.append(more);
        if (this.resize) {
          const grip = el('span', 'wb-resize');
          grip.title = 'Resize ' + c.label;
          grip.onpointerdown = (e) => {
            e.preventDefault();
            grip.setPointerCapture(e.pointerId);
            const x = e.clientX,
              w = c.width;
            grip.onpointermove = (ev) => {
              c.width = Math.max(80, w + ev.clientX - x);
              const widths = this.cols.map((col) => col.width);
              this.sheet.style.setProperty(
                '--wb-tracks',
                '82px ' + widths.map((w) => w + 'px').join(' ') + ' 44px',
              );
              this.sheet.style.width = 126 + sum(widths) + 'px';
            };
            grip.onpointerup = () => {
              grip.onpointermove = null;
              this.headers();
              this.paintRows();
            };
          };
          h.append(grip);
        }
        row.append(h);
        const fc = el('div');
        this.pinStyle(fc, c);
        if (!this.pivot && this.col(c.field)) fc.append(this.filterControl(c));
        filters.append(fc);
      }
      row.append(el('span', 'wb-actions', '⋯'));
      filters.append(el('span', 'wb-actions'));
      this.headerPool.trim();
      this.head.append(row);
      if (this.showFilters && !this.pivot) this.head.append(filters);
    }
    sort(c, dir, append = false) {
      if (this.pivot) {
        this.pivotSort = { field: c.field, dir };
        this.resetPosition();
        this.redraw();
        return;
      }
      this.sorts = append ? this.sorts.filter((s) => s.field !== c.field) : [];
      this.sorts.push({ field: c.field, dir });
      this.resetPosition();
      this.redraw();
    }
    moveCol(from, to) {
      if (from === to) return;
      const a = this.col(from),
        b = this.col(to);
      if (!a || !b) return;
      const dest = this.baseCols.indexOf(b);
      this.baseCols.splice(this.baseCols.indexOf(a), 1);
      this.baseCols.splice(dest, 0, a);
      a.pin = b.pin;
      this.redraw();
    }
    autosize(columns) {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = getComputedStyle(this.root).font;
      const records = this.visible.slice(
        Math.floor(this.port.scrollTop / this.rowHeight),
        Math.floor(this.port.scrollTop / this.rowHeight) + Math.ceil(this.port.clientHeight / this.rowHeight) + 2,
      );
      for (const c of columns) {
        const widths = records.map((r) => ctx.measureText(this.display(r, c)).width + 22);
        c.width = Math.ceil(Math.max(80, ctx.measureText(this.t(c.label)).width + 40, ...widths));
      }
      this.redraw();
    }
    columnMenu(target, c) {
      const i = this.baseCols.indexOf(c);
      const items = [
        ['Sort ascending', () => this.sort(c, 1)],
        ['Sort descending', () => this.sort(c, -1)],
      ];
      if (i >= 0)
        items.push(
          [
            'Clear sort',
            () => {
              this.sorts = this.sorts.filter((s) => s.field !== c.field);
              this.redraw();
            },
          ],
          ...[
            ['Pin left', 'left'],
            ['Pin right', 'right'],
            ['Unpin', null],
          ].map(([n, p]) => [
            n,
            () => {
              c.pin = p;
              this.redraw();
            },
          ]),
          ['Autosize this column', () => this.autosize([c])],
          ['Autosize all columns', () => this.autosize(this.cols)],
          [
            'Choose columns',
            () => {
              this.panel = 'Columns';
              this.toolbar();
              this.sidebar();
            },
          ],
          [
            'Reset columns',
            () => {
              this.baseCols = this.initialColumns.map((c) => ({ ...c }));
              this.sorts = [];
              this.groups = [];
              this.axes = [];
              this.values = [];
              this.pivot = false;
              this.resetPosition();
              this.redraw();
            },
          ],
          ['Move left', () => this.moveCol(c.field, this.baseCols[i - 1].field), i === 0],
          ['Move right', () => this.moveCol(c.field, this.baseCols[i + 1].field), i === this.baseCols.length - 1],
          [
            'Hide column',
            () => {
              c.hidden = true;
              this.redraw();
            },
            this.cols.length < 2,
          ],
          ['Delete column', () => this.deleteColumn(c), this.baseCols.length < 2],
          ['Group by', () => this.addField('groups', c.field)],
        );
      this.menu(target, items);
    }
    deleteColumn(c) {
      this.baseCols = this.baseCols.filter((x) => x !== c);
      for (const k of ['groups', 'axes']) this[k] = this[k].filter((f) => f !== c.field);
      this.values = this.values.filter((m) => m.field !== c.field);
      this.sorts = this.sorts.filter((s) => s.field !== c.field);
      this.filters.delete(c.field);
      if (this.baseCols.every((x) => x.hidden)) this.baseCols[0].hidden = false;
      this.resetPosition();
      this.redraw();
    }
    paintRows() {
      this.renderPool.recycle();
      const first = Math.max(0, Math.floor(this.port.scrollTop / this.rowHeight) - 4);
      const end = Math.min(this.list.length, first + Math.ceil(this.port.clientHeight / this.rowHeight) + 9);
      const fragment = document.createDocumentFragment();
      for (let i = first; i < end; i++) {
        const row = this.row(this.list[i], i + this.pinRows.length);
        row.style.top = i * this.rowHeight + 'px';
        fragment.append(row);
      }
      this.content.replaceChildren(fragment);
      this.pinBody.replaceChildren(...this.pinRows.map((r, i) => this.row(r, i)));
      this.pinBody.style.top = this.head.offsetHeight + 'px';
      this.renderPool.trim();
      this.positionEditor();
    }
    display(r, c) {
      if (c === this.treeColumn && !r._rows) {
        const label = this.leafLabelColumn && this.display(r, this.leafLabelColumn);
        return label || String(r._key);
      }
      if (c.labelFunction) return String(c.labelFunction(r, c) ?? '');
      const v = r[c.field];
      if (v == null) return '';
      if (c.kind === 'money')
        return new Intl.NumberFormat(this.lang, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(v);
      if (c.kind === 'rating') return '★'.repeat(Math.max(0, Math.min(5, Number(v) || 0)));
      if (c.type === 'number') return v.toLocaleString(this.lang);
      if (c.type === 'date' && /^\d{4}-\d\d-\d\d$/.test(v))
        return new Date(v + 'T12:00:00').toLocaleDateString(this.lang);
      return String(v);
    }
    row(r, i) {
      const line = el('div', 'wb-line wb-row');
      line.dataset.id = r._key;
      line.setAttribute('role', 'row');
      line.setAttribute('aria-rowindex', i + 3);
      line.setAttribute('aria-selected', this.selected.has(r._key));
      if (
        this.searchBehavior === 'highlight' &&
        this.query &&
        this.baseCols.some(
          (c) =>
            (!this.searchFields || this.searchFields.includes(c.field)) &&
            String(r[c.field] ?? '')
              .toLocaleLowerCase()
              .includes(this.query),
        )
      )
        line.dataset.match = '';
      if (this.selected.has(r._key)) line.dataset.selected = '';
      const rail = el('div', 'wb-rail');
      if (!r._rows) {
        const handle = el('span', 'wb-grip', '⠿');
        handle.title = 'Drag row';
        this.draggable(handle, 'row', r._key);
        rail.append(handle);
        const box = check('', this.selected.has(r._key), (on) => {
          if (on) this.selected.add(r._key);
          else this.selected.delete(r._key);
          this.headers();
          this.paintRows();
          this.footer();
        });
        box.querySelector('input').setAttribute('aria-label', 'Select row ' + (i + 1));
        rail.append(box);
        this.drop(line, 'row', (id) => this.reorderRows(id, r._key));
      }
      rail.append(el('span', '', String(i + 1 + (this.paged ? this.page * this.pageSize : 0))));
      line.append(rail);
      for (let j = 0; j < this.cols.length; j++) {
        const c = this.cols[j];
        const cell = el('div', 'wb-cell');
        cell.setAttribute('role', 'gridcell');
        cell.dataset.cell = '';
        cell.dataset.field = c.field;
        cell.setAttribute('aria-readonly', String(!c.editable || !!r._rows || c.field === this.dataProvider?.key));
        cell.dataset.r = i;
        cell.dataset.c = j;
        this.pinStyle(cell, c);
        if (c === this.treeColumn) {
          const depth = r._rows ? r._depth : this.groups.length;
          line.setAttribute('aria-level', depth + 1);
          if (r._rows) line.setAttribute('aria-expanded', this.openGroups.has(r._groupKey));
          cell.classList.add('wb-tree-cell');
          cell.style.setProperty('--wb-tree-indent', depth * 16 + 'px');
          if (!r._rows) cell.classList.add('wb-tree-leaf');
        }
        if (c.type === 'number') cell.classList.add('wb-num');
        const val = r[c.field],
          text = this.display(r, c);
        const ctx = cells.context(this, r, c, i, j, (c.flags?.[val] ? c.flags[val] + '  ' : '') + text, {
          selected: this.selected.has(r._key) || !!this.within(i, j),
          active: i === this.active?.r && j === this.active?.c,
        });
        const defaultRenderer =
          r._rows && c === this.treeColumn
            ? renderers.group
            : (!r._rows && (renderers[c.kind] || renderers[c.type])) || cells.text;
        const cellFactory = r._rows ? defaultRenderer : c.itemRendererFunction?.(r, c) ?? c.itemRenderer ?? defaultRenderer;
        ctx.commit = (value) =>
          this.renderPool.active.get(cell)?.item.data === r && this.commitRenderer(r, c, value);
        this.renderPool.attach(cell, cellFactory, ctx);
        if (c === this.treeColumn && r._rows) {
          const more = button('⋯', () => this.menu(more, [
            ['Expand this branch', () => this.setGroupsExpanded(true, r)],
            ['Collapse this branch', () => this.setGroupsExpanded(false, r)],
          ]), this.t('Group actions') + ' · ' + text);
          more.className = 'wb-branch-menu';
          more.setAttribute('aria-haspopup', 'menu');
          cell.append(more);
        }
        if (c.heat && Number.isFinite(val))
          cell.style.background =
            'color-mix(in srgb, var(--wb-heat) ' +
            Math.max(8, Math.min(76, Math.round(val / 1400))) +
            '%, var(--ui-card))';
        if (this.tip !== 'Off')
          cell.title =
            this.tip === 'Cell data'
              ? text
              : this.cols.map((k) => this.t(k.label) + ': ' + this.display(r, k)).join('\n');
        if (this.within(i, j)) cell.dataset.range = '';
        if (i === this.active?.r && j === this.active?.c) cell.dataset.active = '';
        cell.onpointerdown = (e) => {
          if (e.button !== 0 || e.target.closest('button,input')) return;
          this.choose(i, j, e.shiftKey);
          this.dragRange = true;
          this.port.focus({ preventScroll: true });
        };
        cell.onpointerenter = (e) => {
          if (e.buttons === 1 && (this.dragRange || this.fillStart)) {
            this.active = { r: i, c: j };
            this.highlight();
          }
        };
        cell.ondblclick = () => this.editCell(i, j);
        if (this.active?.r === i && this.active?.c === j && !r._rows) {
          const grip = el('span', 'wb-fill');
          grip.title = 'Drag to fill range';
          grip.onpointerdown = (e) => {
            e.stopPropagation();
            this.fillStart = this.bounds();
          };
          cell.append(grip);
        }
        line.append(cell);
      }
      const actions = el('div', 'wb-actions');
      if (!r._rows) {
        const b = button('⋮', () => this.rowMenu(b, r), 'Row actions ' + (i + 1));
        actions.append(b);
      }
      line.append(actions);
      return line;
    }
    pinRow(r) {
      if (this.pinned.has(r._key)) this.pinned.delete(r._key);
      else this.pinned.add(r._key);
      this.resetPosition();
      this.redraw();
    }
    rowActions(row) {
      return [
        ['Insert above', () => this.insert(row)],
        ['Insert below', () => this.insert(row, true)],
        [
          'Clear row',
          () =>
            this.write(
              this.baseCols
                .filter((c) => c.editable)
                .map((c) => [row, c, c.type === 'boolean' ? false : c.type === 'number' ? 0 : null]),
            ),
        ],
        ['Delete row', () => this.removeRows(new Set([row._key]))],
      ];
    }
    rowMenu(target, row) {
      this.menu(target, [
        ...this.rowActions(row),
        [this.pinned.has(row._key) ? 'Unpin row' : 'Pin row', () => this.pinRow(row)],
      ]);
    }
    observeProvider(provider) {
      this.providerLife?.abort();
      this.dataProvider = provider;
      if (!provider) return;
      this.providerLife = new AbortController();
      provider.addEventListener(
        'collectionChange',
        (e) => {
          if (e.detail.origin === this) return;
          this.discardEditor('collectionChange');
          this.rows = provider.source.map((r) => ({ ...r, _key: r[provider.key] }));
          this.undoStack = [];
          this.redoStack = [];
          const keys = new Set(this.rows.map((r) => r._key));
          this.selected = new Set([...this.selected].filter((k) => keys.has(k)));
          this.pinned = new Set([...this.pinned].filter((k) => keys.has(k)));
          this.redraw();
        },
        { signal: this.providerLife.signal },
      );
    }
    setDataProvider(provider, columns = this.baseCols) {
      this.replaceData(columns, provider.source);
      this.observeProvider(provider);
      this.rows = provider.source.map((row) => ({ ...row, _key: row[provider.key] }));
      this.redraw();
    }
    publish(rows) {
      if (!this.dataProvider) return rows;
      const records = rows.map(({ _key, ...record }) => record);
      this.dataProvider.replaceAll(records, this);
      return this.dataProvider instanceof ColibriGrid.ListCollectionView
        ? this.dataProvider.source.map((r) => ({ ...r, _key: r[this.dataProvider.key] }))
        : rows;
    }
    recordChange(before, after, previousSorts) {
      const view = this.dataProvider instanceof ColibriGrid.ListCollectionView;
      const previous = view ? this.dataProvider.collection.source : before;
      this.rows = this.publish(after);
      this.undoStack.push([previous, view ? this.dataProvider.collection.source : after, previousSorts]);
      if (this.undoStack.length > 50) this.undoStack.shift();
      this.redoStack = [];
      this.redraw();
      this.host.dispatchEvent(new CustomEvent('colibri-rows-change', { detail: { rows: after }, bubbles: true }));
    }
    history(redo) {
      const source = redo ? this.redoStack : this.undoStack,
        entry = source.pop();
      if (!entry) return;
      (redo ? this.undoStack : this.redoStack).push(entry);
      if (entry[2]) this.sorts = redo ? [] : entry[2];
      if (this.dataProvider instanceof ColibriGrid.ListCollectionView) {
        this.dataProvider.collection.replaceAll(entry[redo ? 1 : 0], this);
        this.rows = this.dataProvider.source.map((r) => ({ ...r, _key: r[this.dataProvider.key] }));
      } else this.rows = this.publish(entry[redo ? 1 : 0]);
      this.redraw();
      this.host.dispatchEvent(
        new CustomEvent('colibri-rows-change', { detail: { rows: this.rows }, bubbles: true }),
      );
    }
    insert(r, below = false) {
      const previousSorts = this.sorts.length ? this.sorts.slice() : undefined;
      const list = this.orderRows(this.rows.slice());
      const index = r ? list.findIndex((row) => row._key === r._key) + Number(below) : 0;
      const added = { _key: this.nextId++ };
      for (const c of this.baseCols)
        added[c.field] = c.type === 'number' ? 0 : c.type === 'boolean' ? false : c.options?.[0] || '';
      if (this.dataProvider) {
        added._key = this.dataProvider.createKey();
        added[this.dataProvider.key] = added._key;
      }
      list.splice(index, 0, added);
      this.sorts = [];
      this.recordChange(this.rows, list, previousSorts);
    }
    removeRows(keys) {
      this.recordChange(
        this.rows,
        this.rows.filter((r) => !keys.has(r._key)),
      );
      this.selected = new Set([...this.selected].filter((id) => !keys.has(id)));
      this.redraw();
    }
    reorderRows(from, to) {
      if (from === to) return;
      const ids = this.selected.has(from) ? this.selected : new Set([from]);
      if (ids.has(to)) return;
      const moving = this.rows.filter((r) => ids.has(r._key));
      const rest = this.rows.filter((r) => !ids.has(r._key));
      rest.splice(
        rest.findIndex((r) => r._key === to),
        0,
        ...moving,
      );
      this.sorts = [];
      this.recordChange(this.rows, rest);
    }
    parseValue(r, c, input) {
      let v = input;
      if (v != null && c.type === 'number') {
        v = Number(v);
        if (!Number.isFinite(v) || (c.kind === 'rating' && (v < 0 || v > 5 || !Number.isInteger(v))))
          throw Error('Invalid ' + c.label);
      }
      if (v != null && c.type === 'boolean') v = v === true || /^(true|yes|1)$/i.test(String(v));
      if (
        v &&
        c.options &&
        !(c.kind === 'team'
          ? String(v)
              .split(',')
              .every((n) => c.options.includes(n.trim()))
          : c.options.includes(String(v)))
      )
        throw Error('Invalid ' + c.label);
      if (v && c.type === 'date' && !/^\d{4}-\d\d-\d\d$/.test(v)) throw Error('Use YYYY-MM-DD');
      const valid = (c.validator || c.validate)?.(v, r, c);
      if (valid === false || (typeof valid === 'string' && valid)) throw Error(valid || 'Invalid ' + c.label);
      return v;
    }
    write(changes) {
      const updated = new Map();
      for (const [r, c, input] of changes) {
        if (!r || r._rows || !c?.editable || this.dataProvider?.key === c.field) continue;
        const v = this.parseValue(r, c, input);
        updated.set(r._key, { ...(updated.get(r._key) || r), [c.field]: v });
      }
      if (updated.size)
        this.recordChange(
          this.rows,
          this.rows.map((r) => updated.get(r._key) || r),
        );
    }
    commitRenderer(row, column, value) {
      if (!column.editable || this.dataProvider?.key === column.field) return false;
      const detail = { data: row, column, oldValue: row[column.field], value };
      if (!cells.event(this, 'itemEditBeginning', detail, true)) return false;
      cells.event(this, 'itemEditBegin', detail);
      if (!cells.event(this, 'itemEditEnd', detail, true)) {
        cells.event(this, 'itemEditCancel', detail);
        return false;
      }
      try {
        this.write([[row, column, detail.value]]);
        cells.event(this, 'itemEditSave', detail);
        return true;
      } catch (error) {
        this.notice(error.message);
        cells.event(this, 'itemEditCancel', detail);
        return false;
      }
    }
    editCell(i, j) {
      return this.startItemEditorSession(i, j);
    }
    startItemEditorSession(i, j) {
      const row = this.visible[i],
        column = this.cols[j];
      if (!row || !column) return false;
      if (row._rows) {
        if (this.pivot) this.details(row, column);
        return false;
      }
      if (!column.editable || this.dataProvider?.key === column.field) return false;
      if (this.session && !this.endItemEditorSession()) return false;
      const cell = this.root.querySelector('[data-r="' + i + '"][data-c="' + j + '"]');
      if (!cell) return false;
      const ctx = cells.context(this, row, column, i, j, this.display(row, column), {
        itemRenderer: this.renderPool.active.get(cell)?.item,
      });
      if (
        column.rendererIsEditor ||
        (column.type === 'boolean' && !column.itemEditor && !column.itemEditorFunction)
      ) {
        const item = ctx.itemRenderer;
        (item?.focusTarget || item?.element)?.focus();
        return true;
      }
      if (!cells.event(this, 'itemEditBeginning', ctx, true)) return false;
      const selected =
        column.itemEditorFunction?.(row, column) ??
        column.itemEditor ??
        (column.kind === 'team' ? teamEditor : column.options ? choiceEditor : cells.input);
      const editor = cells.create(selected);
      const layer = el('div', 'wb-editor');
      this.sheet.append(layer);
      layer.append(editor.element);
      Object.assign(editor, ctx);
      const scope = new AbortController();
      this.session = { editor, layer, ctx, key: row._key, scope };
      this.positionEditor();
      editor.initialize?.();
      editor.prepare?.();
      editor.element.setAttribute('aria-label', 'Edit ' + column.label);
      const focus =
        editor.focusTarget || editor.element.querySelector('input,select,textarea,button') || editor.element;
      layer.addEventListener('input', () => {
        focus.removeAttribute('aria-invalid');
        focus.removeAttribute('aria-errormessage');
        layer.querySelector('.wb-edit-error')?.remove();
      });
      focus.focus();
      if (focus.type !== 'checkbox') focus.select?.();
      const outside = e => {
        if (layer.contains(e.target)) return;
        if ((e.type === 'pointerdown' || e.detail === 0) && this.endItemEditorSession(false, 'blur')) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        focus.focus({preventScroll: true});
      };
      for (const type of ['pointerdown', 'click'])
        document.addEventListener(type, outside, {capture: true, signal: scope.signal});
      layer.onkeydown = (e) => {
        if (e.isComposing || e.defaultPrevented) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          this.endItemEditorSession(true);
        } else if (
          (e.key === 'Enter' && e.target.tagName !== 'BUTTON') ||
          (e.key === 'Tab' && (editor instanceof TeamEditor || !editor.element.querySelector('button')))
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (this.endItemEditorSession() && e.key === 'Tab') this.editNextCell(i, j, e.shiftKey);
        }
      };
      layer.onfocusout = (e) => {
        if (e.relatedTarget && !layer.contains(e.relatedTarget) && this.session?.editor === editor)
          this.endItemEditorSession(false, 'blur');
      };
      cells.event(this, 'itemEditBegin', { ...ctx, editor });
      return true;
    }
    editNextCell(i, j, backward) {
      const step = backward ? -1 : 1,
        width = this.cols.length;
      for (let at = i * width + j + step; at >= 0 && at < width * this.visible.length; at += step) {
        const r = Math.floor(at / width),
          c = at % width;
        if (!this.cols[c].editable || this.cols[c].field === this.dataProvider?.key || this.visible[r]._rows)
          continue;
        this.choose(r, c);
        if (r >= this.pinRows.length && !this.port.querySelector('[data-r="' + r + '"]')) {
          this.port.scrollTop = (r - this.pinRows.length) * this.rowHeight;
          this.paintRows();
        }
        this.port.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        this.startItemEditorSession(r, c);
        return true;
      }
      return false;
    }
    get itemEditorInstance() {
      return this.session?.editor ?? null;
    }
    positionEditor() {
      const s = this.session;
      if (!s) return;
      const cell = this.port.querySelector(
        '[data-r="' + s.ctx.rowIndex + '"][data-c="' + s.ctx.columnIndex + '"]',
      );
      if (!cell) {
        this.discardEditor('offscreen');
        return;
      }
      s.editor.itemRenderer = this.renderPool.active.get(cell)?.item;
      const box = cell.getBoundingClientRect(),
        port = this.port.getBoundingClientRect();
      const sheet = this.sheet.getBoundingClientRect();
      s.layer.style.left = box.left - sheet.left + 'px';
      s.layer.style.top = box.top - sheet.top + 'px';
      s.layer.style.height = box.height + 'px';
      s.layer.style.width = box.width + 'px';
      if (s.editor instanceof TeamEditor || s.editor instanceof ChoiceEditor) {
        const below = Math.min(port.bottom, innerHeight) - box.bottom;
        const above = box.top - Math.max(this.head.getBoundingClientRect().bottom, port.top, 0);
        const up = below < 180 && above > below;
        s.layer.toggleAttribute('data-up', up);
        s.layer.style.setProperty('--wb-options-height', Math.max(0, Math.min(220, (up ? above : below) - 4)) + 'px');
        const width = Math.min(Math.max(182, box.width), port.width);
        const left = Math.max(port.left, Math.min(port.right - width, box.left));
        s.layer.style.setProperty('--wb-options-width', width + 'px');
        s.layer.style.setProperty('--wb-options-left', left - box.left + 'px');
      }
    }
    discardEditor(reason) {
      const s = this.session;
      if (!s) return;
      this.session = null;
      s.scope.abort();
      s.layer.onfocusout = null;
      try {
        s.editor.discard?.(reason);
        s.editor.destroy?.();
      } finally {
        s.layer.remove();
      }
      if (reason !== 'save') cells.event(this, 'itemEditCancel', { ...s.ctx, reason });
    }
    endItemEditorSession(cancel = false, reason = 'commit') {
      const s = this.session;
      if (!s) return true;
      if (cancel) {
        this.discardEditor('cancel');
        this.port.focus({ preventScroll: true });
        return true;
      }
      const { editor, ctx } = s;
      const c = ctx.column;
      try {
        const valid = editor.validate?.();
        if (valid === false || (typeof valid === 'string' && valid)) throw Error(valid || 'Invalid value');
        if (editor.save?.() === false) return false;
        const key = c.editorDataField ?? ('editedValue' in editor ? 'editedValue' : 'value');
        const detail = {
          ...ctx,
          editor,
          oldValue: ctx.value,
          value: key in editor ? editor[key] : editor.element[key],
          reason,
        };
        if (!cells.event(this, 'itemEditEnd', detail, true)) return false;
        // Suspend focus handlers during the synchronous collection update and repaint.
        this.session = null;
        try {
          this.write([[ctx.data, c, detail.value]]);
        } catch (error) {
          this.session = s;
          throw error;
        }
        this.session = s;
        this.discardEditor('save');
        cells.event(this, 'itemEditSave', detail);
        if (reason !== 'blur') this.port.focus({ preventScroll: true });
        return true;
      } catch (error) {
        const focus = editor.focusTarget || editor.element;
        let message = s.layer.querySelector('.wb-edit-error');
        if (!message) {
          message = el('output', 'wb-edit-error');
          message.setAttribute('role', 'alert');
          message.id = 'edit-error-' + crypto.randomUUID();
          s.layer.append(message);
        }
        message.textContent = error.message;
        focus.setAttribute('aria-invalid', 'true');
        focus.setAttribute('aria-errormessage', message.id);
        focus.focus({preventScroll:true});
        return false;
      }
    }
    updateHandle() {
      this.port.querySelectorAll('.wb-fill').forEach((grip) => grip.remove());
      if (!this.active || this.visible[this.active.r]?._rows) return;
      const cell = this.port.querySelector('[data-active]');
      if (cell) {
        const grip = el('span', 'wb-fill');
        grip.title = 'Drag to fill range';
        grip.onpointerdown = (e) => {
          e.stopPropagation();
          this.fillStart = this.bounds();
        };
        cell.append(grip);
      }
    }
    bounds() {
      if (!this.active || !this.anchor) return null;
      return {
        top: Math.min(this.anchor.r, this.active.r),
        bottom: Math.max(this.anchor.r, this.active.r),
        left: Math.min(this.anchor.c, this.active.c),
        right: Math.max(this.anchor.c, this.active.c),
      };
    }
    within(r, c) {
      const b = this.bounds();
      return b && r >= b.top && r <= b.bottom && c >= b.left && c <= b.right;
    }
    choose(r, c, extend = false) {
      if (!this.visible[r] || !this.cols[c]) return;
      const detail = { data: this.visible[r], column: this.cols[c], rowIndex: r, columnIndex: c, extend };
      if (!cells.event(this, 'selectionChanging', detail, true)) return;
      this.active = { r, c };
      if (!extend || !this.anchor) this.anchor = { r, c };
      this.highlight();
      cells.event(this, 'selectionChange', { ...detail, range: this.bounds() });
    }
    highlight() {
      for (const cell of this.port.querySelectorAll('[data-cell]')) {
        const r = +cell.dataset.r,
          c = +cell.dataset.c;
        cell.toggleAttribute('data-range', !!this.within(r, c));
        cell.toggleAttribute('data-active', r === this.active?.r && c === this.active?.c);
      }
      for (const [host, { item }] of this.renderPool.active) {
        if (!host.hasAttribute('data-cell')) continue;
        const selected = host.hasAttribute('data-range') || this.selected.has(item.data._key),
          active = host.hasAttribute('data-active');
        if (item.selected !== selected || item.active !== active) {
          item.selected = selected;
          item.active = active;
          item.setCurrentState?.(active ? 'active' : selected ? 'selected' : 'normal');
          item.prepare?.(true);
        }
      }
      this.footer();
    }
    range() {
      const b = this.bounds();
      if (!b) return [];
      return this.visible
        .slice(b.top, b.bottom + 1)
        .map((r) => this.cols.slice(b.left, b.right + 1).map((c) => r[c.field] ?? ''));
    }
    copyRows(headers) {
      const data = this.range(),
        bounds = this.bounds();
      if (headers && bounds) {
        const cols = this.cols.slice(bounds.left, bounds.right + 1);
        data.unshift(cols.map((c) => this.t(c.label)));
        if (headers === 'groups')
          data.unshift(cols.map((c, i) => (!i || c.group !== cols[i - 1].group ? this.t(c.group || '') : '')));
      }
      return data;
    }
    copyText(headers) {
      return ColibriGrid.files.delimited(this.copyRows(headers), '\t');
    }
    async clipCopy(headers, cut = false) {
      try {
        const bounds = this.bounds();
        const changes = [];
        if (cut && bounds) {
          for (let r = bounds.top; r <= bounds.bottom; r++)
            for (let c = bounds.left; c <= bounds.right; c++) changes.push([this.visible[r], this.cols[c], null]);
        }
        await ColibriGrid.delimited.copy(this.copyRows(headers));
        if (changes.length) this.write(changes);
      } catch {
        this.notice('Use Ctrl/Cmd+C on the selected cells.');
      }
    }
    async clipPaste() {
      try {
        this.paste(await ColibriGrid.delimited.paste());
      } catch {
        this.notice('Use Ctrl/Cmd+V on the selected cells.');
      }
    }
    paste(text) {
      if (!this.active) return;
      try {
        const matrix = Array.isArray(text) ? text : ColibriGrid.files.parse(text, '\t');
        const b = this.bounds(),
          changes = [];
        matrix.forEach((line, y) =>
          line.forEach((v, x) => changes.push([this.visible[b.top + y], this.cols[b.left + x], v])),
        );
        this.write(changes);
      } catch (e) {
        this.notice(e.message);
      }
    }
    fill() {
      const from = this.fillStart,
        to = this.bounds();
      this.fillStart = null;
      if (!from || !to) return;
      const changes = [];
      for (let r = to.top; r <= to.bottom; r++)
        for (let c = to.left; c <= to.right; c++) {
          if (r >= from.top && r <= from.bottom && c >= from.left && c <= from.right) continue;
          const h = from.bottom - from.top + 1,
            w = from.right - from.left + 1;
          const src = this.visible[from.top + ((((r - from.top) % h) + h) % h)],
            col = this.cols[from.left + ((((c - from.left) % w) + w) % w)];
          changes.push([this.visible[r], this.cols[c], src[col.field]]);
        }
      try {
        this.write(changes);
      } catch (e) {
        this.notice(e.message);
      }
    }
    key(e) {
      if (e.target !== this.port) {
        const cell = e.target.closest('[data-r][data-c]');
        if (cell && e.key === 'Tab' && e.target.matches('[role=radio], input[type=checkbox]')) {
          if (this.editNextCell(Number(cell.dataset.r), Number(cell.dataset.c), e.shiftKey)) e.preventDefault();
        } else if (cell && e.key === 'Escape') this.port.focus({preventScroll:true});
        return;
      }
      const cmd = e.ctrlKey || e.metaKey;
      if (cmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.history(e.shiftKey);
        return;
      }
      if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.history(true);
        return;
      }
      if (!this.visible.length) return;
      let r = this.active?.r || 0,
        c = this.active?.c || 0;
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        this.editCell(r, c);
        return;
      }
      if (cmd && ['d', 'r'].includes(e.key.toLowerCase()) && this.active) {
        const b = this.bounds(),
          down = e.key.toLowerCase() === 'd';
        if (down ? b.bottom > b.top : b.right > b.left) {
          e.preventDefault();
          this.fillStart = down ? { ...b, bottom: b.top } : { ...b, right: b.left };
          this.fill();
          return;
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const b = this.bounds();
        if (b) {
          e.preventDefault();
          const values = [];
          for (let i = b.top; i <= b.bottom; i++)
            for (let j = b.left; j <= b.right; j++) values.push([this.visible[i], this.cols[j], null]);
          this.write(values);
        }
        return;
      }
      if (e.key === 'ArrowDown') r++;
      else if (e.key === 'ArrowUp') r--;
      else if (e.key === 'ArrowRight') c++;
      else if (e.key === 'ArrowLeft') c--;
      else if (e.key === 'Home') {
        c = 0;
        if (cmd) r = 0;
      } else if (e.key === 'End') {
        c = this.cols.length - 1;
        if (cmd) r = this.visible.length - 1;
      } else if (e.key === 'PageDown') r += Math.max(1, Math.floor(this.port.clientHeight / this.rowHeight) - 3);
      else if (e.key === 'PageUp') r -= Math.max(1, Math.floor(this.port.clientHeight / this.rowHeight) - 3);
      else return;
      e.preventDefault();
      r = Math.max(0, Math.min(r, this.visible.length - 1));
      c = Math.max(0, Math.min(c, this.cols.length - 1));
      const top = (r - this.pinRows.length) * this.rowHeight;
      if (top < this.port.scrollTop) this.port.scrollTop = Math.max(0, top);
      else if (top > this.port.scrollTop + this.port.clientHeight - this.head.offsetHeight - this.rowHeight)
        this.port.scrollTop = top;
      this.choose(r, c, e.shiftKey);
      this.paintRows();
      this.port.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    cellMenu(cell, row) {
      this.menu(cell, [
        ...(!row._rows ? this.rowActions(row) : []),
        ['Cut', () => this.clipCopy(null, true)],
        ['Copy', () => this.clipCopy()],
        ['Copy with Headers', () => this.clipCopy('columns')],
        ['Copy with Group Headers', () => this.clipCopy('groups')],
        ['Paste', () => this.clipPaste()],
        [
          'Chart range',
          Object.entries(chartFamilies).map(([family, variants]) => [
            family,
            variants.map((variant) => [variant, () => this.chart(family, variant)]),
          ]),
        ],
        ['Export', ['CSV', 'XLSX'].map((format) => [format, () => this.exportFile(format)])],
        ['Edit cell', () => this.editCell(+cell.dataset.r, +cell.dataset.c), cell.getAttribute('aria-readonly') === 'true'],
      ]);
    }
    dialog(title, modal = true) {
      const d = el('dialog', 'wb-dialog');
      const header = el('header');
      header.append(
        el('h2', '', title),
        button('×', () => d.close(), 'Close'),
      );
      d.append(header);
      this.root.append(d);
      d.onclose = () => d.remove();
      if (modal) d.showModal();
      else d.show();
      return d;
    }
    details(r, c) {
      const rows = c.bucket ? r.bins.get(c.bucket) || [] : r._rows;
      const d = this.dialog(r._label + ' · ' + rows.length.toLocaleString() + ' records');
      const host = el('div');
      d.append(host);
      const sub = new ColibriGrid(host, {
        editorPresentation: 'inline',
        label: 'Contributing records',
        key: '_key',
        rows,
        columns: this.baseCols.filter((k) => k.kind !== 'pin').map((k) => ({ ...k, editable: false })),
      });
      d.addEventListener('close', () => sub.destroy());
    }
    async chart(family = 'Column', variant = 'Grouped') {
      const bounds = this.bounds();
      if (!bounds) return;
      const rows = this.range(),
        columns = this.cols.slice(bounds.left, bounds.right + 1);
      if (!columns.some((c, i) => c.type === 'number' || rows.some((r) => Number.isFinite(r[i])))) {
        this.notice('Select a range containing a numeric column.');
        return;
      }
      const dialog = this.dialog('Chart selected cells', false);
      dialog.classList.add('wb-chart-dialog');
      const titleBar = dialog.querySelector('header'),
        heading = titleBar.querySelector('h2');
      const maximize = button(
        '⛶',
        () => {
          dialog.classList.toggle('wb-maximized');
          maximize.setAttribute('aria-pressed', String(dialog.classList.contains('wb-maximized')));
        },
        'Maximize',
      );
      titleBar.insertBefore(maximize, titleBar.lastElementChild);
      heading.onpointerdown = (event) => {
        if (dialog.classList.contains('wb-maximized')) return;
        const bounds = dialog.getBoundingClientRect(),
          dx = event.clientX - bounds.left,
          dy = event.clientY - bounds.top;
        heading.setPointerCapture(event.pointerId);
        heading.onpointermove = (e) => {
          dialog.style.margin = '0';
          dialog.style.setProperty('--chart-left', Math.max(0, Math.min(innerWidth - dialog.offsetWidth, e.clientX - dx)) + 'px');
          dialog.style.setProperty('--chart-top', Math.max(0, Math.min(innerHeight - 45, e.clientY - dy)) + 'px');
        };
        heading.onpointerup = () => {
          heading.onpointermove = null;
        };
      };
      const host = el('div', 'wb-chart');
      const choices = Object.entries(chartFamilies).flatMap(([f, types]) =>
        types.map((v) => ({ id: f === v ? f : f + ' · ' + v, family: f, variant: v })),
      );
      const initial = choices.find((c) => c.family === family && c.variant === variant);
      let selected = initial,
        instance,
        linked = true,
        snapshot = rows;
      const enabled = new Set(columns.map((c, i) => i)),
        style = {},
        rowKeys = this.visible.slice(bounds.top, bounds.bottom + 1).map((r) => r._key);
      const source = this.dataProvider;
      const bar = el('div', 'wb-chart-tools'),
        panel = el('section', 'wb-chart-settings');
      const nav = el('div', 'wb-chart-tools');
      panel.hidden = true;
      const draw = () => {
        if (!instance) return;
        const indices = [...enabled].sort((a, b) => a - b);
        const selectedRows = snapshot.map((r) => indices.map((i) => r[i]));
        instance.draw(
          selected.family,
          selected.variant,
          indices.map((i) => columns[i]),
          selectedRows,
          style,
        );
        nav.hidden = !instance.zoomable();
      };
      const update = () => {
        if (!linked || this.dataProvider !== source) return;
        const keys = new Set(rowKeys),
          map = new Map();
        for (const r of this.allRecords) if (keys.has(r._key)) map.set(r._key, r);
        snapshot = rowKeys.filter((k) => map.has(k)).map((k) => columns.map((c) => map.get(k)[c.field] ?? null));
        draw();
      };
      const picker = select(
        choices.map((c) => [c.id, c.id]),
        initial.id,
        (id) => {
          selected = choices.find((c) => c.id === id);
          draw();
        },
        'Chart type',
      );
      const edit = () => {
        panel.replaceChildren();
        panel.hidden = false;
        for (const [i, c] of columns.entries())
          panel.append(
            check(c.label, enabled.has(i), (on) => {
              if (on) enabled.add(i);
              else enabled.delete(i);
              if (
                ![...enabled].some((j) => columns[j].type === 'number' || rows.some((r) => Number.isFinite(r[j])))
              ) {
                enabled.add(i);
                edit();
                return;
              }
              draw();
            }),
          );
      };
      const format = () => {
        panel.replaceChildren();
        panel.hidden = false;
        for (const [key, label] of [
          ['title', 'Chart title'],
          ['xTitle', 'Horizontal axis title'],
          ['yTitle', 'Vertical axis title'],
        ]) {
          const field = el('label', 'wb-field', label),
            input = el('input');
          input.value = style[key] || '';
          input.oninput = () => {
            style[key] = input.value;
            draw();
          };
          field.append(input);
          panel.append(field);
        }
        panel.append(
          check('Show legend', !!style.legend, (value) => {
            style.legend = value;
            draw();
          }),
        );
      };
      const advanced = () => {
        panel.replaceChildren();
        panel.hidden = false;
        for (const [key, label, defaultValue] of [
          ['navigator', 'Navigator', false],
          ['zoom', 'Zoom', true],
          ['selecting', 'Selecting', false],
          ['scrolling', 'Scrolling', true],
          ['animation', 'Animation', false],
          ['crosshair', 'Crosshair', false],
          ['labels', 'Crosshair label', true],
          ['snap', 'Snap to node', false],
        ]) {
          panel.append(
            check(label, style[key] ?? defaultValue, (on) => {
              style[key] = on;
              draw();
            }),
          );
        }
        for (const [key, label, min, max, defaultValue] of [
          ['step', 'Scrolling step (%)', 1, 100, 15],
          ['duration', 'Duration (ms)', 0, 5000, 300],
        ]) {
          const field = el('label', 'wb-field', label),
            input = el('input');
          input.type = 'number';
          input.min = min;
          input.max = max;
          input.value = style[key] ?? defaultValue;
          input.onchange = () => {
            if (input.reportValidity()) {
              style[key] = input.valueAsNumber;
              draw();
            }
          };
          field.append(input);
          panel.append(field);
        }
        const field = el('label', 'wb-field', 'Crosshair color'),
          input = el('input');
        input.type = 'color';
        input.value = style.color || '#707374';
        input.oninput = () => {
          style.color = input.value;
          draw();
        };
        field.append(input);
        panel.append(field);
      };
      const download = () => {
        const a = el('a');
        a.href = instance.image();
        a.download = 'chart.png';
        a.click();
      };
      const menu = button('Menu', () =>
        this.menu(menu, [
          ['Edit Chart', edit],
          ['Format Chart', format],
          ['Advanced Settings', advanced],
          [
            linked ? 'Unlink from Grid' : 'Link to Grid',
            () => {
              linked = !linked;
              if (linked) update();
            },
          ],
          ['Download Chart', download],
        ]),
      );
      for (const [name, icon] of [
        ['Zoom out', '−'],
        ['Zoom in', '+'],
        ['Pan left', '←'],
        ['Pan right', '→'],
        ['Reset the zoom', '↺'],
      ]) {
        nav.append(
          button(
            icon,
            () => {
              instance.navigate(name);
            },
            name,
          ),
        );
      }
      const save = button('Download chart PNG', download);
      const life = new AbortController();
      const signal = life.signal;
      this.host.addEventListener('colibri-rows-change', update, { signal });
      source?.addEventListener(
        'collectionChange',
        (event) => {
          if (event.detail.origin !== this) update();
        },
        { signal },
      );
      this.life.signal.addEventListener('abort', () => dialog.close(), { signal });
      dialog.addEventListener(
        'close',
        () => {
          life.abort();
          instance?.destroy();
        },
        { once: true },
      );
      picker.disabled = menu.disabled = save.disabled = true;
      nav.hidden = true;
      bar.append(picker, nav, menu);
      dialog.append(bar, panel, host, save);
      try {
        const { mount } = await import(chartModule.href);
        instance = await mount(host, family, variant, columns, rows, this.root.dataset.theme);
        if (!instance) return;
        if (!dialog.open) {
          instance.destroy();
          return;
        }
        picker.disabled = menu.disabled = save.disabled = false;
        draw();
      } catch (error) {
        host.textContent = 'Chart could not be drawn. ' + error.message;
      }
    }
    notice(text) {
      this.status = text;
      this.footer();
    }
    drawTotals() {
      this.summary.replaceChildren();
      if (!this.totals) return;
      const line = (label, rows) => {
        const bar = el('div', 'wb-line wb-total');
        bar.setAttribute('aria-label', label);
        bar.append(el('strong', 'wb-rail', label));
        for (const col of this.cols) {
          const cell = el('div', 'wb-cell wb-num');
          this.pinStyle(cell, col);
          if (col.type === 'number') {
            const total = aggregate(rows, col.field, 'sum');
            if (total !== null)
              cell.textContent =
                col.kind === 'money' ? this.display({ [col.field]: total }, col) : total.toLocaleString(this.lang);
          } else if (col.summary === 'count')
            cell.textContent = rows
              .reduce((n, r) => n + Number(r[col.field] != null && r[col.field] !== ''), 0)
              .toLocaleString(this.lang);
          cell.setAttribute('aria-label', label + ' ' + this.t(col.label));
          cell.dataset.summaryField = col.field;
          bar.append(cell);
        }
        bar.append(el('div', 'wb-actions'));
        this.summary.append(bar);
      };
      line(this.t('Total'), this.pivot ? this.allRecords : this.source);
      if (this.paged)
        line(
          this.t('Page total'),
          this.visible.filter((r) => !r._rows || this.pivot),
        );
    }
    footer() {
      const parts = [
        this.source.length.toLocaleString(this.lang) +
          ' / ' +
          this.rows.length.toLocaleString(this.lang) +
          ' ' +
          (this.lang === 'de' ? 'Zeilen' : 'rows'),
        this.selected.size + ' ' + (this.lang === 'de' ? 'ausgewählt' : 'selected'),
      ];
      if (this.active) {
        let n = 0,
          total = 0,
          min = Infinity,
          max = -Infinity;
        for (const row of this.range())
          for (const v of row)
            if (Number.isFinite(v)) {
              n++;
              total += v;
              min = Math.min(min, v);
              max = Math.max(max, v);
            }
        if (n)
          parts.push(
            'Count ' +
              n +
              ' · Σ ' +
              total.toLocaleString(this.lang) +
              ' · Avg ' +
              (total / n).toLocaleString(this.lang) +
              ' · Min ' +
              min.toLocaleString(this.lang) +
              ' · Max ' +
              max.toLocaleString(this.lang),
          );
      }
      this.foot.replaceChildren(el('span', '', parts.join('   ·   ')));
      if (this.status) this.foot.append(el('output', '', this.status));
      if (this.paged) {
        const count = this.recordCount - this.pinRows.length;
        const pages = Math.max(1, Math.ceil(count / this.pageSize));
        const pager = el('div', 'wb-pager');
        pager.setAttribute('role', 'group');
        pager.setAttribute('aria-label', this.t('Pagination'));
        const go = (index, action) => {
          this.page = index;
          this.port.scrollTop = 0;
          this.redraw();
          const control = this.foot.querySelector('[data-page-action="' + action + '"]');
          (control?.disabled ? this.foot.querySelector('.wb-page-number') : control)?.focus({ preventScroll: true });
        };
        const step = (glyph, label, index, action) => {
          const control = button(glyph, () => go(index, action), this.t(label));
          control.dataset.pageAction = action;
          control.disabled = index < 0 || index >= pages || index === this.page;
          return control;
        };
        const jump = el('input', 'wb-page-number');
        jump.type = 'number';
        jump.min = 1;
        jump.max = pages;
        jump.value = this.page + 1;
        jump.dataset.pageAction = 'jump';
        jump.setAttribute('aria-label', this.t('Page number'));
        const jumpToPage = () => {
          if (jump.reportValidity() && Number.isInteger(jump.valueAsNumber) && jump.valueAsNumber !== this.page + 1)
            go(jump.valueAsNumber - 1, 'jump');
        };
        jump.onchange = jumpToPage;
        jump.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            jumpToPage();
          }
        };
        const offset = this.page * this.pageSize;
        const grouped = this.groups.length > 0 || this.pivot;
        const format = value => value.toLocaleString(this.lang);
        let range = count
          ? [this.t(grouped ? 'Rows from' : 'Records from'), format(offset + 1), this.t('to'),
             format(offset + this.list.length), this.t('of'), format(count)].join(' ')
          : this.t(grouped ? '0 rows' : '0 records');
        if (this.pinRows.length) range += ' · ' + format(this.pinRows.length) + ' ' + this.t('pinned');
        const pageSize = select(
          [20, 25, 30, 40, 50, 100, 500].map(n => [n, n + ' ' + this.t('rows per page')]),
          this.pageSize,
          value => {
            this.pageSize = Number(value);
            go(0, 'size');
          },
          this.t('Rows per page'),
        );
        pageSize.dataset.pageAction = 'size';
        pager.append(
          step('«', 'First page', 0, 'first'),
          step('‹', 'Previous', this.page - 1, 'previous'),
          jump, el('span', '', '/ ' + format(pages)),
          step('›', 'Next', this.page + 1, 'next'),
          step('»', 'Last page', pages - 1, 'last'),
          el('span', 'wb-page-range', range), pageSize,
        );
        this.foot.prepend(pager);
      }
    }
    exportFile(format) {
      const rows = this.pivot ? this.allRecords : this.source;
      return ColibriGrid.files
        .save(
          format,
          this.cols.filter((c) => c.kind !== 'pin'),
          rows,
        )
        .catch((e) => this.notice(e.message));
    }
    importFile(format) {
      const input = el('input');
      input.type = 'file';
      input.accept = format === 'CSV' ? '.csv' : '.json';
      input.onchange = async () => {
        try {
          const text = await input.files[0].text();
          let fields, records;
          if (format === 'CSV') {
            const [header, ...data] = ColibriGrid.files.parse(text);
            fields = header;
            records = data.map((line) => {
              if (line.length !== header.length) throw Error('Column count differs from header');
              return Object.fromEntries(header.map((f, i) => [f, line[i]]));
            });
          } else {
            records = JSON.parse(text);
            if (!Array.isArray(records) || !records.every((r) => r && typeof r === 'object' && !Array.isArray(r)))
              throw Error('Expected an array of records');
            fields = [...new Set(records.flatMap(Object.keys))];
          }
          if (
            !fields?.length ||
            new Set(fields).size !== fields.length ||
            fields.some((f) => !f || f.startsWith('_') || ['__proto__', 'prototype', 'constructor'].includes(f))
          )
            throw Error('Use unique, nonempty column names');
          // Retain renderers, editors, and validation when JSON belongs to the current schema.
          if (format === 'JSON' && fields.every((field) => this.col(field) || field === this.dataProvider?.key)) {
            const typed = records.map((record) =>
              Object.fromEntries(
                Object.entries(record).map(([field, value]) => {
                  const column = this.col(field);
                  return [field, column?.editable ? this.parseValue(record, column, value) : value];
                }),
              ),
            );
            this.replaceData(this.baseCols, typed);
            return;
          }
          const columns = fields.map((field) => {
            const examples = records.map((r) => r[field]).filter((v) => v != null && v !== '');
            const numeric =
              examples.length &&
              examples.every(
                (v) => typeof v === 'number' || (format === 'CSV' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v)),
              );
            return { field, label: field, type: numeric ? 'number' : 'text', editable: true, width: 145 };
          });
          const rows = records.map((r) =>
            Object.fromEntries(
              columns.map((c) => [
                c.field,
                c.type === 'number' && r[c.field] != null && r[c.field] !== '' ? Number(r[c.field]) : r[c.field],
              ]),
            ),
          );
          this.searchFields = null;
          this.replaceData(columns, rows);
        } catch (e) {
          this.notice('Import failed: ' + e.message);
        }
      };
      input.click();
    }
    replaceData(columns, rows) {
      for (const chart of this.root.querySelectorAll('.wb-chart-dialog[open]')) chart.close();
      this.discardEditor('replaceData');
      this.observeProvider(null);
      this.baseCols = columns.map((c) => ({ ...cells.normalizeColumn(c), width: c.width || 130 }));
      this.initialColumns = this.baseCols.map((c) => ({ ...c }));
      this.rows = rows.map((r, i) => ({ ...r, _key: i + 1 }));
      this.nextId = rows.length + 1;
      this.collapsedBands.clear();
      this.pivotSort = null;
      this.selected.clear();
      this.pinned.clear();
      this.groups = [];
      this.axes = [];
      this.values = [];
      this.filters.clear();
      this.openGroups.clear();
      this.sorts = [];
      this.query = '';
      this.status = '';
      this.pivot = false;
      this.undoStack = [];
      this.redoStack = [];
      this.resetPosition();
      this.redraw();
    }
  };
})();
