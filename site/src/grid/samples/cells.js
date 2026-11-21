// Flex-style factories used by both the catalog and the individual cell stories.
const node = (tag, cls) => Object.assign(document.createElement(tag), { className: cls || '' });
export const teams = ['Design', 'Platform', 'Research', 'Operations', 'Finance'];
export const phases = ['In progress', 'Planned', 'In review', 'Released'];
const people = [
  'Maya Reed',
  'Theo Marsh',
  'Lena Park',
  'Ada Bell',
  'Iris Shah',
  'Jon West',
  'Ravi Patel',
  'Eva Cruz',
];
const projects = [
  'Atlas search',
  'Northstar mobile',
  'Ledger export',
  'Signal routing',
  'Beacon maps',
  'Relay console',
  'Orbit analytics',
  'Aurora sync',
  'Studio library',
  'Meridian API',
  'Harbor reports',
  'Vector pipeline',
];
export function record(i) {
  const n = i - 1;
  return {
    id: i,
    project: projects[n % 12] + ' / ' + String(i).padStart(4, '0'),
    owner: people[(n * 3) % 8],
    status: phases[(n * 7) % 4],
    team: teams[(n * 3) % 5],
    progress: (37 + n * 13) % 101,
    rating: 1 + ((n + 3) % 5),
    amount: 1200 + ((n * 733) % 70000),
    date: '2026-11-' + String(1 + (n % 28)).padStart(2, '0'),
    approved: n % 3 === 0,
    tags: teams[n % 5] + ', ' + teams[(n + 2) % 5],
    note: 'Review the ' + projects[n % 12].toLowerCase() + ' release with ' + teams[n % 5] + '.',
    time: '09:30',
    datetime: '2026-11-20T09:30',
    freeTags: 'Release',
    uri: 'https://example.org/projects/' + i,
    private: null,
    tree: (n % 4 === 0 ? 'Portfolio ' : 'Work item ') + i,
  };
}
export function projectRows(story) {
  const count =
    story === 'add-columns' ? 10000 : ['custom-cells', 'custom-cell-editing'].includes(story) ? 500 : 240;
  return Array.from({ length: count }, (_, index) => {
    const row = record(index + 1);
    if (story === 'custom-cells') {
      row.history = spendingHistory(row);
      for (const trend of trends) row[trend.field] = row.history[trend.series].at(-1);
    }
    return row;
  });
}
function renderer(render) {
  return () => ({
    element: node('span', 'sample-cell'),
    prepare() {
      this.element.replaceChildren();
      render(this.element, this);
    },
  });
}
export const statusCell = renderer((el, { value }) => {
  const chip = node('span', 'chip phase-' + phases.indexOf(value));
  chip.textContent = value;
  el.append(chip);
});
export const identityCell = renderer((el, { value }) => {
  const avatar = node('span', 'avatar');
  avatar.textContent = String(value || '')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2);
  avatar.dataset.tone = String(String(value).length % 4);
  el.append(avatar, String(value ?? ''));
});
const tagsCell = renderer((el, { value }) => {
  for (const v of String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const chip = node('span', 'tag');
    chip.textContent = v;
    el.append(chip);
  }
});
const progressCell = renderer((el, { value }) => {
  const track = node('progress');
  track.max = 100;
  track.value = Number(value);
  el.append(track, String(value ?? 0) + '%');
});
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percent = (value) => (value > 0 ? '+' : '') + value + '%';

// Eight weeks of sample spending. The three charts are different views of the same ledger.
function spendingHistory(row) {
  let state = row.id * 9973;
  const planned = Math.max(1, Math.round(row.amount / 9));
  const weekly = Array.from({ length: 8 }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.round(planned * (0.5 + state / 4294967296));
  });
  let total = 0;
  const cumulative = weekly.map((spend) => (total += spend));
  const variance = weekly.map((spend) => Math.round(((spend - planned) / planned) * 100));
  return { cumulative, weekly, variance };
}

const trends = [
  { field: 'area', label: 'Cumulative spend', series: 'cumulative' },
  { field: 'line', label: 'Weekly spend', series: 'weekly' },
  { field: 'bars', label: 'Spend vs. plan', series: 'variance' },
];

function svgElement(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function spark(trend) {
  return renderer((el, { data }) => {
    el.className = 'sample-trend trend-' + trend.field;
    const values = data.history[trend.series];
    const latest = values.at(-1);
    const signed = trend.field === 'bars';
    const format = signed ? percent : (value) => dollars.format(value);
    const chart = svgElement('svg', {
      viewBox: '0 0 96 28',
      role: 'img',
      preserveAspectRatio: 'none',
      'aria-label': trend.label + ' for ' + data.project + ', eight weeks, latest ' + format(latest),
    });
    const title = svgElement('title', {});
    title.textContent = trend.label + ' · weeks 1–8: ' + values.map(format).join(' · ');
    chart.append(title);
    if (signed) {
      const zero = 14;
      chart.append(svgElement('path', { d: 'M1 14H95', class: 'trend-baseline' }));
      values.forEach((value, i) => {
        if (!value) return;
        const height = Math.max(1, (Math.abs(value) / 50) * 11);
        chart.append(
          svgElement('rect', {
            x: 3 + i * 12,
            y: value > 0 ? zero - height : zero,
            width: 7,
            height,
            rx: 1,
            class: value > 0 ? 'over-plan' : 'under-plan',
          }),
        );
      });
    } else {
      const area = trend.field === 'area';
      const low = area ? 0 : Math.min(...values);
      const high = area ? Math.max(data.amount, latest) : Math.max(...values);
      const points = values.map((value, i) => [
        3 + (i * 90) / 7,
        high === low ? 14 : 24 - ((value - low) / (high - low)) * 20,
      ]);
      const path = 'M' + points.map(([x, y]) => x.toFixed(2) + ' ' + y.toFixed(2)).join(' L');
      if (area) chart.append(svgElement('path', { d: path + ' L93 26 H3 Z', class: 'trend-area' }));
      chart.append(svgElement('path', { d: path, class: 'trend-stroke' }));
      const [cx, cy] = points.at(-1);
      chart.append(svgElement('circle', { cx, cy, r: 2.1, fill: 'currentColor' }));
    }
    const number = node('span', 'trend-value');
    number.textContent = signed ? percent(latest) : compactDollars.format(latest);
    number.title = format(latest);
    el.append(chart, number);
  });
}
function control(kind, options = []) {
  return () => {
    const input = node(kind === 'select' ? 'select' : 'input');
    if (kind === 'select') options.forEach((v) => input.append(new Option(v, v)));
    else input.type = kind;
    return {
      element: input,
      prepare() {
        if (kind === 'range') {
          input.min = '0';
          input.max = String(this.column.max ?? 100);
        }
        input.value = this.value ?? '';
      },
      get editedValue() {
        return kind === 'range' ? input.valueAsNumber : input.value;
      },
    };
  };
}
function tagEditor(options, duplicates = false) {
  return () => {
    const el = node('div', 'tag-editor'),
      input = node('input'),
      list = node('div'),
      choices = node('div');
    input.placeholder = 'New tag';
    input.setAttribute('aria-label', 'New tag');
    const add = node('button');
    add.type = 'button';
    add.textContent = 'Add tag';
    let selected = [];
    function draw() {
      list.replaceChildren();
      for (const [i, v] of selected.entries()) {
        const b = node('button');
        b.type = 'button';
        b.textContent = v + ' ×';
        b.onclick = () => {
          selected.splice(i, 1);
          draw();
        };
        list.append(b);
      }
    }
    function append(v) {
      if (v.trim() && (duplicates || !selected.includes(v.trim()))) selected.push(v.trim());
      input.value = '';
      draw();
    }
    for (const v of options) {
      const b = node('button');
      b.type = 'button';
      b.textContent = v;
      b.onclick = () => append(v);
      choices.append(b);
    }
    add.onclick = () => append(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        append(input.value);
      }
    };
    el.append(list, choices, input, add);
    return {
      element: el,
      focusTarget: input,
      prepare() {
        selected = String(this.value || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        draw();
      },
      get editedValue() {
        append(input.value);
        return selected.join(', ');
      },
    };
  };
}
const col = (field, label, width, props = {}) => ({ field, label, width, editable: true, ...props });
export const baseColumns = [
  col('project', 'Project', 205),
  col('owner', 'Owner', 156, { itemRenderer: identityCell }),
  col('status', 'Status', 136, {
    itemRenderer: statusCell,
    itemEditor: control('select', phases),
    validator: (v) => phases.includes(v) || 'Choose a listed stage.',
  }),
  col('progress', 'Progress', 136, {
    type: 'number',
    itemRenderer: progressCell,
    itemEditor: control('range'),
    validator: (v) => (Number.isInteger(v) && v >= 0 && v <= 100) || 'Enter a percentage from 0 to 100.',
  }),
  col('team', 'Team', 130, {
    itemEditor: control('select', teams),
    validator: (v) => teams.includes(v) || 'Choose a listed team.',
  }),
  col('amount', 'Budget', 112, { type: 'number' }),
  col('date', 'Due date', 122, { type: 'date' }),
  col('rating', 'Rating', 139, {
    type: 'number',
    max: 5,
    itemRenderer: () => ColibriGrid.cells.rating.newInstance(),
    rendererIsEditor: true,
    validator: (v) => (Number.isInteger(v) && v >= 0 && v <= 5) || 'Use 0 to 5.',
  }),
  col('approved', 'Approved', 100, { type: 'boolean' }),
  col('note', 'Release notes', 270, { multiline: true }),
];
const by = Object.fromEntries(baseColumns.map((c) => [c.field, c]));
export const tagColumn = col('tags', 'Tags', 194, { itemRenderer: tagsCell, itemEditor: tagEditor(teams) });
export const freeTags = col('freeTags', 'Freeform tags', 180, {
  itemRenderer: tagsCell,
  itemEditor: tagEditor([], true),
});
const eventButton = (text, fn) => {
  const b = node('button', 'cell-button');
  b.type = 'button';
  b.textContent = text;
  b.onclick = (e) => {
    e.stopPropagation();
    fn();
  };
  return b;
};
export function customColumns(notice, toggle, expanded) {
  return [
    by.rating,
    ...trends.map((trend) =>
      col(trend.field, trend.label, 166, {
        type: 'number',
        editable: false,
        itemRenderer: spark(trend),
      }),
    ),
    tagColumn,
    by.owner,
    by.status,
    by.progress,
    by.note,
    col('spinner', 'Activity', 90, {
      editable: false,
      itemRenderer: renderer((el) => {
        const spin = node('span', 'spinner');
        spin.setAttribute('aria-label', 'Loading');
        el.append(spin);
      }),
    }),
    col('datetime', 'Date and time', 180, { itemEditor: control('datetime-local') }),
    by.date,
    col('time', 'Time', 100, { itemEditor: control('time') }),
    col('links', 'Links', 205, {
      editable: false,
      itemRenderer: renderer((el, { data }) =>
        el.append(
          eventButton('Owner', () => notice(data.owner)),
          eventButton('Project', () => notice(data.project)),
        ),
      ),
    }),
    col('detail', 'Action', 118, {
      editable: false,
      itemRenderer: renderer((el, { data }) =>
        el.append(eventButton('View details', () => notice(data.project + ' · ' + data.note))),
      ),
    }),
    col('tree', 'Hierarchy', 170, {
      editable: false,
      itemRenderer: renderer((el, { data }) => {
        if ((data.id - 1) % 4 === 0) {
          const b = eventButton((expanded.has(data.id) ? '▾ ' : '▸ ') + data.tree, () => toggle(data.id));
          b.setAttribute('aria-expanded', expanded.has(data.id));
          el.append(b);
        } else el.textContent = '  └ ' + data.tree;
      }),
    }),
    freeTags,
  ];
}
export const selectEditors = [by.status, tagColumn, freeTags];
export const extendedColumn = (i) =>
  i < baseColumns.length ? baseColumns[i] : col('metric' + (i + 1), 'Measure ' + (i + 1), 120, { type: 'number' });
