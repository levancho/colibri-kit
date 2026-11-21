/* Colibri Grid. Load colibri-ui.css and grid.css alongside this script. */
window.ColibriGrid = (() => {
  let sequence = 0;
  const height = 36;
  function element(tag, role, label) {
    const node = document.createElement(tag);
    if (role) node.setAttribute('role', role);
    if (label) node.setAttribute('aria-label', label);
    return node;
  }

  return class ColibriGrid {
    constructor(
      host,
      {
        columns,
        rows = [],
        dataProvider,
        key = 'id',
        label = 'Records',
        locale,
        readPage,
        onInspect,
        onActivate,
        rangeSelection,
        editorPresentation = 'dialog',
        pageSize = 100,
      },
    ) {
      columns = columns?.map(ColibriGrid.cells.normalizeColumn);
      this.host = host;
      this.inlineEditing = editorPresentation === 'inline';
      this.renderPool = new ColibriGrid.cells.RendererPool();
      this.headerPool = new ColibriGrid.cells.RendererPool();
      this.life = new AbortController();
      this.dataProvider = dataProvider;
      if (dataProvider) {
        if (readPage) throw TypeError('Choose dataProvider or readPage');
        key = dataProvider.key;
        rows = dataProvider.source;
        dataProvider.addEventListener(
          'collectionChange',
          (e) => {
            if (e.detail.origin !== this) this.setRows(dataProvider.source);
          },
          { signal: this.life.signal },
        );
      }
      if (!columns?.length || new Set(columns.map((c) => c.field)).size !== columns.length)
        throw new TypeError('Columns must have unique fields');
      this.columns = columns.map((c) => {
        if (c.type === 'uri' && !c.itemEditor) return { ...c, itemEditor: ColibriGrid.cells.uriEditor };
        if (c.type === 'image')
          return { ...c, editable: false, itemRenderer: c.itemRenderer ?? ColibriGrid.cells.images };
        if (c.type === 'protected' || c.type === 'drilldown') return { ...c, editable: false };
        if (c.type === 'boolean' && !c.itemRenderer)
          return {
            ...c,
            itemRenderer: ColibriGrid.cells.checkbox,
            rendererIsEditor: !c.itemEditor && !c.itemEditorFunction,
          };
        return { ...c };
      });
      this.key = key;
      this.onInspect = onInspect;
      this.onActivate = onActivate;
      this.conditions = [];
      this.numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
      this.readPage = readPage;
      this.pageSize = pageSize;
      this.offset = 0;
      if (readPage && (!Number.isSafeInteger(pageSize) || pageSize < 1)) throw new TypeError('Invalid page size');
      this.prefix = 'cg-' + ++sequence;
      this.collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
      this.column = 0;
      this.query = '';
      this.root = element('section');
      this.root.className = 'cg ui-root';
      this.search = element('input', null, 'Search ' + label);
      this.search.type = 'search';
      this.search.placeholder = 'Search records';
      this.count = element('output');
      this.count.setAttribute('aria-live', 'polite');
      const bar = element('div');
      bar.className = 'cg-bar';
      bar.append(this.search, this.count);
      if (!readPage) this.installFilters(bar);
      this.port = element('div', 'grid', label);
      this.port.className = 'cg-port';
      this.port.tabIndex = 0;
      this.port.setAttribute('aria-colcount', columns.length);
      const widths = columns.map((c) => (Number(c.width) > 0 ? Number(c.width) : 120));
      this.root.style.setProperty('--cg-columns', widths.map((w) => 'minmax(' + w + 'px,1fr)').join(' '));
      this.root.style.setProperty('--cg-min-width', widths.reduce((sum, w) => sum + w, 0) + 'px');
      this.header = element('div', 'row');
      this.header.className = 'cg-row cg-head';
      this.header.setAttribute('aria-rowindex', 1);
      this.columns.forEach((c, j) => {
        const head = element('div', 'columnheader');
        if (c.type === 'number') head.dataset.numeric = '';
        const button = element('button');
        button.type = 'button';
        button.textContent = c.label || c.field;
        button.onclick = () =>
          this.sort(c.field, this.order?.field === c.field && this.order.asc ? 'desc' : 'asc');
        if (c.headerRenderer)
          this.headerPool.attach(
            button,
            c.headerRenderer,
            ColibriGrid.cells.context(this, null, c, -1, j, c.label),
          );
        head.append(button);
        if (c.hasMenu ?? (!readPage && columns.some((c) => c.editable))) this.installColumnMenu(head, c);
        this.header.append(head);
      });
      this.canvas = element('div', 'rowgroup');
      this.canvas.className = 'cg-canvas';
      const sheet = element('div', 'presentation');
      sheet.className = 'cg-sheet';
      sheet.append(this.header, this.canvas);
      this.port.append(sheet);
      this.dialog = element('dialog', null, 'Edit cell');
      this.root.append(bar, this.port, this.dialog);
      if (rangeSelection ?? (!readPage && columns.some((c) => c.editable))) this.installRangeEditing();
      this.search.oninput = () => this.filter(this.search.value);
      this.port.onscroll = () => this.paint();
      this.port.onkeydown = (event) => this.navigate(event);
      this.canvas.onclick = (event) => {
        const cell = event.target.closest('[role="gridcell"]');
        if (!cell || this.dragged) return;
        this.activate(Number(cell.parentNode.dataset.index), Number(cell.dataset.column), event.shiftKey);
        this.port.focus({ preventScroll: true });
        if (this.columns[this.column].inspectable && this.onInspect) this.inspectCell();
      };
      this.canvas.ondblclick = (event) => {
        if (event.target.closest('[role="gridcell"]')) this.edit();
      };
      if (readPage) {
        this.columns.forEach((c) => {
          c.editable = false;
        });
        const pager = element('div');
        pager.className = 'cg-bar';
        this.previous = element('button');
        this.previous.textContent = 'Previous page';
        this.previous.onclick = () => this.loadPage(Math.max(0, this.offset - pageSize));
        this.next = element('button');
        this.next.textContent = 'Next page';
        this.next.onclick = () => this.loadPage(this.offset + pageSize);
        this.retry = element('button');
        this.retry.textContent = 'Retry';
        this.retry.onclick = () => this.loadPage(this.offset);
        const jump = element('form'),
          label = element('label');
        label.textContent = 'Page ';
        this.pageInput = element('input');
        this.pageInput.type = 'number';
        this.pageInput.min = '1';
        this.pageInput.required = true;
        label.append(this.pageInput);
        const go = element('button');
        go.textContent = 'Go';
        jump.append(label, go);
        jump.onsubmit = (event) => {
          event.preventDefault();
          this.loadPage((this.pageInput.valueAsNumber - 1) * pageSize);
        };
        pager.append(this.previous, jump, this.retry, this.next);
        this.root.append(pager);
      }
      this.setRows(rows);
      host.append(this.root);
      this.paint(true);
      this.observer = new ResizeObserver(() => this.paint());
      this.observer.observe(this.port);
      if (readPage) this.ready = this.loadPage(0);
    }

    installFilters(bar) {
      const panel = element('details');
      panel.className = 'cg-filters';
      const toggle = element('summary');
      toggle.textContent = 'Filter columns';
      const form = element('form');
      const field = element('select', null, 'Filter column');
      const operator = element('select', null, 'Filter operator');
      const value = element('input', null, 'Filter value');
      const add = element('button');
      add.textContent = 'Add filter';
      value.placeholder = 'Value';
      value.required = true;
      this.columns.forEach((c) => field.add(new Option(c.label || c.field, c.field)));
      const operators = { contains: 'contains', eq: 'equals', gt: 'greater than', lt: 'less than' };
      const configure = () => {
        const numeric = this.columns[field.selectedIndex].type === 'number';
        operator.replaceChildren();
        for (const op of numeric ? ['eq', 'gt', 'lt'] : ['contains', 'eq'])
          operator.add(new Option(operators[op], op));
        value.type = numeric ? 'number' : 'text';
        value.step = 'any';
      };
      field.onchange = configure;
      configure();
      const applied = element('div');
      applied.className = 'cg-applied';
      form.onsubmit = (event) => {
        event.preventDefault();
        if (!value.value.trim()) return;
        const c = this.columns[field.selectedIndex];
        const test = {
          field: c.field,
          op: operator.value,
          value: value.value.trim(),
          numeric: c.type === 'number',
        };
        this.conditions.push(test);
        const remove = element('button');
        remove.type = 'button';
        remove.dataset.variant = 'secondary';
        const description = [c.label || c.field, operators[test.op], test.value].join(' ');
        remove.textContent = description + ' ×';
        remove.setAttribute('aria-label', 'Remove filter ' + description);
        remove.onclick = () => {
          this.conditions = this.conditions.filter((item) => item !== test);
          remove.remove();
          this.refresh(false);
          toggle.focus();
        };
        applied.append(remove);
        value.value = '';
        panel.open = false;
        this.refresh(false);
        toggle.focus();
      };
      form.append(field, operator, value, add);
      panel.append(toggle, form);
      bar.append(panel, applied);
    }

    inspectCell() {
      const column = this.columns[this.column];
      const row = this.view[this.index];
      if (this.onInspect && column.inspectable && row?.[column.field] != null) this.onInspect(row, column);
    }

    display(column, value) {
      if (column.type === 'protected') return '••••••';
      if (column.type === 'drilldown') return (value || []).map((item) => item.text).join(', ');
      if (column.type === 'image') return Array.isArray(value) ? value.join(', ') : String(value ?? '');
      return column.groupDigits && Number.isFinite(value) ? this.numberFormat.format(value) : String(value ?? '');
    }

    async loadPage(offset) {
      this.request?.abort();
      const request = new AbortController();
      this.request = request;
      this.offset = offset;
      this.previous.disabled = this.next.disabled = this.pageInput.disabled = true;
      this.pageInput.form.querySelector('button').disabled = true;
      this.retry.hidden = true;
      this.port.setAttribute('aria-busy', 'true');
      this.count.textContent = 'Loading records…';
      try {
        const { rows, total } = await this.readPage({
          offset,
          limit: this.pageSize,
          query: this.query,
          order: this.order,
          signal: request.signal,
        });
        if (request.signal.aborted) return;
        if (
          !Array.isArray(rows) ||
          !Number.isSafeInteger(total) ||
          total < 0 ||
          rows.length !== Math.max(0, Math.min(this.pageSize, total - offset))
        )
          throw new TypeError('Invalid page response');
        if (offset && offset >= total)
          return this.loadPage(Math.max(0, Math.floor((total - 1) / this.pageSize) * this.pageSize));
        this.port.scrollTop = 0;
        this.setRows(rows);
        this.count.textContent = total
          ? (offset + 1).toLocaleString() +
            '–' +
            (offset + rows.length).toLocaleString() +
            ' of ' +
            total.toLocaleString()
          : 'No matching records';
        this.previous.disabled = offset === 0;
        this.next.disabled = offset + rows.length >= total;
        this.pageInput.max = String(Math.max(1, Math.ceil(total / this.pageSize)));
        this.pageInput.value = String(1 + Math.floor(offset / this.pageSize));
        this.pageInput.disabled = total === 0;
        this.pageInput.form.querySelector('button').disabled = total === 0;
      } catch (error) {
        if (request.signal.aborted) return;
        this.setRows([]);
        this.count.textContent = 'Could not load records';
        this.retry.hidden = false;
      } finally {
        if (!request.signal.aborted) this.port.removeAttribute('aria-busy');
      }
    }

    setRows(rows) {
      const byId = new Map();
      for (const row of rows) {
        const id = row[this.key];
        if (id == null || byId.has(id)) throw new TypeError('Each row needs a unique key');
        byId.set(id, row);
      }
      if (this.session) this.endItemEditorSession(true);
      else if (this.dialog.open) this.dialog.close();
      this.byId = byId;
      this.refresh(true);
    }

    // Apply one atomic batch of partial records to the local data model.
    applyUpdates(patches) {
      if (this.readPage) throw new TypeError('Paged rows are read-only');
      const changed = new Map();
      let reorder = false;
      for (const patch of patches) {
        const id = patch?.[this.key];
        const prior = changed.get(id) || this.byId.get(id);
        if (!prior) throw new RangeError('Unknown row key: ' + id);
        if (
          this.order &&
          Object.hasOwn(patch, this.order.field) &&
          prior[this.order.field] !== patch[this.order.field]
        )
          reorder = true;
        changed.set(id, { ...prior, ...patch });
      }
      if (!changed.size) return 0;
      if (this.dataProvider) {
        this.dataProvider.replaceAll(
          this.dataProvider.source.map((r) => changed.get(r[this.key]) || r),
          this,
          'update',
        );
        this.setRows(this.dataProvider.source);
        return changed.size;
      }
      if (this.session && changed.has(this.session.ctx.data[this.key])) this.endItemEditorSession(true);
      for (const [id, row] of changed) this.byId.set(id, row);
      if (
        this.query ||
        this.conditions.length ||
        reorder ||
        (this.order && this.columns.find((c) => c.field === this.order.field)?.sortCompareFunction)
      ) {
        this.refresh(true);
      } else {
        this.positions ??= new Map(this.view.map((row, i) => [row[this.key], i]));
        for (const [id, row] of changed) {
          const i = this.positions.get(id);
          this.view[i] = row;
          if (i >= this.start && i < this.end)
            this.bindRow(this.canvas.children[i - this.start], i, this.start, true);
        }
        this.renderPool.trim();
      }
      return changed.size;
    }

    sort(field, direction = 'asc') {
      if (!this.columns.some((c) => c.field === field) || !['asc', 'desc'].includes(direction))
        throw new TypeError('Unknown sort field or direction');
      this.order = { field, asc: direction === 'asc' };
      if (this.readPage) return this.loadPage(0);
      this.refresh(false);
    }

    filter(text) {
      this.search.value = text;
      this.query = text.trim().toLocaleLowerCase();
      if (this.readPage) return this.loadPage(0);
      this.refresh(false);
    }

    refresh(keepPosition) {
      this.anchor = null;
      this.positions = null;
      const oldId = this.activeId;
      this.view = Array.from(this.byId.values());
      if (!this.readPage && this.query)
        this.view = this.view.filter((row) =>
          this.columns.some((c) =>
            String(row[c.field] ?? '')
              .toLocaleLowerCase()
              .includes(this.query),
          ),
        );
      if (this.conditions.length)
        this.view = this.view.filter((row) =>
          this.conditions.every((test) => {
            const raw = row[test.field];
            if (raw == null) return false;
            if (test.numeric) {
              const target = Number(test.value);
              if (typeof raw !== 'number') return false;
              if (test.op === 'gt') return raw > target;
              if (test.op === 'lt') return raw < target;
              return raw === target;
            }
            const text = String(raw).toLocaleLowerCase(),
              needle = test.value.toLocaleLowerCase();
            return test.op === 'eq' ? text === needle : text.includes(needle);
          }),
        );
      if (!this.readPage && this.order) {
        const { field, asc } = this.order;
        const sortColumn = this.columns.find((c) => c.field === field);
        this.view.sort((a, b) => {
          const x = a[field],
            y = b[field];
          if (x == null || y == null) return Number(x == null) - Number(y == null);
          const custom = sortColumn?.sortCompareFunction;
          const cmp = custom
            ? custom(a, b, sortColumn)
            : typeof x === 'number' && typeof y === 'number'
              ? x - y
              : this.collator.compare(x, y);
          return asc ? cmp : -cmp;
        });
      }
      this.columns.forEach((c, i) => {
        const head = this.header.children[i];
        if (this.order?.field === c.field)
          head.setAttribute('aria-sort', this.order.asc ? 'ascending' : 'descending');
        else head.removeAttribute('aria-sort');
      });
      this.canvas.style.height = this.view.length * height + 'px';
      this.port.setAttribute('aria-rowcount', this.view.length + 1);
      this.count.textContent = this.view.length
        ? this.view.length.toLocaleString() + ' records'
        : 'No matching records';
      if (!keepPosition) this.port.scrollTop = 0;
      const index = keepPosition ? this.view.findIndex((r) => r[this.key] === oldId) : -1;
      this.index = Math.max(0, index);
      if (keepPosition && index >= 0 && document.activeElement === this.port) this.reveal();
      this.paint(true);
    }

    reveal() {
      const top = this.index * height;
      const bottom = top + height * 2 - this.port.clientHeight;
      if (top < this.port.scrollTop) this.port.scrollTop = top;
      else if (bottom > this.port.scrollTop) this.port.scrollTop = bottom;
    }

    activate(row, column, extend = false) {
      if (this.rangeStatus) {
        if (extend) this.anchor ??= { row: this.index, col: this.column };
        else this.anchor = null;
      }
      this.index = Math.min(this.view.length - 1, Math.max(0, row));
      this.column = Math.min(this.columns.length - 1, Math.max(0, column));
      this.reveal();
      this.paint();
      this.canvas.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (this.view[this.index]) this.onActivate?.(this.view[this.index], this.columns[this.column]);
    }

    bindRow(row, i, start, sameRecord = false) {
      this.columns.forEach((c, j) => {
        const cell = row.children[j];
        if (!cell.id) cell.id = this.prefix + '-' + (i - start) + '-' + j;
        const raw = this.view[i][c.field];
        cell.toggleAttribute('data-inspect', Boolean(this.onInspect && c.inspectable && raw != null));
        const data = this.view[i],
          label = c.labelFunction ? String(c.labelFunction(data, c) ?? '') : this.display(c, raw);
        const ctx = ColibriGrid.cells.context(this, data, c, i, j, label, {
          active: i === this.index && j === this.column,
        });
        ctx.commit = (value) =>
          this.renderPool.active.get(cell)?.item.data === data && this.commitValue(data, c, value, true);
        this.renderPool.attach(
          cell,
          c.itemRendererFunction?.(data, c) ?? c.itemRenderer ?? ColibriGrid.cells.text,
          ctx,
          sameRecord,
        );
      });
    }

    // Rows intersecting the browser viewport and the scrollport below its sticky header.
    // The four extra rows mounted on each side are only a rendering buffer.
    getVisibleRows(viewport) {
      if (document.hidden || !this.view.length) return [];
      const port = this.port.getBoundingClientRect();
      const top = Math.max(viewport?.top ?? 0, this.header.getBoundingClientRect().bottom);
      const bottom = Math.min(viewport?.bottom ?? window.innerHeight, port.top + this.port.clientTop + this.port.clientHeight);
      if (bottom <= top || port.right <= 0 || port.left >= window.innerWidth || !port.width) return [];
      const origin = this.canvas.getBoundingClientRect().top;
      const first = Math.max(0, Math.floor((top - origin) / height));
      const end = Math.max(0, Math.ceil((bottom - origin) / height));
      return this.view.slice(first, end);
    }

    paint(force = false) {
      const visible = Math.max(1, Math.ceil(this.port.clientHeight / height));
      const first = Math.min(Math.max(0, this.view.length - 1), Math.floor(this.port.scrollTop / height));
      const start = Math.max(0, first - 4);
      const end = Math.min(this.view.length, first + visible + 4);
      if (force || start !== this.start || end !== this.end) {
        // Recycle visible rows so scrolling and sorting avoid rebuilding their cell trees.
        const count = end - start;
        while (this.canvas.children.length > count) {
          const row = this.canvas.lastElementChild;
          for (const cell of row.children) this.renderPool.release(cell);
          row.remove();
        }
        for (let i = start; i < end; ++i) {
          let row = this.canvas.children[i - start];
          if (!row) {
            row = element('div', 'row');
            row.className = 'cg-row';
            this.columns.forEach((c, j) => {
              const cell = element('div', 'gridcell');
              cell.dataset.column = j;
              if (c.type === 'number') cell.dataset.numeric = '';
              cell.setAttribute('aria-readonly', !(c.editable && c.field !== this.key));
              cell.append(document.createTextNode(''));
              row.append(cell);
            });
            this.canvas.append(row);
          }
          if (row.dataset.index !== String(i)) {
            row.dataset.index = i;
            row.style.top = i * height + 'px';
            row.setAttribute('aria-rowindex', i + 2);
          }
          this.bindRow(row, i, start);
        }
        this.renderPool.trim();
        this.start = start;
        this.end = end;
      }
      if (this.index < start || this.index >= end) this.index = first;
      this.activeId = this.view[this.index]?.[this.key];
      const previous = this.canvas.querySelector('[data-active]');
      previous?.removeAttribute('data-active');
      const cell = this.canvas.children[this.index - start]?.children[this.column];
      if (cell) {
        cell.dataset.active = '';
        this.port.setAttribute('aria-activedescendant', cell.id);
      } else this.port.removeAttribute('aria-activedescendant');
      this.paintRange();
      for (const node of new Set([previous, cell])) {
        const item = this.renderPool.active.get(node)?.item,
          active = !!node && node === cell;
        if (item && item.active !== active) {
          item.active = active;
          item.setCurrentState?.(active ? 'active' : 'normal');
          item.prepare?.(true);
        }
      }
      this.positionInlineEditor();
    }

    positionInlineEditor() {
      const session = this.session;
      if (!session?.form || session.saving) return;
      const { ctx, form } = session;
      const i = ctx.rowIndex;
      const cell = this.canvas.children[i - this.start]?.children[ctx.columnIndex];
      if (!cell || this.view[i] !== ctx.data) {
        this.endItemEditorSession(true);
        return;
      }
      const box = cell.getBoundingClientRect(), port = this.port.getBoundingClientRect();
      if (box.bottom <= this.header.getBoundingClientRect().bottom || box.top >= port.bottom ||
          box.right <= port.left || box.left >= port.right) {
        this.endItemEditorSession(true);
        return;
      }
      const origin = this.root.getBoundingClientRect();
      Object.assign(form.style, {
        left: box.left - origin.left - this.root.clientLeft + 'px',
        top: box.top - origin.top - this.root.clientTop + 'px',
        width: box.width + 'px',
        height: box.height + 'px',
      });
    }

    installColumnMenu(head, column) {
      const trigger = element('button', null, 'Options ' + (column.label || column.field));
      trigger.type = 'button';
      trigger.className = 'cg-menu-trigger';
      trigger.textContent = '⋮';
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      head.classList.add('cg-menu-head');
      head.append(trigger);
      trigger.onclick = () => {
        const box = trigger.getBoundingClientRect();
        this.showGridMenu(trigger, trigger, column.label, box.left, box.bottom, [
          [
            'Sort ascending',
            () => this.sort(column.field, 'asc'),
            this.order?.field === column.field && this.order.asc === true,
          ],
          [
            'Sort descending',
            () => this.sort(column.field, 'desc'),
            this.order?.field === column.field && this.order.asc === false,
          ],
        ]);
      };
    }

    showGridMenu(trigger, focusTarget, label, x, y, items) {
      const menu = element('div', 'menu', label);
      menu.popover = 'auto';
      menu.className = 'cg-sort-menu';
      for (const [name, run, checked] of items) {
        const action = element('button', checked === undefined ? 'menuitem' : 'menuitemradio');
        action.type = 'button';
        action.textContent = name;
        if (checked !== undefined) action.setAttribute('aria-checked', checked);
        action.onclick = async () => {
          menu.hidePopover();
          focusTarget.focus({ preventScroll: true });
          try {
            await run();
          } catch (error) {
            if (this.rangeStatus) this.rangeStatus.textContent = error.message;
          }
        };
        menu.append(action);
      }
      this.root.append(menu);
      menu.showPopover();
      menu.style.left = Math.max(0, Math.min(x, innerWidth - menu.offsetWidth)) + 'px';
      menu.style.top = Math.max(0, Math.min(y, innerHeight - menu.offsetHeight)) + 'px';
      trigger?.setAttribute('aria-expanded', 'true');
      menu.firstChild.focus();
      menu.onkeydown = (e) => {
        if (e.key === 'Escape') {
          menu.hidePopover();
          focusTarget.focus();
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const items = [...menu.children],
            step = e.key === 'ArrowDown' ? 1 : -1;
          items[(items.indexOf(document.activeElement) + step + items.length) % items.length].focus();
        }
      };
      menu.ontoggle = () => {
        if (!menu.matches(':popover-open')) {
          trigger?.setAttribute('aria-expanded', 'false');
          menu.remove();
        }
      };
    }

    installRangeEditing() {
      this.rangeStatus = element('output', 'status');
      this.rangeStatus.className = 'cg-range-status';
      this.root.append(this.rangeStatus);
      this.canvas.oncontextmenu = (e) => {
        const cell = e.target.closest('[role=gridcell]');
        if (!cell || !this.view.length) return;
        e.preventDefault();
        const row = +cell.parentElement.dataset.index,
          col = +cell.dataset.column,
          b = this.rangeBounds();
        if (row < b.top || row > b.bottom || col < b.left || col > b.right) this.activate(row, col);
        this.showGridMenu(null, this.port, 'Cell actions', e.clientX, e.clientY, [
          ['Copy', () => ColibriGrid.delimited.copy(this.rangeValues())],
          [
            'Paste',
            async () => {
              const values = await ColibriGrid.delimited.paste();
              this.editRange('paste', values);
            },
          ],
          ['Fill down', () => this.editRange('down')],
          ['Fill right', () => this.editRange('right')],
          ['Clear', () => this.editRange('clear')],
        ]);
      };
      const transfer = (e, action) => {
        if (document.activeElement !== this.port || !this.view.length || !e.clipboardData) return;
        e.preventDefault();
        this.runRangeAction(() => {
          if (action === 'paste') {
            const rows = ColibriGrid.delimited.readClipboard(e.clipboardData);
            this.editRange('paste', rows);
          } else {
            ColibriGrid.delimited.writeClipboard(e.clipboardData, this.rangeValues());
            if (action === 'cut') this.editRange('clear');
          }
        });
      };
      for (const action of ['copy', 'cut', 'paste'])
        document.addEventListener(action, (e) => transfer(e, action), { signal: this.life.signal });
      this.canvas.onpointerdown = (e) => {
        this.dragged = false;
        const cell = e.target.closest('[role=gridcell]');
        if (
          e.button !== 0 ||
          e.pointerType === 'touch' ||
          !cell ||
          e.target.closest('button,input,select,textarea,a')
        )
          return;
        const row = +cell.parentElement.dataset.index,
          col = +cell.dataset.column;
        const box = cell.getBoundingClientRect();
        const fill = cell.hasAttribute('data-fill') && e.clientX >= box.right - 9 && e.clientY >= box.bottom - 9;
        this.dragStart = { row, col, fill: fill ? this.rangeBounds() : null, extend: e.shiftKey };
      };
      this.canvas.onpointerover = (e) => {
        const start = this.dragStart,
          cell = e.target.closest('[role=gridcell]');
        if (!start || !e.buttons || !cell) return;
        const row = +cell.parentElement.dataset.index,
          col = +cell.dataset.column;
        if (!this.dragged && row === start.row && col === start.col) return;
        if (start.fill) {
          this.anchor = {
            row: row < start.fill.top ? start.fill.bottom : start.fill.top,
            col: col < start.fill.left ? start.fill.right : start.fill.left,
          };
        } else if (!this.dragged && !start.extend) this.activate(start.row, start.col);
        this.dragged = true;
        this.activate(row, col, true);
        this.port.focus({ preventScroll: true });
      };
      const finish = (e) => {
        if (this.dragStart?.fill && this.dragged && e.type === 'pointerup')
          this.runRangeAction(() => this.editRange('fill', null, this.dragStart.fill));
        this.dragStart = null;
      };
      for (const type of ['pointerup', 'pointercancel'])
        window.addEventListener(type, finish, { signal: this.life.signal });
    }

    rangeBounds() {
      const row = this.anchor?.row ?? this.index,
        col = this.anchor?.col ?? this.column;
      return {
        top: Math.min(row, this.index),
        bottom: Math.max(row, this.index),
        left: Math.min(col, this.column),
        right: Math.max(col, this.column),
      };
    }

    rangeValues(bounds = this.rangeBounds()) {
      return this.view
        .slice(bounds.top, bounds.bottom + 1)
        .map((row) =>
          this.columns
            .slice(bounds.left, bounds.right + 1)
            .map((col) =>
              col.type === 'protected'
                ? ''
                : col.type === 'drilldown' || col.type === 'image'
                  ? this.display(col, row[col.field])
                  : (row[col.field] ?? ''),
            ),
        );
    }

    runRangeAction(action) {
      try {
        action();
        this.rangeStatus.textContent = '';
      } catch (error) {
        this.rangeStatus.textContent = error.message;
      }
    }

    paintRange() {
      if (!this.rangeStatus) return;
      const b = this.rangeBounds();
      for (const row of this.canvas.children) {
        const i = +row.dataset.index;
        for (const cell of row.children) {
          const j = +cell.dataset.column,
            selected = i >= b.top && i <= b.bottom && j >= b.left && j <= b.right;
          cell.toggleAttribute('data-range', selected);
          cell.setAttribute('aria-selected', String(selected));
          cell.toggleAttribute(
            'data-fill',
            i === b.bottom && j === b.right && this.columns.some((c) => c.editable),
          );
        }
      }
    }

    editRange(action, matrix, source) {
      if (this.readPage || !this.view.length) return;
      const bounds = this.rangeBounds(),
        changes = [],
        patches = new Map();
      if (action === 'paste') {
        if (!matrix.length) return;
        bounds.bottom = Math.min(this.view.length - 1, bounds.top + matrix.length - 1);
      } else if (action === 'down' || action === 'right' || action === 'fill') {
        source ??= { ...bounds };
        if (action === 'down') source.bottom = source.top;
        if (action === 'right') source.right = source.left;
        matrix = this.rangeValues(source);
      }
      for (let i = bounds.top; i <= bounds.bottom; i++) {
        const line = action === 'paste' ? matrix[i - bounds.top] : null;
        const right = line ? Math.min(this.columns.length - 1, bounds.left + line.length - 1) : bounds.right;
        const row = this.view[i],
          id = row[this.key];
        for (let j = bounds.left; j <= right; j++) {
          const c = this.columns[j];
          if (!c.editable || c.field === this.key) continue;
          let value = line ? line[j - bounds.left] : null;
          if (source) {
            if (i >= source.top && i <= source.bottom && j >= source.left && j <= source.right) continue;
            const h = matrix.length,
              w = matrix[0].length;
            value = matrix[(((i - source.top) % h) + h) % h][(((j - source.left) % w) + w) % w];
          }
          if (c.type === 'number') {
            value = value == null || value === '' ? null : Number(value);
            if (value !== null && !Number.isFinite(value)) throw Error('Invalid ' + c.label);
          } else if (c.type === 'boolean') {
            if (value == null || value === '') value = false;
            else if (/^(true|false|1|0|yes|no)$/i.test(String(value)))
              value = /^(true|1|yes)$/i.test(String(value));
            else throw Error('Invalid ' + c.label);
          } else value = String(value ?? '');
          const detail = { data: row, column: c, oldValue: row[c.field], value, editor: null };
          if (
            !ColibriGrid.cells.event(this, 'itemEditBeginning', detail, true) ||
            !ColibriGrid.cells.event(this, 'itemEditEnd', detail, true)
          )
            return;
          const error = (c.validator || c.validate)?.(detail.value, row, c);
          if (error === false || (typeof error === 'string' && error)) throw Error(error || 'Invalid ' + c.label);
          const patch = patches.get(id) || { [this.key]: id };
          patch[c.field] = detail.value;
          patches.set(id, patch);
          changes.push(detail);
        }
      }
      this.applyUpdates(patches.values());
      for (const change of changes) {
        const id = change.data[this.key];
        this.root.dispatchEvent(
          new CustomEvent('colibri-change', {
            bubbles: true,
            detail: {
              id,
              field: change.column.field,
              previous: change.oldValue,
              value: change.value,
              row: this.byId.get(id),
            },
          }),
        );
        ColibriGrid.cells.event(this, 'itemEditSave', change);
      }
    }

    navigate(event) {
      if (event.target !== this.port || !this.view.length) return;
      const cmd = event.ctrlKey || event.metaKey,
        key = event.key.toLowerCase();
      if (this.rangeStatus) {
        const op =
          cmd && key === 'd'
            ? 'down'
            : cmd && key === 'r'
              ? 'right'
              : ['Delete', 'Backspace'].includes(event.key)
                ? 'clear'
                : null;
        if (op) {
          event.preventDefault();
          this.runRangeAction(() => this.editRange(op));
          return;
        }
        if (cmd && key === 'a') {
          event.preventDefault();
          this.anchor = { row: 0, col: 0 };
          this.activate(this.view.length - 1, this.columns.length - 1, true);
          return;
        }
      }
      let row = this.index,
        col = this.column;
      switch (event.key) {
        case 'ArrowDown':
          row++;
          break;
        case 'ArrowUp':
          row--;
          break;
        case 'ArrowLeft':
          col--;
          break;
        case 'ArrowRight':
          col++;
          break;
        case 'Home':
          col = 0;
          if (event.ctrlKey || event.metaKey) row = 0;
          break;
        case 'End':
          col = this.columns.length - 1;
          if (event.ctrlKey || event.metaKey) row = this.view.length - 1;
          break;
        case 'PageDown':
          row += Math.max(1, Math.floor(this.port.clientHeight / height) - 1);
          break;
        case 'PageUp':
          row -= Math.max(1, Math.floor(this.port.clientHeight / height) - 1);
          break;
        case 'Enter':
          if (this.onInspect && this.columns[col].inspectable) {
            event.preventDefault();
            this.inspectCell();
            return;
          }
        // Editable cells also accept Enter.
        case 'F2':
          event.preventDefault();
          this.edit();
          return;
        default:
          return;
      }
      event.preventDefault();
      this.activate(row, col, event.shiftKey);
    }

    commitValue(original, c, value, begin = false) {
      const api = ColibriGrid.cells,
        id = original[this.key];
      if (!c.editable || c.field === this.key || this.byId.get(id) !== original) return false;
      const detail = {
        data: original,
        column: c,
        oldValue: original[c.field],
        value,
        editor: this.itemEditorInstance,
      };
      if (begin && !api.event(this, 'itemEditBeginning', detail, true)) return false;
      if (!api.event(this, 'itemEditEnd', detail, true)) return false;
      value = detail.value;
      const error = (c.validator || c.validate)?.(value, original, c);
      if (error === false || (typeof error === 'string' && error)) throw Error(error || 'Invalid value');
      const updated = { ...original, [c.field]: value };
      if (this.dataProvider)
        this.dataProvider.replaceAll(
          this.dataProvider.source.map((r) => (r[this.key] === id ? updated : r)),
          this,
          'update',
        );
      this.byId.set(id, updated);
      if (this.dataProvider instanceof ColibriGrid.ListCollectionView)
        this.byId = new Map(this.dataProvider.source.map((r) => [r[this.key], r]));
      if (
        this.dataProvider instanceof ColibriGrid.ListCollectionView ||
        this.conditions.length ||
        this.query ||
        this.order?.field === c.field ||
        this.view[this.index]?.[this.key] !== id
      )
        this.refresh(true);
      else {
        this.view[this.index] = updated;
        this.paint(true);
      }
      this.root.dispatchEvent(
        new CustomEvent('colibri-change', {
          bubbles: true,
          detail: { id, field: c.field, previous: original[c.field], value, row: updated },
        }),
      );
      api.event(this, 'itemEditSave', detail);
      return true;
    }
    get itemEditorInstance() {
      return this.session?.editor ?? null;
    }
    startItemEditorSession(i, j) {
      this.activate(i, j);
      return this.edit();
    }
    endItemEditorSession(cancel = false) {
      if (!this.session) return true;
      const session = this.session;
      const { editor, ctx } = session;
      if (!cancel) {
        try {
          const valid = editor.validate?.();
          if (valid === false || (typeof valid === 'string' && valid)) throw Error(valid || 'Invalid value');
          if (editor.save?.() === false) return false;
          const prop = ctx.column.editorDataField ?? ('editedValue' in editor ? 'editedValue' : 'value');
          session.saving = true;
          try {
            if (!this.commitValue(ctx.data, ctx.column, prop in editor ? editor[prop] : editor.element[prop])) return false;
          } finally {
            session.saving = false;
          }
        } catch (error) {
          const input = editor.focusTarget || editor.element;
          input.setCustomValidity?.(error.message);
          if (!session.form) input.reportValidity?.();
          input.setAttribute('aria-invalid', 'true');
          this.editError.textContent = error.message;
          return false;
        }
      }
      this.session = null;
      editor.discard?.(cancel ? 'cancel' : 'save');
      editor.destroy?.();
      if (cancel) ColibriGrid.cells.event(this, 'itemEditCancel', ctx);
      session.scope?.abort();
      session.form?.remove();
      if (this.dialog.open) this.dialog.close();
      this.port.focus({ preventScroll: true });
      return true;
    }
    edit() {
      const c = this.columns[this.column],
        row = this.byId.get(this.activeId);
      if (!row || this.session || this.dialog.open) return false;
      if (c.type === 'image' || c.type === 'drilldown') {
        const body = element('div'),
          close = element('button', null, 'Close preview');
        const entries = row[c.field] ?? [];
        for (const v of Array.isArray(entries) ? entries : [entries]) {
          const item = element('div'),
            url = c.type === 'image' ? v : v.img;
          if (url) {
            const img = element('img');
            img.alt = c.type === 'image' ? c.label : v.text;
            img.src = url;
            item.append(img);
          }
          if (c.type === 'drilldown') item.append(String(v.text));
          body.append(item);
        }
        close.type = 'button';
        close.textContent = 'Close';
        close.onclick = () => this.dialog.close();
        this.dialog.setAttribute('aria-label', c.label + ' preview');
        this.dialog.oncancel = null;
        this.dialog.replaceChildren(body, close);
        this.dialog.showModal();
        close.focus();
        return true;
      }
      if (!c.editable || c.field === this.key) return false;
      this.dialog.setAttribute('aria-label', 'Edit cell');
      const cell = this.canvas.children[this.index - this.start]?.children[this.column];
      if (this.inlineEditing && !cell) return false;
      if (c.rendererIsEditor) {
        const item = this.renderPool.active.get(cell)?.item;
        if (item?.beginInlineEdit) item.beginInlineEdit();
        else (item?.focusTarget || item?.element)?.focus();
        return true;
      }
      const api = ColibriGrid.cells,
        ctx = api.context(this, row, c, this.index, this.column, this.display(c, row[c.field]), {
          itemRenderer: this.renderPool.active.get(cell)?.item,
        });
      if (!api.event(this, 'itemEditBeginning', ctx, true)) return false;
      const defaultEditor =
        c.multiline || (typeof row[c.field] === 'string' && /[\r\n]/.test(row[c.field]))
          ? api.multiline
          : api.input;
      const editor = api.create(c.itemEditorFunction?.(row, c) ?? c.itemEditor ?? defaultEditor);
      Object.assign(editor, ctx);
      this.session = { editor, ctx };
      const form = element('form'),
        label = element('label'),
        save = element('button'),
        cancel = element('button');
      if (!this.inlineEditing) label.textContent = c.label;
      label.append(editor.element);
      save.textContent = 'Save';
      cancel.type = 'button';
      cancel.textContent = 'Cancel';
      cancel.onclick = () => this.endItemEditorSession(true);
      form.onkeydown = (e) => {
        if (e.isComposing || !e.target.matches('input,textarea') || e.defaultPrevented) return;
        if (e.key === 'Tab') {
          e.preventDefault();
          if (this.endItemEditorSession()) this.activate(this.index, this.column + (e.shiftKey ? -1 : 1));
        } else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName === 'TEXTAREA') {
          e.preventDefault();
          this.endItemEditorSession();
        }
      };
      form.onsubmit = (e) => {
        e.preventDefault();
        this.endItemEditorSession();
      };
      this.editError = element('output');
      this.editError.setAttribute('role', 'alert');
      form.append(label, this.editError, cancel, save);
      if (this.inlineEditing) {
        const scope = new AbortController();
        Object.assign(this.session, { form, scope });
        form.className = 'cg-inline-editor';
        form.setAttribute('aria-label', 'Edit ' + c.label);

        save.textContent = '✓';
        save.setAttribute('aria-label', 'Save');
        cancel.textContent = '×';
        cancel.setAttribute('aria-label', 'Cancel');
        form.noValidate = true;
        form.addEventListener('keydown', e => {
          if (!e.isComposing && e.key === 'Escape') {
            e.preventDefault();
            this.endItemEditorSession(true);
          }
        });
        this.root.append(form);
        this.positionInlineEditor();
        if (!this.session) return false;
        document.addEventListener('pointerdown', e => {
          if (form.contains(e.target) || !this.session) return;
          if (!this.endItemEditorSession()) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }, {capture: true, signal: scope.signal});
      } else {
        this.dialog.replaceChildren(form);
        this.dialog.oncancel = (e) => {
          e.preventDefault();
          this.endItemEditorSession(true);
        };
        this.dialog.showModal();
      }
      editor.initialize?.();
      editor.prepare?.();
      editor.element.oninput = () => {
        (editor.focusTarget || editor.element).setCustomValidity?.('');
        (editor.focusTarget || editor.element).removeAttribute('aria-invalid');
        this.editError.textContent = '';
      };
      const control = editor.focusTarget || editor.element;
      if (this.inlineEditing && !control.hasAttribute('aria-label')) control.setAttribute('aria-label', c.label);
      control.focus();
      control.select?.();
      api.event(this, 'itemEditBegin', { ...ctx, editor });
      return true;
    }

    destroy() {
      this.request?.abort();
      this.endItemEditorSession(true);
      this.life.abort();
      this.renderPool.destroy();
      this.headerPool.destroy();
      this.observer.disconnect();
      this.root.remove();
    }
  };
})();

// Cell infrastructure shared by the compact grid and the workbench.
(() => {
  class ClassFactory {
    constructor(component, properties = {}) {
      this.component = component;
      this.properties = properties;
    }
    newInstance() {
      return Object.assign(new this.component(), this.properties);
    }
  }

  class ArrayCollection extends EventTarget {
    constructor(items = [], { key = 'id', createKey = () => crypto.randomUUID() } = {}) {
      super();
      this.key = key;
      this.createKey = createKey;
      this.replaceAll(items);
    }
    get source() {
      return this.items.slice();
    }
    get length() {
      return this.items.length;
    }
    getItemAt(index) {
      return this.items[index];
    }
    replaceAll(items, origin, kind = 'reset') {
      const next = Array.from(items),
        keys = new Set();
      for (const item of next) {
        const id = item?.[this.key];
        if (id == null || keys.has(id)) throw TypeError('Data provider requires unique ' + this.key + ' values');
        keys.add(id);
      }
      this.items = next;
      this.dispatchEvent(new CustomEvent('collectionChange', { detail: { kind, origin } }));
    }
    addItem(item, index = this.length) {
      if (!Number.isInteger(index) || index < 0 || index > this.length)
        throw RangeError('Invalid insertion index');
      const next = this.source;
      next.splice(index, 0, item);
      this.replaceAll(next, null, 'add');
    }
    removeItemAt(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this.length) throw RangeError('Invalid removal index');
      const next = this.source,
        [item] = next.splice(index, 1);
      this.replaceAll(next, null, 'remove');
      return item;
    }
    updateItem(key, values) {
      const index = this.items.findIndex((item) => item[this.key] === key);
      if (index < 0) throw RangeError('Unknown record');
      const next = this.source;
      next[index] = { ...next[index], ...values };
      this.replaceAll(next, null, 'update');
    }
    itemUpdated(item) {
      if (!this.items.includes(item)) throw RangeError('Unknown record');
      this.replaceAll(this.items, null, 'update');
    }
  }

  // Independent projections can filter and order the same underlying collection.
  class ListCollectionView extends EventTarget {
    constructor(collection, { filterFunction = null, sortCompareFunction = null } = {}) {
      super();
      this.collection = collection;
      this.key = collection.key;
      this.createKey = collection.createKey;
      this.filterFunction = filterFunction;
      this.sortCompareFunction = sortCompareFunction;
      this.changed = (event) => this.refresh(event.detail.origin, event.detail.kind);
      collection.addEventListener('collectionChange', this.changed);
      this.refresh();
    }
    get source() {
      return this.items.slice();
    }
    get length() {
      return this.items.length;
    }
    getItemAt(index) {
      return this.items[index];
    }
    refresh(origin = null, kind = 'refresh') {
      const source = this.collection.source;
      this.items = this.filterFunction ? source.filter(this.filterFunction) : source;
      if (this.sortCompareFunction) this.items.sort(this.sortCompareFunction);
      this.dispatchEvent(new CustomEvent('collectionChange', { detail: { kind, origin } }));
    }
    replaceAll(records, origin, kind = 'reset') {
      // Replacing a view changes only the records it currently exposes.
      const visible = new Set(this.items.map((r) => r[this.key]));
      const source = this.collection.source;
      const hidden = new Set(source.filter((r) => !visible.has(r[this.key])).map((r) => r[this.key]));
      const next = Array.from(records);
      if (next.some((r) => hidden.has(r[this.key]))) throw TypeError('Record key belongs to a hidden item');
      const merged = [];
      let index = 0;
      for (const record of source) {
        if (!visible.has(record[this.key])) merged.push(record);
        else if (index < next.length) merged.push(next[index++]);
      }
      while (index < next.length) merged.push(next[index++]);
      this.collection.replaceAll(merged, origin, kind);
    }
    destroy() {
      this.collection.removeEventListener('collectionChange', this.changed);
    }
  }

  class UIComponent {
    constructor() {
      this.element = document.createElement('span');
      this.parts = new Map();
      this.invalid = new Set();
      this.currentState = 'normal';
    }
    initialize() {
      if (this.initialized) return;
      this.initialized = true;
      this.createChildren?.();
      if (this.skinFactory) this.setSkin(this.skinFactory);
      this.childrenCreated?.();
      this.element.dispatchEvent(
        new CustomEvent('creationComplete', { bubbles: true, detail: { component: this } }),
      );
    }
    setSkin(factory) {
      for (const [name, part] of this.parts) this.partRemoved?.(name, part);
      this.parts.clear();
      const skin = factory(this);
      if (!(skin instanceof HTMLElement)) throw TypeError('A skin factory must return an HTMLElement');
      this.element.replaceChildren(skin);
      for (const part of [skin, ...skin.querySelectorAll('[data-part]')]) {
        const name = part.dataset.part;
        if (!name) continue;
        if (this.parts.has(name)) throw TypeError('Duplicate skin part ' + name);
        this.parts.set(name, part);
        this.partAdded?.(name, part);
      }
    }
    setCurrentState(state) {
      if (this.currentState === state) return;
      const oldState = this.currentState;
      this.currentState = state;
      this.element.dataset.state = state;
      this.element.dispatchEvent(new CustomEvent('currentStateChange', { detail: { oldState, state } }));
    }
    invalidateProperties() {
      this.invalidate('properties');
    }
    invalidateSize() {
      this.invalidate('size');
    }
    invalidateDisplayList() {
      this.invalidate('display');
    }
    invalidate(phase) {
      this.invalid.add(phase);
      if (!this.frame) this.frame = requestAnimationFrame(() => this.validateNow());
    }
    validateNow() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      const invalid = this.invalid;
      this.invalid = new Set();
      if (invalid.has('properties')) this.commitProperties?.();
      if (invalid.has('size')) this.measure?.();
      if (invalid.has('display')) this.updateDisplayList?.();
    }
    destroy() {
      cancelAnimationFrame(this.frame);
      this.invalid.clear();
      for (const [name, part] of this.parts) this.partRemoved?.(name, part);
      this.parts.clear();
    }
  }

  function create(factory) {
    const item = factory.newInstance ? factory.newInstance() : factory();
    if (!(item?.element instanceof HTMLElement))
      throw TypeError('A cell factory must return a component with an HTML element');
    return item;
  }

  class RendererPool {
    constructor() {
      this.active = new Map();
      this.free = new Map();
    }
    attach(host, factory, context, sameRecord = false) {
      let entry = this.active.get(host);
      if (entry && (entry.factory !== factory || (!sameRecord && entry.item.data !== context.data))) {
        this.release(host);
        entry = null;
      }
      if (!entry) {
        const cached = this.free.get(factory);
        const old = cached?.pop();
        if (cached && !cached.length) this.free.delete(factory);
        const item = old || create(factory);
        entry = { factory, item, used: !!old };
        this.active.set(host, entry);
        host.replaceChildren(item.element);
      }
      const { item } = entry;
      const priorData = item.data;
      Object.assign(item, context);
      item.initialize?.();
      if (priorData !== context.data) item.dataChanged?.(priorData, context.data);
      item.setCurrentState?.(context.active ? 'active' : context.selected ? 'selected' : 'normal');
      item.prepare?.(entry.used);
      entry.used = true;
      return item;
    }
    release(host) {
      const entry = this.active.get(host);
      if (!entry) return;
      this.active.delete(host);
      const { item, factory } = entry;
      item.discard?.(true);
      item.element.remove();
      item.data = item.listData = item.column = item.owner = item.commit = item.value = null;
      item.label = '';
      item.active = item.selected = false;
      let instances = this.free.get(factory);
      if (!instances) this.free.set(factory, (instances = []));
      instances.push(item);
    }
    trim() {
      // A selector can return factories unique to a record. Retire obsolete pools at the end of a paint.
      const visibleFactories = new Set(Array.from(this.active.values(), (entry) => entry.factory));
      for (const [factory, items] of this.free) {
        if (visibleFactories.has(factory)) continue;
        for (const item of items) item.destroy?.();
        this.free.delete(factory);
      }
    }
    recycle() {
      for (const host of this.active.keys()) this.release(host);
    }
    destroy() {
      for (const { item } of this.active.values()) {
        item.discard?.(false);
        item.destroy?.();
      }
      for (const items of this.free.values()) for (const item of items) item.destroy?.();
      this.free.clear();
      this.active.clear();
    }
  }

  class GridItemRenderer extends UIComponent {
    prepare() {
      (this.parts.get('label') || this.element).textContent = this.label;
    }
  }
  class GridItemEditor extends UIComponent {
    createChildren() {
      if (!this.skinFactory) {
        this.focusTarget = document.createElement('input');
        this.element.append(this.focusTarget);
      }
    }
    partAdded(name, part) {
      if (name === 'input') this.focusTarget = part;
    }
    partRemoved(name) {
      if (name === 'input') this.focusTarget = null;
    }
    prepare() {
      if (this.focusTarget) this.focusTarget.value = this.value ?? '';
    }
    get editedValue() {
      return this.focusTarget?.value ?? this.value;
    }
    validate() {
      return this.focusTarget?.validationMessage || true;
    }
  }
  class LabelRenderer {
    constructor() {
      this.element = document.createElement('span');
    }
    prepare() {
      this.element.textContent = this.label;
    }
  }
  class UriEditor {
    constructor() {
      this.element = document.createElement('div');
      this.link = document.createElement('a');
      this.link.target = '_blank';
      this.link.rel = 'noopener noreferrer';
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.textContent = 'Edit URL';
      this.button.setAttribute('aria-label', 'Edit URL');
      this.input = document.createElement('input');
      this.input.type = 'url';
      this.button.onclick = () => this.startTyping();
      this.element.append(this.link, this.button, this.input);
    }
    startTyping() {
      this.link.hidden = this.button.hidden = true;
      this.input.hidden = false;
      this.focusTarget = this.input;
      this.input.focus();
      this.input.select();
    }
    prepare() {
      const value = String(this.value ?? '');
      this.input.value = value;
      this.link.textContent = value;
      if (/^https?:\/\//i.test(value)) this.link.href = value;
      this.input.setAttribute('aria-label', this.column.label);
      this.input.hidden = !!value;
      this.focusTarget = this.button;
      if (!value) this.startTyping();
    }
    get editedValue() {
      return this.input.value;
    }
    validate() {
      return this.input.validationMessage || true;
    }
  }
  class ImageRenderer {
    constructor() {
      this.element = document.createElement('span');
    }
    prepare() {
      if (this.previous === this.value) return;
      this.previous = this.value;
      this.element.replaceChildren();
      for (const url of Array.isArray(this.value) ? this.value : [this.value]) {
        if (!url) continue;
        const img = document.createElement('img');
        img.alt = this.column.label;
        img.src = url;
        img.height = 26;
        this.element.append(img);
      }
    }
  }
  class RatingRenderer {
    constructor() {
      this.element = document.createElement('span');
      this.element.className = 'cg-stars';
      this.element.setAttribute('role', 'radiogroup');
      for (let score = 1; score <= 5; score++) {
        const star = document.createElement('button');
        star.type = 'button';
        star.setAttribute('role', 'radio');
        star.setAttribute('aria-label', score + (score === 1 ? ' star' : ' stars'));
        star.tabIndex = -1;
        star.onclick = (event) => {
          event.stopPropagation();
          if (event.detail < 2) this.rate(score === this.value ? 0 : score);
        };
        this.element.append(star);
      }
      this.element.ondblclick = (event) => event.stopPropagation();
      this.element.onkeydown = (event) => {
        const index = Array.from(this.element.children).indexOf(event.target) + 1;
        const next = {
          ArrowRight: Math.min(5, index + 1),
          ArrowLeft: Math.max(1, index - 1),
          ArrowUp: Math.min(5, index + 1),
          ArrowDown: Math.max(1, index - 1),
          Home: 0,
          End: 5,
          Delete: 0,
          Backspace: 0,
        }[event.key];
        if (event.key === 'Escape') this.owner.port.focus();
        else if (next !== undefined || /^[0-5]$/.test(event.key)) this.rate(next ?? Number(event.key));
        else {
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
          return;
        }
        event.preventDefault();
        event.stopPropagation();
      };
    }
    rate(score) {
      const { owner, rowIndex, columnIndex, data, column } = this;
      if (owner.activate) owner.activate(rowIndex, columnIndex);
      else owner.choose(rowIndex, columnIndex);
      this.commit(score);
      // The workbench rebuilds its row nodes on commit. Resolve the new editor by record key.
      const key = owner.key ?? '_key';
      for (const { item } of owner.renderPool.active.values()) {
        if (item.column.field === column.field && item.data[key] === data[key] && item.focusTarget) {
          item.focusTarget.focus({ preventScroll: true });
          return;
        }
      }
      owner.port.focus({ preventScroll: true });
    }
    prepare() {
      const score = Number(this.value) || 0;
      this.element.setAttribute('aria-label', this.column.label + ': ' + score + ' of 5');
      this.focusTarget = this.element.children[Math.max(0, Math.min(4, score - 1))];
      Array.from(this.element.children).forEach((star, i) => {
        star.dataset.filled = String(i < score);
        star.setAttribute('aria-checked', String(i + 1 === score));
        star.disabled = !this.column.editable || !!this.data._rows;
        star.title = i + 1 === score ? 'Clear rating' : 'Rate ' + (i + 1) + ' of 5';
      });
    }
  }
  class CheckboxRenderer {
    constructor() {
      this.element = document.createElement('input');
      this.element.type = 'checkbox';
      this.element.onclick = (event) => {
        event.stopPropagation();
        const checked = this.element.checked;
        this.owner.activate(this.rowIndex, this.columnIndex);
        if (!this.commit(checked)) this.prepare();
      };
    }
    prepare() {
      this.element.checked = !!this.data[this.column.field];
      this.element.disabled = !this.column.editable || this.column.field === this.owner.key;
      this.element.setAttribute('aria-label', this.column.label);
    }
  }
  class MultilineEditor {
    constructor() {
      this.element = document.createElement('textarea');
      this.element.rows = 3;
    }
    prepare() {
      this.element.value = this.value ?? '';
    }
    get editedValue() {
      return this.element.value;
    }
  }
  class InputEditor {
    constructor() {
      this.element = document.createElement('input');
    }
    prepare() {
      const input = this.element,
        c = this.column;
      input.type =
        c.type === 'uri'
          ? 'url'
          : c.type === 'date'
            ? 'date'
            : c.type === 'number' || typeof this.value === 'number'
              ? 'number'
              : 'text';
      if (input.type === 'number') input.required = true;
      input.step = 'any';
      input.value = this.value ?? '';
      if (c.options) {
        const list = document.createElement('datalist');
        list.id = 'cg-choices-' + crypto.randomUUID();
        for (const v of c.options) list.append(new Option(v));
        input.setAttribute('list', list.id);
        this.choices = list;
        input.after(list);
      }
    }
    get editedValue() {
      return this.element.type === 'number' && this.element.value !== ''
        ? this.element.valueAsNumber
        : this.element.value;
    }
    validate() {
      return this.element.validity.valid || this.element.validationMessage;
    }
    discard() {
      this.choices?.remove();
    }
  }

  function normalizeColumn(column) {
    const field = column.field ?? column.dataField;
    if (!field) throw TypeError('Column needs a field or dataField');
    return { ...column, field, label: column.label ?? column.headerText ?? field };
  }
  function context(owner, data, column, rowIndex, columnIndex, label, states = {}) {
    const value = data?.[column.field];
    return {
      owner,
      data,
      column,
      value,
      rowIndex,
      columnIndex,
      label,
      selected: false,
      active: false,
      ...states,
      listData: { owner, rowIndex, columnIndex, dataField: column.field, label },
    };
  }
  function event(owner, type, detail, cancelable = false) {
    return (owner.host || owner.root).dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }));
  }
  Object.assign(ColibriGrid, {
    ClassFactory,
    ArrayCollection,
    ListCollectionView,
    UIComponent,
    GridItemRenderer,
    GridItemEditor,
    LabelRenderer,
    InputEditor,
    cells: {
      create,
      RendererPool,
      normalizeColumn,
      context,
      event,
      text: new ClassFactory(LabelRenderer),
      uriEditor: new ClassFactory(UriEditor),
      images: new ClassFactory(ImageRenderer),
      rating: new ClassFactory(RatingRenderer),
      checkbox: new ClassFactory(CheckboxRenderer),
      input: new ClassFactory(InputEditor),
      multiline: new ClassFactory(MultilineEditor),
    },
  });
})();

// Shared by grid clipboard operations and file import/export.
ColibriGrid.delimited = (() => {
  function parse(text, separator = ',') {
    const rows = [];
    let row = [],
      field = '',
      quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"' && quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"' && (quoted || !field)) quoted = !quoted;
      else if (!quoted && c === separator) {
        row.push(field);
        field = '';
      } else if (!quoted && (c === '\n' || c === '\r')) {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else field += c;
    }
    if (quoted) throw Error('Unclosed quoted field');
    if (row.length || field.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }
  function delimited(rows, separator) {
    return rows
      .map((row) =>
        row
          .map((value) => {
            const s = String(value ?? '');
            return s.includes(separator) || /["\r\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
          })
          .join(separator),
      )
      .join('\r\n');
  }
  function writeClipboard(clipboard, rows) {
    clipboard.setData('text/plain', delimited(rows, '\t'));
    const table = document.createElement('table');
    for (const row of rows) {
      const tr = table.insertRow();
      for (const value of row) tr.insertCell().textContent = String(value ?? '');
    }
    clipboard.setData('text/html', table.outerHTML);
  }
  function readClipboard(clipboard) {
    const html = clipboard.getData('text/html');
    if (html) {
      const template = document.createElement('template');
      template.innerHTML = html;
      const table = template.content.querySelector('table');
      if (table?.rows.length) {
        for (const br of table.querySelectorAll('br')) br.replaceWith('\n');
        return Array.from(table.rows, (tr) => Array.from(tr.cells, (td) => td.textContent));
      }
    }
    return parse(clipboard.getData('text/plain'), '\t');
  }
  async function copy(rows) {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      await navigator.clipboard.writeText(delimited(rows, '\t'));
      return;
    }
    const transfer = new DataTransfer();
    writeClipboard(transfer, rows);
    const formats = Object.fromEntries(
      transfer.types.map((type) => [type, new Blob([transfer.getData(type)], { type })]),
    );
    await navigator.clipboard.write([new ClipboardItem(formats)]);
  }
  async function paste() {
    if (!navigator.clipboard?.read) return parse(await navigator.clipboard.readText(), '\t');
    const transfer = new DataTransfer();
    for (const item of await navigator.clipboard.read()) {
      for (const type of item.types) {
        if (type === 'text/html' || type === 'text/plain')
          transfer.setData(type, await (await item.getType(type)).text());
      }
    }
    return readClipboard(transfer);
  }
  return { parse, delimited, readClipboard, writeClipboard, copy, paste };
})();
