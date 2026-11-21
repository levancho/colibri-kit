import type { ReactElement, ReactNode, RefAttributes } from 'react';

export type GridBounds = { top: number; bottom: number; left: number; right: number };
export type GridRef<Row = object> = {
  focus(): void;
  selectCell(row: number, column: number): void;
  selectRange(top: number, left: number, bottom: number, right: number): void;
  editCell(row: number, column: number): void;
  getVisibleRows(): Row[];
  getSelection(): GridBounds;
};
export type GridColumn<Row> = {
  field: keyof Row & string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
  width?: number;
  editable?: boolean;
  parse?: (input: unknown) => unknown;
  validate?: (value: any, row: Row) => boolean | string | void;
  compare?: (left: any, right: any) => number;
  rendererIsEditor?: boolean;
  renderCell?: (cell: { row: Row; column: GridColumn<Row>; value: any; commit(value: unknown): boolean; startEdit(): void }) => ReactNode;
  renderEditor?: (editor: { row: Row; column: GridColumn<Row>; value: any; onChange(value: any): void; save(): void; cancel(): void }) => ReactNode;
};
export interface GridProps<Row> extends RefAttributes<GridRef<Row>> {
  columns: readonly GridColumn<Row>[];
  rows?: readonly Row[];
  defaultRows?: readonly Row[];
  getRowId?: (row: Row) => string | number;
  onRowsChange?: (rows: Row[], changes: { id: string | number; field: keyof Row; previous: unknown; value: unknown }[]) => void;
  onSelectionChange?: (bounds: GridBounds) => void;
  label?: string;
  query?: string;
  height?: number;
  rowHeight?: number;
  pinnedColumns?: number;
  overscan?: number;
}
export function ColibriGrid<Row extends object>(props: GridProps<Row>): ReactElement;
