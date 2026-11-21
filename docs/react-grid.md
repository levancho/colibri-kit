# Colibri Grid for React

Import `ColibriGrid` from `@colibri-kit/ui/react/grid`, plus `@colibri-kit/ui/themes/colibri.css` and `@colibri-kit/ui/themes/grid.css`. The component requires React 18 or later. The [Kit example](/grid/integrations/#react-source) renders a controlled 10,000-row register and exposes its JSX and component source.

Use `rows` and update your state in `onRowsChange(nextRows, changes)` for controlled editing. For a grid that owns its edits, pass `defaultRows` once. Each row needs a stable, unique `id`, or supply `getRowId(row)`. Supply columns with unique `field` keys. Set `editable` on writable fields. The grid supplies the entire committed batch to the change callback after every value passes validation.

Columns accept `renderCell` and `renderEditor` for React elements. Editors receive a draft value, `onChange`, `save` and `cancel`. Return an element such as `<MyEditor {...props}/>` to use component-local hooks. `parse` converts incoming values. `validate` returns true or an error message. Use `type: 'number'` or `type: 'boolean'` to preserve typed values across clipboard edits.

Use `query` to filter, `pinnedColumns` to keep leading fields visible, and numeric `height`, `rowHeight` and `overscan` to configure the virtual viewport. A ref exposes `focus()`, `selectCell(row,column)` and `getSelection()`. Selection coordinates refer to the filtered, sorted view. The complete prop and column definitions ship with the package.
