import React, { useLayoutEffect, useRef } from 'react';
import { baseColumns } from '../cells.js';

// The grid owns the viewport in React. A cell factory owns only its cell content.
function ItemRenderer({ factory, row, column, value, commit, moveFocus }) {
  const host = useRef(null);
  const instance = useRef(null);
  useLayoutEffect(() => {
    const item = factory();
    instance.current = item;
    host.current.replaceChildren(item.element);
    return () => {
      item.destroy?.();
      instance.current = null;
    };
  }, [factory]);
  useLayoutEffect(() => {
    Object.assign(instance.current, { commit, moveFocus });
  });
  useLayoutEffect(() => {
    const item = instance.current;
    if (item.data !== row) item.discard?.();
    Object.assign(item, { data: row, column, value });
    item.prepare();
  }, [factory, row, column, value]);
  return <span ref={host} />;
}

function Rating({ value, column, commit }) {
  const score = Number(value) || 0;
  function onKey(event) {
    const index = Number(event.target.value);
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
    if (event.key === 'Escape') event.currentTarget.closest('[role=grid]').focus();
    else if (next !== undefined || /^[0-5]$/.test(event.key)) {
      const rating = next ?? Number(event.key);
      if (commit(rating)) event.currentTarget.children[Math.max(0, rating - 1)].focus();
    } else return;
    event.preventDefault();
    event.stopPropagation();
  }
  return (
    <span
      className="cg-stars"
      role="radiogroup"
      aria-label={column.label + ': ' + score + ' of 5'}
      onKeyDown={onKey}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          role="radio"
          value={n}
          tabIndex={-1}
          aria-checked={score === n}
          aria-label={n + (n === 1 ? ' star' : ' stars')}
          data-filled={n <= score}
          disabled={!column.editable}
          title={score === n ? 'Clear rating' : 'Rate ' + n + ' of 5'}
          onClick={(event) => {
            if (event.detail < 2) commit(score === n ? 0 : n);
          }}
        />
      ))}
    </span>
  );
}

function editorFor(column) {
  const { field } = column;
  if (column.multiline)
    return ({ value, onChange }) => <textarea aria-label={column.label} value={value} onChange={(e) => onChange(e.target.value)} />;
  if (field === 'time' || field === 'datetime' || field === 'progress') {
    const type = field === 'time' ? 'time' : field === 'datetime' ? 'datetime-local' : 'range';
    return ({ value, onChange }) => (
      <input aria-label={column.label} type={type} max={column.max ?? 100} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }
}

export function reactColumn(definition) {
  const { itemRenderer, itemEditor, validator, ...column } = definition;
  return {
    ...column,
    validate: validator,
    renderEditor: editorFor(definition),
    renderCell:
      definition.field === 'rating'
        ? (props) => <Rating {...props} />
        : itemRenderer && ((props) => <ItemRenderer {...props} factory={itemRenderer} />),
  };
}
export const projectColumns = baseColumns.map(reactColumn);
