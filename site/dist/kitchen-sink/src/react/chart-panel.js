import { createElement as h, useId, useState } from 'react';
import { area } from '../core/charts.js';

/** Data-driven chart. React owns range selection and the accessible data table. */
export function ChartPanel({ title = 'Audience growth', description = '', rows = [], labels = ['Visitors', 'Signups'], ranges = [7, 14, 30], defaultRange = 30 }) {
  const id = useId();
  const [range, setRange] = useState(defaultRange);
  const visible = rows.slice(-range);
  const series = labels.map((_, column) => visible.map(row => Number(row.values[column])));
  return h('section', { className: 'card panel chart-box', 'aria-labelledby': id },
    h('header', null, h('div', null, h('h3', { id }, title), description && h('p', null, description)),
      h('div', { className: 'seg', role: 'group', 'aria-label': 'Range' }, ranges.map(n =>
        h('button', { key: n, type: 'button', 'aria-pressed': range === n, onClick: () => setRange(n) }, `${n}d`)))),
    visible.length ? h('div', { dangerouslySetInnerHTML: { __html: area(series, { label: title }) } }) : h('p', null, 'No data available.'),
    h('p', { role: 'status', 'aria-live': 'polite' }, `Showing ${visible.length} days`),
    h('details', { className: 'chart-data' }, h('summary', null, 'View chart data'),
      h('table', { className: 'data' }, h('caption', null, title),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Day'), labels.map((label,i) => h('th', { scope: 'col', key: i }, label)))),
        h('tbody', null, visible.map((row,i) => h('tr', { key: i }, h('th', { scope: 'row' }, row.label), row.values.map((value,j) => h('td', { key: j }, value))))))),
    h('ul', { className: 'legend' }, labels.map((label,i) => h('li', { key: i, style: { '--dot': `var(--chart-${i+1})` } }, label))));
}
