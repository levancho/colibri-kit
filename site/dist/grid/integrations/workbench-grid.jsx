import React, { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import '/grid/files.js';
import '/grid/workbench.js';

// Built-in Flex-style cell factories keep their edit/focus contract. Application
// renderCell functions, plain values, rows, and the viewport are rendered by React.
function WorkbenchCell({ frame, row, column, index, j }) {
  const { book } = frame;
  const cell = useRef(null);
  const tree = column === book.treeColumn;
  const value = row[column.field];
  const label = book.display(row, column);
  const group = tree && row._rows;
  const render = !row._rows && column.renderCell;
  const factory = !row._rows && !render && (column.itemRenderer || column.itemRendererFunction ||
    window.ColibriGrid.renderers[column.kind] || window.ColibriGrid.renderers[column.type]);
  useLayoutEffect(() => {
    const element = cell.current;
    if (factory) {
      book.attachCellRenderer(element, row, column, index, j, label);
      return () => book.renderPool.release(element);
    }
  }, [frame, factory, row, column, index, j, label]);
  const depth = row._rows ? row._depth : book.groups.length;
  const style = {};
  if (tree) style['--wb-tree-indent'] = depth * 16 + 'px';
  if (column.heat && Number.isFinite(value)) {
    const percent = Math.max(8, Math.min(76, Math.round(value / 1400)));
    style.background = 'color-mix(in srgb, var(--wb-heat) ' + percent + '%, var(--ui-card))';
  }
  if (column.pin) {
    const left = column.pin === 'left';
    const peers = left ? book.cols.slice(0, j) : book.cols.slice(j + 1);
    style[column.pin] = peers.reduce((n, c) => n + (c.pin === column.pin ? c.width : 0), left ? 82 : 44);
  }
  const classes = ['wb-cell', tree && 'wb-tree-cell', tree && !group && 'wb-tree-leaf',
    column.type === 'number' && 'wb-num', column.pin && 'wb-frozen'].filter(Boolean).join(' ');
  const active = book.active?.r === index && book.active?.c === j;
  return (
    <div ref={cell} className={classes} role="gridcell" data-cell="" data-field={column.field}
      data-r={index} data-c={j} data-active={active ? '' : undefined}
      data-range={book.within(index, j) ? '' : undefined} style={style}
      aria-readonly={!column.editable || !!row._rows || column.field === book.dataProvider?.key}
      title={book.tip === 'Off' ? undefined : book.tip === 'Cell data' ? label :
        book.cols.map(c => book.t(c.label) + ': ' + book.display(row, c)).join('\n')}
      onPointerDown={event => {
        if (event.button !== 0 || event.target.closest('button,input')) return;
        book.choose(index, j, event.shiftKey);
        book.dragRange = true;
        book.port.focus({ preventScroll: true });
      }}
      onPointerEnter={event => {
        if (event.buttons === 1 && (book.dragRange || book.fillStart)) {
          book.active = { r: index, c: j };
          book.highlight();
        }
      }}
      onDoubleClick={() => book.editCell(index, j)}>
      {group ? <>
        <button type="button" className="wb-tree-toggle" title={label} aria-label={label + ' (' + row._rows.length + ')'} aria-expanded={book.openGroups.has(row._groupKey)}
          onClick={() => {
            if (book.openGroups.has(row._groupKey)) book.openGroups.delete(row._groupKey);
            else book.openGroups.add(row._groupKey);
            book.redraw();
          }}>
          <span className="wb-tree-label">{row._label}</span>
          <span className="wb-tree-count"> ({row._rows.length})</span>
        </button>
        <button type="button" className="wb-branch-menu" aria-haspopup="menu"
          aria-label={book.t('Group actions') + ' · ' + label} onClick={event => book.menu(event.currentTarget, [
            ['Expand this branch', () => book.setGroupsExpanded(true, row)],
            ['Collapse this branch', () => book.setGroupsExpanded(false, row)],
          ])}>⋯</button>
      </> : render ? render({ row, column, value, label }) : factory ? null :
        <span>{(column.flags?.[value] ? column.flags[value] + '  ' : '') + label}</span>}
    </div>
  );
}

function WorkbenchRow({ frame, row, index, top }) {
  const { book } = frame;
  const line = useRef(null);
  const grip = useRef(null);
  useLayoutEffect(() => {
    if (!row._rows) {
      book.draggable(grip.current, 'row', row._key);
      book.drop(line.current, 'row', id => book.reorderRows(id, row._key));
    }
  }, [book, row]);
  const selected = book.selected.has(row._key);
  const grouped = book.cols.includes(book.treeColumn);
  const match = book.searchBehavior === 'highlight' && book.query && book.baseCols.some(c =>
    (!book.searchFields || book.searchFields.includes(c.field)) &&
    String(row[c.field] ?? '').toLocaleLowerCase().includes(book.query));
  return (
    <div ref={line} className="wb-line wb-row" role="row" data-id={row._key} style={{ top }}
      aria-rowindex={index + 3} aria-selected={selected} data-selected={selected ? '' : undefined}
      data-match={match ? '' : undefined} aria-level={grouped ? 1 + (row._rows ? row._depth : book.groups.length) : undefined}
      aria-expanded={grouped && row._rows ? book.openGroups.has(row._groupKey) : undefined}>
      <div className="wb-rail">
        {!row._rows && <>
          <span className="wb-grip" title="Drag row" ref={grip}>⠿</span>
          <label className="wb-check">
            <input type="checkbox" aria-label={'Select row ' + (index + 1)} checked={selected}
              onChange={event => {
                if (event.target.checked) book.selected.add(row._key);
                else book.selected.delete(row._key);
                book.headers(); book.paintRows(); book.footer();
              }} />
          </label>
        </>}
        <span>{index + 1 + (book.paged ? book.page * book.pageSize : 0)}</span>
      </div>
      {book.cols.map((column, j) => <WorkbenchCell key={column.field} frame={frame} row={row} column={column} index={index} j={j} />)}
      <div className="wb-actions">{!row._rows &&
        <button type="button" aria-label={'Row actions ' + (index + 1)} onClick={event => book.rowMenu(event.currentTarget, row)}>⋮</button>}
      </div>
    </div>
  );
}

export function ColibriWorkbenchGrid({ rows, columns, onRowsChange, onImport, theme = 'Colibri', onThemeChange,
  paged = false, totals = false, pageSize = 50, searchFields, searchBehavior = 'filter', label = 'Data grid' }) {
  const host = useRef(null);
  const parts = useRef({});
  const api = useRef(null);
  const supplied = useRef({});
  const callbacks = useRef({});
  const syncing = useRef(false);
  const [frame, setFrame] = useState(null);
  useLayoutEffect(() => { callbacks.current = { onRowsChange, onImport, onThemeChange }; });

  useLayoutEffect(() => {
    const element = host.current;
    syncing.current = true;
    const book = new window.ColibriGrid.Workbench(element, {
      columns, dataProvider: new window.ColibriGrid.ArrayCollection(rows), label, structure: parts.current,
      renderWindow: next => {
        // Keyboard editing may target a newly scrolled row immediately after paintRows.
        if (syncing.current) setFrame(next);
        else flushSync(() => setFrame(next));
      },
    });
    api.current = book;
    supplied.current = { columns, rows };
    book.panel = '';
    syncing.current = false;
    const events = new AbortController();
    element.addEventListener('colibri-rows-change', ({ detail }) => {
      const next = detail.rows.map(({ _key, ...record }) => record);
      supplied.current.rows = next;
      callbacks.current.onRowsChange?.(next);
    }, { signal: events.signal });
    element.addEventListener('colibri-data-import', ({ detail }) => {
      supplied.current = detail;
      callbacks.current.onImport?.(detail);
    }, { signal: events.signal });
    element.addEventListener('themeChange', ({ detail }) => {
      callbacks.current.onThemeChange?.(detail.skin);
    }, { signal: events.signal });
    return () => { events.abort(); book.destroy(); api.current = null; };
  }, []);

  useLayoutEffect(() => {
    const book = api.current;
    syncing.current = true;
    try {
      if (columns !== supplied.current.columns) {
        book.setDataProvider(new window.ColibriGrid.ArrayCollection(rows), columns);
      } else if (rows !== supplied.current.rows) {
        if (book.dataProvider) book.dataProvider.replaceAll(rows);
        else book.replaceData(columns, rows);
      }
      supplied.current = { columns, rows };
    } finally { syncing.current = false; }
  }, [columns, rows]);
  useLayoutEffect(() => {
    const book = api.current;
    syncing.current = true;
    try {
      Object.assign(book, { paged, totals, pageSize, searchFields, searchBehavior });
      book.resetPosition();
      book.redraw();
    } finally { syncing.current = false; }
  }, [paged, totals, pageSize, searchFields, searchBehavior]);
  useLayoutEffect(() => {
    const book = api.current;
    book.setTheme(theme);
    if (theme !== 'Colibri') return;
    const sync = () => { book.root.dataset.theme = document.documentElement.dataset.theme || 'light'; };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [theme]);
  useLayoutEffect(() => {
    if (!frame) return;
    const { book } = frame;
    book.pinBody.style.top = book.head.offsetHeight + 'px';
    book.renderPool.trim();
    book.updateHandle();
    book.positionEditor();
  }, [frame]);
  function part(name) { return node => { parts.current[name] = node; }; }
  const book = frame?.book;
  return (
    <div id="workbook" ref={host}>
      <section className="wb ui-root" ref={part('root')}>
        <div className="wb-menu" ref={part('bar')} />
        <div className="wb-groups" ref={part('groupbar')} />
        <div className="wb-layout" ref={part('layout')}>
          <div className="wb-port" role="grid" aria-label={label} tabIndex={0} ref={part('port')}>
            <div className="wb-sheet" ref={part('sheet')}>
              <div className="wb-head" ref={part('head')} />
              <div className="wb-pins" ref={part('pinBody')}>
                {book?.pinRows.map((row, i) => <WorkbenchRow key={row._key} frame={frame} row={row} index={i} />)}
              </div>
              <div className="wb-content" ref={part('content')}>
                {book?.list.slice(frame.first, frame.end).map((row, i) =>
                  <WorkbenchRow key={row._key} frame={frame} row={row} index={frame.first + i + book.pinRows.length}
                    top={(frame.first + i) * book.rowHeight} />)}
              </div>
              <div className="wb-summary" ref={part('summary')} />
            </div>
          </div>
          <aside className="wb-side" ref={part('side')} />
        </div>
        <div className="wb-foot" ref={part('foot')} />
      </section>
    </div>
  );
}
