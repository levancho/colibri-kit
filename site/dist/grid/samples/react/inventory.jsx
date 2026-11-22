import React, { useLayoutEffect, useRef } from 'react';
import { mountInventory } from '/grid/inventory.js';

export default function Inventory() {
  const host = useRef(null);
  useLayoutEffect(() => mountInventory(host.current), []);
  return (
    <section ref={host} data-application="inventory" className="ui-root">
      <label>
        View{' '}
        <select id="mode">
          <option value="records">Records</option>
          <option value="group">Grouped summary</option>
          <option value="pivot">Pivot table</option>
        </select>
      </label>
      <label id="axis" hidden>
        Group by{' '}
        <select id="dimension">
          <option value="category">Product category</option>
          <option value="warehouse">Warehouse</option>
        </select>
      </label>
      <label id="aggregate" hidden>
        Quantity calculation{' '}
        <select id="operation">
          <option>sum</option>
          <option>mean</option>
          <option>count</option>
          <option>min</option>
          <option>max</option>
        </select>
      </label>
      <p id="help">
        Search or sort 50,000 sample records. Double-click an item or quantity to edit it, or use the arrow
        keys and Enter. Edits last until you reload.
      </p>
      <button type="button" id="return" hidden>
        Back to summary
      </button>
      <div id="inventory"></div>
    </section>
  );
}
