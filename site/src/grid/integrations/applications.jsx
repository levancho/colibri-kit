import React from 'react';
import { createRoot } from 'react-dom/client';
import FullGrid from '../samples/react/full-grid.jsx';
import TreeGrid from '../samples/react/tree-grid.jsx';
import TradingDesk from '../samples/react/trading-desk.jsx';
import Inventory from '../samples/react/inventory.jsx';
import EditableDirectory from '../samples/react/editable-directory.jsx';

const applications = {
  'full-grid': FullGrid,
  'tree-grid': TreeGrid,
  'trading-desk': TradingDesk,
  'inventory': Inventory,
  'editable-directory': EditableDirectory,
};

export function mountReactApplication(host, id) {
  const root = createRoot(host);
  const Application = applications[id];
  root.render(<Application />);
  return () => root.unmount();
}
