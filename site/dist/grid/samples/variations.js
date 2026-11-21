import { configureFreezeColumns } from './examples/freeze-columns.js';
import { configureValidateData } from './examples/validate-data.js';
import { configurePasteSupport } from './examples/paste-support.js';
import { configureFillHandle } from './examples/fill-handle.js';
import { configureSearchAsFilter } from './examples/search-as-filter.js';
import { configureRapidUpdates } from './examples/rapid-updates.js';
import { configureAddColumns } from './examples/add-columns.js';
import { configureCustomCells } from './examples/custom-cells.js';
import { configureCustomCellEditing } from './examples/custom-cell-editing.js';
import { configureHeaderMenus } from './examples/header-menus.js';

export const configurations = {
  'freeze-columns': configureFreezeColumns,
  'validate-data': configureValidateData,
  'paste-support': configurePasteSupport,
  'fill-handle': configureFillHandle,
  'search-as-filter': configureSearchAsFilter,
  'rapid-updates': configureRapidUpdates,
  'add-columns': configureAddColumns,
  'custom-cells': configureCustomCells,
  'custom-cell-editing': configureCustomCellEditing,
  'header-menus': configureHeaderMenus,
};
