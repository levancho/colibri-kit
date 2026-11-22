import React, { useLayoutEffect, useRef } from 'react';
import { mountWorkbench } from '/grid/sample.js';

export default function FullGrid() {
  const host = useRef(null);
  useLayoutEffect(() => mountWorkbench(host.current), []);
  return (
    <section ref={host} data-application="full-grid" className="workbench-app">
      <header className="demo-head">
        <div className="demo-options">
          <label>
            Dataset
            <select id="dataset">
              <option value="projects">Projects</option>
              <option value="participants">Participants</option>
            </select>
          </label>
          <label>
            Data size
            <select id="size" defaultValue="1000">
              <option value="100">100 rows</option>
              <option value="1000">1,000 rows</option>
              <option value="10000">10,000 rows × 100 columns</option>
              <option value="50000">50,000 rows</option>
              <option value="100000">100,000 rows</option>
            </select>
          </label>
          <label>
            Theme
            <select id="skin">
              <option>Colibri</option>
              <option>Light</option>
              <option>Dark</option>
              <option>Light contrast</option>
              <option>Dark contrast</option>
              <option>Marine</option>
              <option>Quartz</option>
              <option>Alpine</option>
              <option>Balham</option>
              <option>Material</option>
            </select>
          </label>
        </div>
      </header>
      <div id="workbook"></div>
    </section>
  );
}
