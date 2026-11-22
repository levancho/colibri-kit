import React, { useLayoutEffect, useRef } from 'react';
import { mountTreeGrid } from '/grid/tree-example.js';

export default function TreeGrid() {
  const host = useRef(null);
  useLayoutEffect(() => mountTreeGrid(host.current), []);
  return (
    <section ref={host} data-application="tree-grid" className="tree-example">
      <div data-tree-actions>
        <button type="button" data-variant="secondary" data-tree-expand>
          Expand all
        </button>
        <button type="button" data-variant="secondary" data-tree-collapse>
          Collapse all
        </button>
      </div>
      <div data-tree></div>
    </section>
  );
}
