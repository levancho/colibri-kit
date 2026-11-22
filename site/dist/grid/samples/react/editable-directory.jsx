import React, { useLayoutEffect, useRef } from 'react';
import { createExample } from '/grid/editing-example.js';

export default function EditableDirectory() {
  const host = useRef(null);
  useLayoutEffect(() => {
    const grid = createExample(host.current.querySelector('#directory'));
    return () => grid.destroy();
  }, []);
  return (
    <section ref={host} data-application="editable-directory" className="workbench-app">
      <p>
        Open a column menu to sort. Double-click a cell to edit. Drag across cells or use Shift and the arrow
        keys to select a range, then copy or paste. Use Ctrl/Cmd+D to fill down or Ctrl/Cmd+R to fill right.
      </p>
      <div id="directory"></div>
    </section>
  );
}
