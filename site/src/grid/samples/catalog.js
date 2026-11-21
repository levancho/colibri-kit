const groups = {
  'Columns and navigation': {
    'add-columns':
      'Change the column count across 10,000 projects. Edits survive removing a field and bringing it back.',
    'freeze-columns': 'Pin up to three leading fields, then scroll horizontally to inspect the rest of a record.',
    'search-as-filter': 'Find a project, owner or team. Clear the search to restore every record.',
  },
  'Cells and editors': {
    'custom-cells':
      'Explore ratings, three chart types, tags, people, dates, actions and a collapsible hierarchy.',
    'custom-cell-editing': 'Click a status to choose it. Add or remove tags in the cell. Tab applies your tags and Escape discards the draft.',
    'validate-data': 'Edit the budget or paste a block of values. Budgets must be nonnegative whole numbers.',
  },
  'Spreadsheet operations': {
    'header-menus': 'Sort a column from its menu. Right-click a selection to copy, paste, fill or clear it.',
    'paste-support':
      'Copy the two-row sample, select a destination and paste. Shift-select the result to copy it back.',
    'fill-handle': 'Select a source cell, then drag its lower-right handle to fill adjacent rows or columns.',
  },
  'Live data': {
    'rapid-updates': 'Watch simulated budgets update. Scroll to move the feed to a different set of records.',
  },
};
const names = {
  'rapid-updates': 'Viewport streaming',
  'paste-support': 'Copy and paste',
  'validate-data': 'Validated edits',
  'custom-cell-editing': 'Dropdown and tag editors',
};
export const stories = Object.entries(groups).flatMap(([group, items]) =>
  Object.entries(items).map(([id, description]) => ({
    id,
    group,
    description,
    name: names[id] || id[0].toUpperCase() + id.slice(1).replaceAll('-', ' '),
  })),
);
