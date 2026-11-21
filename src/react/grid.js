// React owns the headers, viewport, visible rows, selection, menus and editor lifetime.
import {
  createElement as h,
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
} from 'react';
import { readClipboard, writeClipboard, copy, paste } from './clipboard.js';
const empty = [];
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const clamp = (n, max) => Math.max(0, Math.min(n, max));
const raw = (row, col) => row[col.field] ?? '';
function rectangle(a, b) {
  return {
    top: Math.min(a.r, b.r),
    bottom: Math.max(a.r, b.r),
    left: Math.min(a.c, b.c),
    right: Math.max(a.c, b.c),
  };
}
function parseValue(col, v) {
  if (col.parse) return col.parse(v);
  if (col.type === 'number') {
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) throw Error('Enter a finite number.');
    return n;
  }
  if (col.type === 'boolean') {
    if ([true, 'true', '1', 'yes'].includes(typeof v === 'string' ? v.toLowerCase() : v)) return true;
    if ([false, '', 'false', '0', 'no'].includes(typeof v === 'string' ? v.toLowerCase() : v)) return false;
    throw Error('Enter true or false.');
  }
  return v;
}
export const ColibriGrid = forwardRef(function ColibriGrid(
  {
    columns,
    rows,
    defaultRows = empty,
    onRowsChange,
    onSelectionChange,
    getRowId = (r) => r.id,
    query = '',
    label = 'Data grid',
    height = 420,
    rowHeight = 36,
    pinnedColumns = 0,
    overscan = 3,
    editorPresentation = 'dialog',
  },
  ref,
) {
  const [local, setLocal] = useState(defaultRows),
    data = rows ?? local,
    [order, setOrder] = useState(null),
    [scroll, setScroll] = useState(0);
  const [active, setActive] = useState({ r: 0, c: 0 }),
    [anchor, setAnchor] = useState(active),
    [edit, setEdit] = useState(null),
    [draft, setDraft] = useState(null),
    [menu, setMenu] = useState(null),
    [error, setError] = useState('');
  const port = useRef(null),
    drag = useRef(null),
    focusEditor = useRef(null),
    menuRoot = useRef(null),
    id = useId();
  const result = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    let view = q
      ? data.filter((r) => columns.some((c) => String(raw(r, c)).toLocaleLowerCase().includes(q)))
      : data;
    const col = columns.find((c) => c.field === order?.field);
    if (col) {
      view = [...view].sort((a, b) => {
        const x = raw(a, col),
          y = raw(b, col);
        return (
          order.direction *
          (col.compare
            ? col.compare(x, y)
            : typeof x === 'number' && typeof y === 'number'
              ? x - y
              : collator.compare(String(x), String(y)))
        );
      });
    }
    return view;
  }, [data, columns, query, order]);
  const safe = (p) => ({ r: clamp(p.r, result.length - 1), c: clamp(p.c, columns.length - 1) }),
    cell = safe(active),
    region = rectangle(safe(anchor), cell);
  const first = clamp(Math.floor(scroll / rowHeight) - overscan, result.length - 1),
    last = Math.min(result.length, Math.ceil((scroll + height) / rowHeight) + overscan);
  useEffect(() => {
    if (port.current && port.current.scrollTop !== scroll) setScroll(port.current.scrollTop);
  }, [result.length, height, rowHeight, scroll]);
  useEffect(() => {
    if (!edit) return;
    const el = focusEditor.current?.querySelector('input,select,textarea,[tabindex]');
    el?.focus();
    if (el?.type !== 'range') el?.select?.();
  }, [edit]);
  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (!menuRoot.current?.contains(e.target)) setMenu(null);
    };
    const key = (e) => {
      if (e.key === 'Escape') {
        setMenu(null);
        port.current?.focus();
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    menuRoot.current?.querySelector('button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', key);
    };
  }, [menu]);
  function select(r, c, extend = false, reveal = true) {
    const next = safe({ r, c }),
      origin = extend ? safe(anchor) : next;
    if (!extend) setAnchor(next);
    setActive(next);
    onSelectionChange?.(rectangle(origin, next));
    if (reveal && port.current) {
      const p = port.current,
        y = next.r * rowHeight;
      if (y < p.scrollTop) p.scrollTop = y;
      else if (y + 2 * rowHeight > p.scrollTop + p.clientHeight) p.scrollTop = y + 2 * rowHeight - p.clientHeight;
      const header = p.querySelector('[data-head="' + next.c + '"]');
      if (header && next.c >= pinnedColumns) {
        const left = columns.slice(0, pinnedColumns).reduce((n, c) => n + (c.width ?? 140), 0);
        const view = p.getBoundingClientRect(),
          box = header.getBoundingClientRect();
        if (box.left < view.left + left) p.scrollLeft -= view.left + left - box.left;
        else if (box.right > view.right) p.scrollLeft += box.right - view.right;
      }
    }
  }
  useImperativeHandle(
    ref,
    () => ({
      focus: () => port.current?.focus(),
      selectCell: (r, c) => select(r, c),
      selectRange: (top, left, bottom, right) => {
        const origin = safe({r: top, c: left});
        const end = safe({r: bottom, c: right});
        setAnchor(origin);
        setActive(end);
        onSelectionChange?.(rectangle(origin, end));
      },
      editCell: (r, c) => start(r, c),
      getSelection: () => region,
      getVisibleRows: () => {
        const el = port.current;
        if (!el || !el.clientHeight) return [];
        const box = el.getBoundingClientRect();
        const top = Math.max(0, -box.top);
        const bottom = Math.min(el.clientHeight, window.innerHeight - box.top);
        if (bottom <= Math.max(rowHeight, top) || box.right <= 0 || box.left >= window.innerWidth) return [];
        return result.slice(
          Math.floor((el.scrollTop + Math.max(0, top - rowHeight)) / rowHeight),
          Math.ceil((el.scrollTop + bottom - rowHeight) / rowHeight),
        );
      },
    }),
    [result, columns, anchor, active, pinnedColumns, rowHeight, onSelectionChange, getRowId],
  );
  function change(entries) {
    try {
      const patches = new Map(),
        changes = [];
      for (const [row, col, v] of entries) {
        if (!col.editable) continue;
        const key = getRowId(row),
          value = parseValue(col, v),
          valid = col.validate?.(value, row);
        if (valid === false || typeof valid === 'string')
          throw Error(typeof valid === 'string' ? valid : 'Invalid ' + col.label);
        if (Object.is(row[col.field], value)) continue;
        patches.set(key, { ...patches.get(key), [col.field]: value });
        changes.push({ id: key, field: col.field, previous: row[col.field], value });
      }
      if (changes.length) {
        const next = data.map((r) => (patches.has(getRowId(r)) ? { ...r, ...patches.get(getRowId(r)) } : r));
        if (rows === undefined) setLocal(next);
        onRowsChange?.(next, changes);
      }
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  function start(r, c) {
    const row = result[r],
      col = columns[c];
    if (!row || !col?.editable) return;
    select(r, c);
    setError('');
    if (col.rendererIsEditor) {
      const focusInline = () => {
        const target = port.current?.querySelector(
          '[aria-rowindex="' + (r + 2) + '"] [aria-colindex="' + (c + 1) + '"]',
        );
        const control =
          target?.querySelector('[aria-checked=true]') ?? target?.querySelector('button,input,select,[tabindex]');
        if (control?.hasAttribute('data-inline-trigger')) control.click();
        else control?.focus({ preventScroll: true });
        return !!control;
      };
      if (!focusInline()) requestAnimationFrame(focusInline);
      return;
    }
    setEdit({ key: getRowId(row), field: col.field });
    setDraft(raw(row, col));
  }
  function close() {
    setEdit(null);
    setError('');
    port.current?.focus();
  }
  const editingColumn = columns.find((c) => c.field === edit?.field),
    editingRow = edit ? data.find((r) => getRowId(r) === edit.key) : undefined;
  useEffect(() => {
    if (edit && (!editingColumn || !editingRow)) setEdit(null);
  }, [edit, editingRow, editingColumn]);
  function updateDraft(value) {
    setDraft(value);
    setError('');
  }
  function save() {
    if (!change([[editingRow, editingColumn, draft]])) return false;
    close();
    return true;
  }
  function values(rect = region) {
    return result
      .slice(rect.top, rect.bottom + 1)
      .map((row) => columns.slice(rect.left, rect.right + 1).map((col) => raw(row, col)));
  }
  function apply(matrix, rect = region, tile = false) {
    if (!matrix?.length) return;
    const entries = [];
    const endR = Math.min(result.length - 1, tile ? rect.bottom : rect.top + matrix.length - 1);
    for (let r = rect.top; r <= endR; r++) {
      const line = matrix[(r - rect.top) % matrix.length];
      if (!line.length) continue;
      for (
        let c = rect.left;
        c <= Math.min(columns.length - 1, tile ? rect.right : rect.left + line.length - 1);
        c++
      )
        entries.push([result[r], columns[c], line[(c - rect.left) % line.length]]);
    }
    change(entries);
  }
  function onKey(e) {
    if (e.target !== port.current || !result.length || !columns.length) return;
    const cmd = e.ctrlKey || e.metaKey,
      k = e.key.toLowerCase();
    if (cmd && ['d', 'r', 'a'].includes(k)) {
      e.preventDefault();
      if (k === 'a') {
        setAnchor({ r: 0, c: 0 });
        setActive({ r: result.length - 1, c: columns.length - 1 });
        onSelectionChange?.({ top: 0, left: 0, bottom: result.length - 1, right: columns.length - 1 });
      } else
        apply(
          values(k === 'd' ? { ...region, bottom: region.top } : { ...region, right: region.left }),
          region,
          true,
        );
      return;
    }
    const delta = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      Tab: [0, e.shiftKey ? -1 : 1],
    }[e.key];
    if (delta) {
      if (e.key === 'Tab' && (e.shiftKey ? cell.c === 0 : cell.c === columns.length - 1)) return;
      e.preventDefault();
      select(cell.r + delta[0], cell.c + delta[1], e.shiftKey && e.key !== 'Tab');
    } else if (['Enter', 'F2'].includes(e.key)) {
      e.preventDefault();
      start(cell.r, cell.c);
    } else if (['Backspace', 'Delete'].includes(e.key)) {
      e.preventDefault();
      apply([['']], region, true);
    } else if (['Home', 'End'].includes(e.key)) {
      e.preventDefault();
      select(
        cmd ? (e.key === 'Home' ? 0 : result.length - 1) : cell.r,
        e.key === 'Home' ? 0 : columns.length - 1,
        e.shiftKey,
      );
    }
  }
  function sort(col, direction) {
    setOrder({ field: col.field, direction });
    setMenu(null);
    port.current?.focus();
  }
  const tracks = columns.map((c) => 'minmax(' + (c.width ?? 140) + 'px,1fr)').join(' '),
    width = columns.reduce((n, c) => n + (c.width ?? 140), 0);
  const pin = (i, header = false) =>
    i < pinnedColumns
      ? {
          position: 'sticky',
          left: columns.slice(0, i).reduce((n, c) => n + (c.width ?? 140), 0),
          background: 'var(--ui-card,white)',
          zIndex: header ? 3 : 1,
        }
      : undefined;
  const inline = editorPresentation === 'inline';
  useEffect(() => {
    if (!inline || !edit) return;
    const outside = e => {
      if (focusEditor.current?.contains(e.target)) return;
      if (!editingRow || !editingColumn) return;
      if ((e.type === 'pointerdown' || e.detail === 0) && save()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      focusEditor.current?.querySelector('input,select,textarea')?.focus({preventScroll:true});
    };
    const scope = new AbortController();
    for (const type of ['pointerdown', 'click'])
      document.addEventListener(type, outside, {capture:true, signal:scope.signal});
    return () => scope.abort();
  }, [inline, edit, draft, editingRow, editingColumn]);
  useEffect(() => {
    if (inline && edit && !focusEditor.current) setEdit(null);
  }, [inline, edit, first, last, result]);
  const editorForm = edit &&
      editingColumn &&
      editingRow &&
      h(
        'form',
        {
          ref: focusEditor,
          className: inline ? 'cg-inline-editor' : 'react-grid-editor',
          onPointerDown: e => e.stopPropagation(),
          onDoubleClick: e => e.stopPropagation(),
          'aria-label': 'Edit ' + editingColumn.label,
          onSubmit: (e) => {
            e.preventDefault();
            save();
          },
          onKeyDown: (e) => {
            e.stopPropagation();
            if (e.nativeEvent.isComposing) return;
            if (inline && e.key === 'Tab') {
              e.preventDefault();
              if (save()) select(cell.r, cell.c + (e.shiftKey ? -1 : 1));
            } else if (inline && e.key === 'Enter' && !e.shiftKey && e.target.tagName === 'TEXTAREA') {
              e.preventDefault();
              save();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              close();
            }
          },
        },
        h(
          'label',
          null,
          !inline && editingColumn.label,
          editingColumn.renderEditor
            ? editingColumn.renderEditor({
                row: editingRow,
                column: editingColumn,
                value: draft,
                onChange: updateDraft,
                save,
                cancel: close,
              })
            : h('input', {
                'aria-label': editingColumn.label,
                'aria-invalid': Boolean(error),
                type: editingColumn.type === 'number' ? 'number' : editingColumn.type === 'date' ? 'date' : 'text',
                value: draft ?? '',
                onChange: (e) => updateDraft(e.target.value),
              }),
        ),
        h('button', { type: 'button', onClick: close, 'aria-label': 'Cancel' }, inline ? '×' : 'Cancel'),
        h('button', { type: 'submit', 'aria-label': 'Save' }, inline ? '✓' : 'Save'),
        inline && error && h('output', { role: 'alert' }, error),
      );
  const body = [];
  for (let r = first; r < last; r++) {
    const row = result[r];
    body.push(
      h(
        'div',
        {
          key: getRowId(row),
          role: 'row',
          'aria-rowindex': r + 2,
          className: 'cg-row',
          style: { top: r * rowHeight, height: rowHeight },
        },
        columns.map((col, c) => {
          const val = raw(row, col),
            selected = r >= region.top && r <= region.bottom && c >= region.left && c <= region.right,
            focus = r === cell.r && c === cell.c;
          const startEdit = () => start(r, c);
          return h(
            'div',
            {
              key: col.field,
              role: 'gridcell',
              id: id + '-' + r + '-' + c,
              'aria-colindex': c + 1,
              'data-numeric': col.type === 'number' ? '' : undefined,
              'aria-readonly': !col.editable,
              'aria-selected': selected,
              'data-range': selected ? '' : undefined,
              'data-active': focus ? '' : undefined,
              'data-fill': r === region.bottom && c === region.right ? '' : undefined,
              style: pin(c),
              onPointerDown: (e) => {
                if (e.button !== 0) return;
                if (e.target.closest('[data-inline-trigger]')) { select(r,c,false,false); return; }
                if (e.target.closest('button,input,select,a')) return;
                e.preventDefault();
                const b = e.currentTarget.getBoundingClientRect();
                const fill =
                  r === region.bottom && c === region.right && b.right - e.clientX < 8 && b.bottom - e.clientY < 8;
                drag.current = { fill, region };
                if (!fill) select(r, c, e.shiftKey, false);
                port.current?.focus();
              },
              onPointerEnter: (e) => {
                if (drag.current && e.buttons === 1) select(r, c, true, false);
              },
              onPointerUp: () => {
                if (drag.current?.fill)
                  apply(
                    values(drag.current.region),
                    rectangle({ r: drag.current.region.top, c: drag.current.region.left }, { r, c }),
                    true,
                  );
                drag.current = null;
              },
              onContextMenu: (e) => {
                e.preventDefault();
                if (!selected) select(r, c);
                setMenu({
                  cell: true,
                  left: Math.max(0, Math.min(e.clientX, innerWidth - 170)),
                  top: Math.max(0, Math.min(e.clientY, innerHeight - 200)),
                });
              },
              onDoubleClick: startEdit,
            },
            inline && edit?.key === getRowId(row) && edit.field === col.field ? editorForm : col.renderCell
              ? col.renderCell({
                  row,
                  column: col,
                  value: val,
                  startEdit,
                  moveFocus: offset => { select(r, c + offset); port.current?.focus({preventScroll:true}); },
                  commit: (value) => {
                    select(r, c);
                    return change([[row, col, value]]);
                  },
                })
              : col.type === 'boolean'
                ? h('input', {
                    type: 'checkbox',
                    'aria-label': col.label,
                    checked: !!val,
                    disabled: !col.editable,
                    onChange: (e) => change([[row, col, e.target.checked]]),
                  })
                : String(val),
          );
        }),
      ),
    );
  }
  return h(
    'section',
    { className: 'cg ui-root react-grid', style: { '--cg-columns': tracks, '--cg-min-width': width + 'px' } },
    h(
      'div',
      {
        ref: port,
        className: 'cg-port',
        role: 'grid',
        'aria-label': label,
        'aria-rowcount': result.length + 1,
        'aria-colcount': columns.length,
        'aria-activedescendant':
          result.length && cell.r >= first && cell.r < last ? id + '-' + cell.r + '-' + cell.c : undefined,
        tabIndex: 0,
        style: { height },
        onScroll: (e) => setScroll(e.currentTarget.scrollTop),
        onKeyDown: onKey,
        onCopy: (e) => {
          if (e.target.closest('textarea,input:not([type=checkbox]),[contenteditable=true]')) return;
          e.preventDefault();
          writeClipboard(e.clipboardData, values());
        },
        onCut: (e) => {
          if (e.target.closest('textarea,input:not([type=checkbox]),[contenteditable=true]')) return;
          e.preventDefault();
          writeClipboard(e.clipboardData, values());
          apply([['']], region, true);
        },
        onPaste: (e) => {
          if (e.target.closest('textarea,input:not([type=checkbox]),[contenteditable=true]')) return;
          e.preventDefault();
          try {
            apply(readClipboard(e.clipboardData));
          } catch (err) {
            setError(err.message);
          }
        },
      },
      h(
        'div',
        { className: 'cg-sheet' },
        h(
          'div',
          { role: 'row', className: 'cg-row cg-head', style: { height: rowHeight } },
          columns.map((col, i) =>
            h(
              'div',
              {
                key: col.field,
                'data-head': i,
                role: 'columnheader',
                'data-numeric': col.type === 'number' ? '' : undefined,
                className: 'cg-menu-head',
                'aria-sort':
                  order?.field === col.field ? (order.direction === 1 ? 'ascending' : 'descending') : undefined,
                style: pin(i, true),
              },
              h(
                'button',
                { type: 'button', onClick: () => sort(col, order?.field === col.field ? -order.direction : 1) },
                col.label,
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'cg-menu-trigger',
                  'aria-label': 'Options ' + col.label,
                  'aria-haspopup': 'menu',
                  onClick: (e) => {
                    const box = e.currentTarget.getBoundingClientRect();
                    setMenu({ col, top: box.bottom, left: Math.min(box.left, window.innerWidth - 180) });
                  },
                },
                '⋮',
              ),
            ),
          ),
        ),
        h('div', { role: 'rowgroup', className: 'cg-canvas', style: { height: result.length * rowHeight } }, body),
      ),
    ),
    menu &&
      h(
        'div',
        {
          ref: menuRoot,
          role: 'menu',
          className: 'react-grid-menu',
          style: { position: 'fixed', top: menu.top, left: menu.left },
        },
        menu.cell
          ? ['Copy', 'Paste', 'Fill down', 'Fill right', 'Clear'].map((action) =>
              h(
                'button',
                {
                  type: 'button',
                  key: action,
                  role: 'menuitem',
                  onClick: async () => {
                    setMenu(null);
                    port.current?.focus();
                    try {
                      if (action === 'Copy') await copy(values());
                      else if (action === 'Paste') apply(await paste());
                      else if (action === 'Clear') apply([['']], region, true);
                      else
                        apply(
                          values(
                            action === 'Fill down'
                              ? { ...region, bottom: region.top }
                              : { ...region, right: region.left },
                          ),
                          region,
                          true,
                        );
                    } catch (err) {
                      setError(err.message);
                    }
                  },
                },
                action,
              ),
            )
          : [1, -1].map((d) =>
              h(
                'button',
                { key: d, type: 'button', role: 'menuitem', onClick: () => sort(menu.col, d) },
                d === 1 ? 'Sort ascending' : 'Sort descending',
              ),
            ),
      ),
    !inline && editorForm,
    error && !(inline && edit) && h('output', { role: 'alert' }, error),
  );
});
