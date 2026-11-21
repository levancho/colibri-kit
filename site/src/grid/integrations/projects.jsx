import React from 'react';
import { createRoot } from 'react-dom/client';
import { stories } from '../samples/catalog.js';
import AddColumns from '../samples/react/add-columns.jsx';
import FreezeColumns from '../samples/react/freeze-columns.jsx';
import SearchAsFilter from '../samples/react/search-as-filter.jsx';
import CustomCells from '../samples/react/custom-cells.jsx';
import CustomCellEditing from '../samples/react/custom-cell-editing.jsx';
import ValidateData from '../samples/react/validate-data.jsx';
import HeaderMenus from '../samples/react/header-menus.jsx';
import PasteSupport from '../samples/react/paste-support.jsx';
import FillHandle from '../samples/react/fill-handle.jsx';
import RapidUpdates from '../samples/react/rapid-updates.jsx';

const samples = {
  'add-columns': AddColumns,
  'freeze-columns': FreezeColumns,
  'search-as-filter': SearchAsFilter,
  'custom-cells': CustomCells,
  'custom-cell-editing': CustomCellEditing,
  'validate-data': ValidateData,
  'header-menus': HeaderMenus,
  'paste-support': PasteSupport,
  'fill-handle': FillHandle,
  'rapid-updates': RapidUpdates,
};
export function mountReactSample(host, id) {
  const root = createRoot(host);
  const Sample = samples[id];
  root.render(<Sample />);
  return () => root.unmount();
}
const host = document.getElementById('app');
const root = host && createRoot(host);
function show() {
  const story = stories.find((story) => story.id === location.hash.slice(1)) ?? stories[0];
  const Sample = samples[story.id];
  document.title = story.name + ' · React · Colibri Grid';
  root.render(
    <main className="frameworks">
      <header className="kpage-head">
        <span className="kpage-eyebrow">Colibri Grid / React</span>
        <h1>{story.name}</h1>
        <p>{story.description}</p>
      </header>
      <div className="integration-tools">
        <label>Example <select value={story.id} onChange={event => { location.hash = event.target.value; }}>
          {stories.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select></label>
        <a href={'../samples/?source=react#' + story.id}>View sample source</a>
      </div>
      <Sample />
    </main>,
  );
}
if (root) {
  window.addEventListener('hashchange', show);
  show();
}
