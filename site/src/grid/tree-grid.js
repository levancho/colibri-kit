// The grid owns cell rendering, editing, sorting rules and viewport recycling.
class TreeRows {
  constructor(key, parentField, columnIndex, expanded) {
    this.key = key;
    this.parentField = parentField;
    this.columnIndex = columnIndex;
    this.open = new Set(expanded);
    this.searchClosed = new Set();
  }

  index(rows) {
    const children = new Map();
    for (const [id, row] of rows) {
      const parent = row[this.parentField] ?? null;
      if (parent !== null && !rows.has(parent)) throw new RangeError('Unknown parent for ' + id);
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(id);
    }
    const pending = [...(children.get(null) || [])];
    let count = 0;
    while (pending.length) {
      const id = pending.pop();
      count++;
      for (const child of children.get(id) || []) pending.push(child);
    }
    if (count !== rows.size) throw new RangeError('Tree rows contain a parent cycle');
    this.children = children;
    for (const id of this.open) if (!rows.has(id)) this.open.delete(id);
    for (const id of this.searchClosed) if (!rows.has(id)) this.searchClosed.delete(id);
  }

  project(rows, matches, compare, filterKey) {
    if (this.filterKey !== filterKey) this.searchClosed.clear();
    this.filterKey = filterKey;
    const included = new Set();
    if (filterKey) {
      for (const row of matches) {
        let id = row[this.key];
        while (id != null && !included.has(id)) {
          included.add(id);
          id = rows.get(id)[this.parentField];
        }
      }
    }
    const visible = [];
    const stack = [];
    this.meta = new Map();
    const siblings = parent => {
      let ids = this.children.get(parent) || [];
      if (filterKey) ids = ids.filter(id => included.has(id));
      if (compare) ids = ids.slice().sort((a, b) => compare(rows.get(a), rows.get(b)));
      return ids;
    };
    const push = (ids, level) => {
      for (let i = ids.length - 1; i >= 0; --i)
        stack.push({ id: ids[i], level, position: i + 1, size: ids.length });
    };
    push(siblings(null), 1);
    while (stack.length) {
      const node = stack.pop();
      const children = this.children.get(node.id);
      node.branch = !!children && (!filterKey || children.some(id => included.has(id)));
      node.expanded = node.branch && (filterKey ? !this.searchClosed.has(node.id) : this.open.has(node.id));
      this.meta.set(node.id, node);
      visible.push(rows.get(node.id));
      if (node.expanded) push(siblings(node.id), node.level + 1);
    }
    return visible;
  }

  setOpen(id, open) {
    if (this.filterKey) {
      if (open) this.searchClosed.delete(id);
      else this.searchClosed.add(id);
    } else if (open) this.open.add(id);
    else this.open.delete(id);
  }
}

export class ColibriTreeGrid extends window.ColibriGrid {
  constructor(host, options) {
    const { columns, treeField = columns[0].field, parentField = 'parentId', expanded = [] } = options;
    const columnIndex = columns.findIndex(column => column.field === treeField);
    if (columnIndex < 0) throw new TypeError('Unknown tree column: ' + treeField);
    if (options.readPage) throw new TypeError('TreeGrid requires a complete parent-linked collection');
    const model = new TreeRows(options.dataProvider?.key ?? options.key ?? 'id', parentField, columnIndex, expanded);
    super(host, {
      editorPresentation: 'inline', ...options, rowModel: model,
      columns: columns.map(column => column.field === parentField ? { ...column, editable: false } : column),
    });
    this.port.setAttribute('role', 'treegrid');
  }

  bindRow(row, i, start, sameRecord) {
    super.bindRow(row, i, start, sameRecord);
    const model = this.rowModel;
    const record = this.view[i];
    const node = model.meta.get(record[this.key]);
    row.setAttribute('aria-level', node.level);
    row.setAttribute('aria-posinset', node.position);
    row.setAttribute('aria-setsize', node.size);
    if (node.branch) row.setAttribute('aria-expanded', node.expanded);
    else row.removeAttribute('aria-expanded');
    const cell = row.children[model.columnIndex];
    cell.classList.add('cg-tree-cell');
    cell.style.setProperty('--cg-tree-indent', ((node.level - 1) * 18) + 'px');
    let toggle = cell.querySelector(':scope > .cg-tree-toggle');
    if (!node.branch) {
      toggle?.remove();
      return;
    }
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.tabIndex = -1;
      toggle.className = 'cg-tree-toggle';
      cell.prepend(toggle);
      toggle.ondblclick = event => event.stopPropagation();
      toggle.onclick = event => {
        event.stopPropagation();
        const index = Number(row.dataset.index);
        const id = this.view[index][this.key];
        this.activate(index, model.columnIndex);
        this.setExpanded(id, !model.meta.get(id).expanded);
        this.port.focus({ preventScroll: true });
      };
    }
    const label = this.renderPool.active.get(cell).item.label;
    toggle.setAttribute('aria-label', (node.expanded ? 'Collapse ' : 'Expand ') + label);
  }

  setExpanded(id, expanded) {
    if (!this.rowModel.children.has(id) || id == null) return;
    this.rowModel.setOpen(id, expanded);
    this.refreshBranches();
  }

  expandAll() { this.setAllExpanded(true); }
  collapseAll() { this.setAllExpanded(false); }

  setAllExpanded(open) {
    for (const id of this.rowModel.children.keys()) if (id != null) this.rowModel.setOpen(id, open);
    this.refreshBranches();
  }

  refreshBranches() {
    if (this.session) this.endItemEditorSession(true);
    const model = this.rowModel;
    let parent = this.byId.get(this.activeId)?.[model.parentField];
    while (parent != null) {
      if (model.filterKey ? model.searchClosed.has(parent) : !model.open.has(parent)) this.activeId = parent;
      parent = this.byId.get(parent)?.[model.parentField];
    }
    this.refresh(true);
  }

  navigate(event) {
    const model = this.rowModel;
    if (event.target === this.port && this.column === model.columnIndex && this.view.length &&
        !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const row = this.view[this.index];
      const node = model.meta.get(row[this.key]);
      if (event.key === 'ArrowRight' && node.branch) {
        event.preventDefault();
        if (node.expanded) this.activate(this.index + 1, this.column);
        else this.setExpanded(node.id, true);
        return;
      }
      if (event.key === 'ArrowLeft' && (node.expanded || node.level > 1)) {
        event.preventDefault();
        if (node.expanded) this.setExpanded(node.id, false);
        else this.activate(this.view.findIndex(r => r[this.key] === row[model.parentField]), this.column);
        return;
      }
    }
    super.navigate(event);
  }
}
