import * as searchAsFilter from './examples/search-as-filter.js';
import * as headerMenus from './examples/header-menus.js';
import * as validateData from './examples/validate-data.js';
import * as fillHandle from './examples/fill-handle.js';
import * as pasteSupport from './examples/paste-support.js';
import * as freezeColumns from './examples/freeze-columns.js';
import * as rapidUpdates from './examples/rapid-updates.js';
import * as customCellEditing from './examples/custom-cell-editing.js';
import * as customCells from './examples/custom-cells.js';
import * as addColumns from './examples/add-columns.js';

import { controls as colorControls, createColorPalette } from './examples/color-palette.js';
import { controls as editorControls, createProjectEditors } from './examples/project-editors.js';

export const examples = {
  'color-palette': { controls: colorControls, create: createColorPalette },
  'project-editors': { controls: editorControls, create: createProjectEditors },
  'search-as-filter': { controls: searchAsFilter.controls, create: searchAsFilter.createSearchAsFilter },
  'header-menus': { controls: headerMenus.controls, create: headerMenus.createHeaderMenus },
  'validate-data': { controls: validateData.controls, create: validateData.createValidateData },
  'fill-handle': { controls: fillHandle.controls, create: fillHandle.createFillHandle },
  'paste-support': { controls: pasteSupport.controls, create: pasteSupport.createPasteSupport },
  'freeze-columns': { controls: freezeColumns.controls, create: freezeColumns.createFreezeColumns },
  'rapid-updates': { controls: rapidUpdates.controls, create: rapidUpdates.createRapidUpdates },
  'custom-cell-editing': {
    controls: customCellEditing.controls,
    create: customCellEditing.createCustomCellEditing,
  },
  'custom-cells': { controls: customCells.controls, create: customCells.createCustomCells },
  'add-columns': { controls: addColumns.controls, create: addColumns.createAddColumns },
};
