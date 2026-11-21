import React, { useLayoutEffect, useRef, useState } from 'react';
import { baseColumns, phases, teams } from '../cells.js';

// The grid owns the viewport in React. A cell factory owns only its cell content.
function ItemRenderer({ factory, row, column, value }) {
  const host = useRef(null);
  useLayoutEffect(() => {
    const item = factory();
    Object.assign(item, { data: row, column, value });
    item.prepare();
    host.current.replaceChildren(item.element);
    return () => item.destroy?.();
  }, [factory, row, column, value]);
  return <span ref={host} />;
}

function TagEditor({ value, onChange, column }) {
  const [text, setText] = useState('');
  const tags = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const free = column.field === 'freeTags';
  function add(tag) {
    tag = tag.trim();
    if (tag && (free || !tags.includes(tag))) onChange([...tags, tag].join(', '));
    setText('');
  }
  return (
    <span className="tag-editor">
      <span>
        {tags.map((tag, i) => (
          <button type="button" key={i} onClick={() => onChange(tags.filter((_, j) => j !== i).join(', '))}>
            {tag} ×
          </button>
        ))}
      </span>
      {!free &&
        teams.map((tag) => (
          <button type="button" key={tag} onClick={() => add(tag)}>
            {tag}
          </button>
        ))}
      <input
        aria-label="New tag"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(text);
          }
        }}
      />
      <button type="button" onClick={() => add(text)}>
        Add tag
      </button>
    </span>
  );
}

function editorFor(column) {
  const { field } = column;
  if (field === 'tags' || field === 'freeTags') return (props) => <TagEditor {...props} />;
  if (field === 'team' || field === 'status') {
    const choices = field === 'team' ? teams : phases;
    return ({ value, onChange }) => (
      <select aria-label={column.label} value={value} onChange={(e) => onChange(e.target.value)}>
        {choices.map((choice) => (
          <option key={choice}>{choice}</option>
        ))}
      </select>
    );
  }
  if (column.multiline)
    return ({ value, onChange }) => <textarea value={value} onChange={(e) => onChange(e.target.value)} />;
  if (field === 'time' || field === 'datetime' || field === 'progress' || field === 'rating') {
    const type = field === 'time' ? 'time' : field === 'datetime' ? 'datetime-local' : 'range';
    return ({ value, onChange }) => (
      <input type={type} max={column.max ?? 100} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }
}

export function reactColumn(definition) {
  const { itemRenderer, itemEditor, validator, ...column } = definition;
  return {
    ...column,
    validate: validator,
    renderEditor: editorFor(definition),
    renderCell: itemRenderer && ((props) => <ItemRenderer {...props} factory={itemRenderer} />),
  };
}
export const projectColumns = baseColumns.map(reactColumn);
