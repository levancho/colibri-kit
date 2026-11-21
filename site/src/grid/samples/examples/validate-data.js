import { baseColumns } from '../cells.js';

export function configureValidateData(c) {
  c.columns = [
    baseColumns[0],
    {
      ...baseColumns[5],
      validator: (v) => (Number.isInteger(v) && v >= 0) || 'Enter a whole number of zero or more.',
    },
    ...baseColumns.slice(1, 4),
  ];
}
