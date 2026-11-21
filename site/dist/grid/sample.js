(() => {
  const names = [
    'Maya Reed',
    'Jon Bell',
    'Lena Park',
    'Iris Hall',
    'Noah Chen',
    'Ari West',
    'Nora Shah',
    'Theo Brown',
    'Kira Moss',
    'Hugo Lee',
    'Sofia Reyes',
    'Luca Meyer',
  ];
  const countries = ['Ireland', 'France', 'Sweden', 'Portugal', 'Germany', 'Japan'],
    languages = ['English', 'French', 'Swedish', 'Portuguese', 'German', 'Japanese'];
  const flags = Object.fromEntries(countries.map((v, i) => [v, ['🇮🇪', '🇫🇷', '🇸🇪', '🇵🇹', '🇩🇪', '🇯🇵'][i]]));
  const statuses = ['In progress', 'Completed', 'Suspended'],
    games = ['Chess', 'Go', 'Bridge', 'Rithmomachy', 'Shogi'];
  const c = (field, label, group, props = {}) => ({ field, label, group, width: 130, editable: true, ...props });
  const money = { type: 'number', kind: 'money' },
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Application components use the same public factory contract as the built-in cells.
  class PropertyEditor {
    constructor() {
      this.element = document.createElement('input');
      this.element.inputMode = 'numeric';
      this.element.placeholder = 'R-000.000';
      this.element.oninput = () => {
        const input = this.element;
        const digits = (value) => value.replace(/[^0-9]/g, '');
        const offset = digits(input.value.slice(0, input.selectionStart)).length;
        const value = digits(input.value).slice(0, 6);
        input.value = value ? 'R-' + value.slice(0, 3) + (value.length > 3 ? '.' + value.slice(3) : '') : '';
        const position = Math.min(input.value.length, 2 + offset + Number(offset > 3));
        input.setSelectionRange(position, position);
      };
    }
    prepare() {
      this.element.value = this.value ?? '';
    }
    get editedValue() {
      return this.element.value;
    }
  }
  function schema(projects) {
    if (projects)
      return [
        c('pinned', 'Pin', 'Projects', { kind: 'pin', options: ['true', 'false'], width: 80, editable: false }),
        c('team', 'Team', 'Projects', { kind: 'team', options: names, width: 115 }),
        c('property', 'Property', 'Projects', {
          summary: 'count',
          itemEditor: new ColibriGrid.ClassFactory(PropertyEditor),
          validator: (v) => !v || /^R-\d{3}\.\d{3}$/.test(v) || 'Use R-000.000',
        }),
        c('status', 'Status', 'Projects', { kind: 'status', options: statuses }),
        c('client', 'Client', 'Projects', { summary: 'count' }),
        c('start', 'Start date', 'Dates', { type: 'date' }),
        c('end', 'End date', 'Dates', { type: 'date' }),
        c('before', 'Before', 'Budget', { ...money, heat: true }),
        c('after', 'After', 'Budget', { ...money, heat: true }),
        c('country', 'Country', 'Projects', { flags, options: countries }),
      ];
    return [
      c('name', 'Name', 'Participant', { width: 165 }),
      c('language', 'Language', 'Participant', { options: languages }),
      c('country', 'Country', 'Participant', { flags, options: countries }),
      c('game', 'Game', 'Game of choice', { options: games }),
      c('bought', 'Bought', 'Game of choice', {
        type: 'boolean',
        rendererIsEditor: true,
        options: ['true', 'false'],
        width: 88,
      }),
      c('bank', 'Bank balance', 'Performance', money),
      c('rating', 'Rating', 'Performance', {
        kind: 'rating',
        type: 'number',
        width: 139,
        itemRenderer: ColibriGrid.cells.rating,
        rendererIsEditor: true,
      }),
      c('wins', 'Total winnings', 'Performance', money),
      c('year', 'Year', 'Performance', { type: 'number' }),
      c('played', 'Games played', 'Performance', { type: 'number' }),
      ...months.map((m) => c(m, m, 'Monthly breakdown', money)),
    ];
  }
  const dataset = document.querySelector('#dataset'),
    size = document.querySelector('#size'),
    skin = document.querySelector('#skin'),
    host = document.querySelector('#workbook');
  let book, previousDataset;
  function load() {
    const projects = dataset.value === 'projects',
      columns = schema(projects),
      count = Number(size.value);
    if (count === 10000)
      while (columns.length < 100)
        columns.push(
          c('metric' + columns.length, 'Metric ' + (columns.length + 1), 'Metrics', { type: 'number' }),
        );
    const rows = Array.from({ length: count }, (_, i) => {
      const cost = (i * 7919 + 42121) % 100000,
        p = i % names.length,
        k = i % countries.length;
      const row = projects
        ? {
            team: names[p] + ', ' + names[(p + 3) % names.length],
            property: 'R-' + (320 + (i % 601)) + '.' + String(100 + (i % 899)),
            status: statuses[(i * 7) % 3],
            client: names[(p + 7) % names.length],
            start: '2026-' + String((i % 8) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'),
            end: '2026-12-' + String((i % 27) + 1).padStart(2, '0'),
            before: cost,
            after: Math.round(cost * 0.87),
            country: countries[k],
          }
        : {
            name: names[p],
            language: languages[k],
            country: countries[k],
            game: games[i % 5],
            bought: i % 4 !== 0,
            bank: cost,
            rating: i % 6,
            wins: (cost * 3) % 150000,
            year: 2020 + (i % 7),
            played: i % 120,
          };
      if (!projects)
        months.forEach((m, j) => {
          row[m] = (cost * (j + 1)) % 9999;
        });
      if (count === 10000)
        for (const col of columns)
          if (col.field.startsWith('metric')) row[col.field] = (i * 13 + Number(col.field.slice(6))) % 999;
      row.id = i + 1;
      return row;
    });
    const dataProvider = new ColibriGrid.ArrayCollection(rows);
    if (book) book.setDataProvider(dataProvider, columns);
    else {
      book = new ColibriGrid.Workbench(host, { columns, dataProvider, label: 'Data grid' });
      if (innerWidth < 700) {
        book.panel = '';
        book.redraw();
      }
    }
    book.searchBehavior = projects ? 'highlight' : 'filter';
    book.searchFields = projects ? ['property', 'client', 'before', 'after'] : null;
    if (previousDataset !== dataset.value) {
      book.totals = projects;
      book.paged = projects;
      book.pageSize = projects ? 20 : 50;
      book.redraw();
      previousDataset = dataset.value;
    }
  }
  const params = new URLSearchParams(location.search);
  for (const [key, control] of [
    ['dataset', dataset],
    ['size', size],
    ['theme', skin],
  ]) {
    const value = params.get(key);
    if ([...control.options].some((option) => option.value === value)) control.value = value;
  }
  if (params.get('rtl') === 'true') document.documentElement.dir = 'rtl';
  dataset.onchange = size.onchange = load;
  skin.onchange = () => book.setTheme(skin.value);
  host.addEventListener('themeChange', ({ detail }) => {
    skin.value = detail.skin;
    document.documentElement.dataset.theme = detail.theme;
    document.documentElement.dataset.skin = detail.style;
  });
  load();
  book.setTheme(skin.value);
})();
