const engine = new URL('vendor/echarts-6.0.0.esm.min.js', import.meta.url);
function extent(numbers) {
  let min = Infinity,
    max = -Infinity;
  for (const value of numbers)
    if (Number.isFinite(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  return min === Infinity ? [0, 0] : [min, max];
}

function hierarchy(rows, dimensions, metric) {
  const nodes = new Map();
  rows.forEach((row, i) => {
    let children = nodes;
    const path = dimensions.length ? dimensions.map((j) => String(row[j] ?? '')) : [String(i + 1)];
    for (const name of path) {
      if (!children.has(name)) children.set(name, { name, value: 0, children: new Map() });
      const node = children.get(name);
      node.value += Math.max(0, Number(row[metric]) || 0);
      children = node.children;
    }
  });
  const flatten = (map) =>
    [...map.values()].map(({ name, value, children }) =>
      children.size ? { name, children: flatten(children) } : { name, value },
    );
  return flatten(nodes);
}

function quantiles(data) {
  const values = data.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) return [];
  return [0, 0.25, 0.5, 0.75, 1].map((q) => {
    const i = q * (values.length - 1),
      lower = Math.floor(i);
    return values[lower] + (i - lower) * (values[Math.ceil(i)] - values[lower]);
  });
}

export function options(family, variant, columns, rows) {
  const metrics = columns
    .map((c, i) => ({ name: c.label, i }))
    .filter(({ i }) => columns[i].type === 'number' || rows.some((r) => Number.isFinite(r[i])));
  if (!metrics.length) throw Error('Select a range containing a numeric column.');
  const dimensions = columns.map((_, i) => i).filter((i) => !metrics.some((m) => m.i === i));
  const labels = rows.map((r, i) => (dimensions.length ? String(r[dimensions[0]] ?? '') : String(i + 1)));
  const values = metrics.map((m) => rows.map((r) => (Number.isFinite(r[m.i]) ? r[m.i] : null)));
  const first = values[0],
    names = metrics.map((m) => m.name);
  const category = { type: 'category', data: labels },
    number = { type: 'value' };
  const cartesian = (series, xAxis = category, yAxis = number) => ({
    xAxis,
    yAxis,
    series,
    grid: { containLabel: true, top: 45, bottom: 30 },
  });
  const byCategory = labels.map((name, i) => ({ name, value: Math.max(0, first[i] ?? 0) }));
  if (['Bar', 'Column', 'Area', 'Line', 'Combination'].includes(family)) {
    const stacked = variant.includes('Stacked'),
      normalized = variant === '100% Stacked';
    const series = metrics.map(({ name }, k) => {
      const area = family === 'Area' || (variant === 'Area & Column' && k === 0);
      const line = family === 'Line' || area || (variant === 'Column & Line' && k > 0);
      const data = values[k].map((v, i) => {
        if (!normalized || v === null) return v;
        const denominator = values.reduce((n, col) => n + Math.abs(col[i] ?? 0), 0);
        return denominator ? (100 * v) / denominator : 0;
      });
      return {
        name,
        type: line ? 'line' : 'bar',
        data,
        stack: stacked ? 'total' : undefined,
        areaStyle: area ? {} : undefined,
      };
    });
    return family === 'Bar' ? cartesian(series, number, category) : cartesian(series);
  }
  if (family === 'Pie' || variant === 'Nightingale')
    return {
      series: [
        {
          type: 'pie',
          name: names[0],
          radius: variant === 'Donut' ? ['35%', '65%'] : '65%',
          roseType: variant === 'Nightingale' ? 'area' : undefined,
          data: byCategory,
        },
      ],
    };
  if (family === 'X Y (Scatter)') {
    const x = values.length > 1 ? first : rows.map((_, i) => i + 1),
      y = values[1] || first,
      z = values[2];
    const [, max] = extent(z || []);
    const data = rows.flatMap((_, i) => (x[i] === null || y[i] === null ? [] : [[x[i], y[i], z?.[i] ?? null]]));
    return cartesian(
      [
        {
          type: 'scatter',
          name: names[1] || names[0],
          data,
          symbolSize:
            variant === 'Bubble' ? (v) => (max > 0 ? 6 + 30 * Math.sqrt(Math.max(0, v[2] || 0) / max) : 10) : 8,
        },
      ],
      { ...number, name: values.length > 1 ? names[0] : 'Row' },
      { ...number, name: names[1] || names[0] },
    );
  }
  if (variant.startsWith('Radar')) {
    const radar = {
      indicator: labels.map((name, i) => {
        const [min, max] = extent(values.map((v) => v[i]));
        return { name, min: Math.min(0, min), max: Math.max(1, max) };
      }),
    };
    return {
      radar,
      series: [
        {
          type: 'radar',
          areaStyle: variant === 'Radar Area' ? {} : undefined,
          data: metrics.map(({ name }, k) => ({ name, value: values[k] })),
        },
      ],
    };
  }
  if (variant.startsWith('Radial')) {
    const horizontal = variant === 'Radial Bar';
    return {
      polar: { radius: '63%' },
      angleAxis: horizontal ? number : category,
      radiusAxis: horizontal ? category : number,
      series: metrics.map(({ name }, k) => ({ type: 'bar', coordinateSystem: 'polar', name, data: values[k] })),
    };
  }
  if (family === 'Hierarchical')
    return {
      series: [
        { type: variant.toLowerCase(), data: hierarchy(rows, dimensions, metrics[0].i), radius: ['0%', '80%'] },
      ],
    };
  if (variant === 'Box Plot')
    return cartesian(
      [{ type: 'boxplot', data: values.map(quantiles) }],
      { type: 'category', data: names },
      number,
    );
  if (variant === 'Histogram') {
    const data = first.filter(Number.isFinite),
      [min, max] = extent(data),
      bins = Math.max(1, Math.min(40, Math.ceil(Math.sqrt(data.length))));
    const width = (max - min || 1) / bins,
      counts = Array(bins).fill(0);
    data.forEach((v) => counts[Math.min(bins - 1, Math.floor((v - min) / width))]++);
    return cartesian(
      [{ type: 'bar', barCategoryGap: '0%', data: counts }],
      {
        type: 'category',
        data: counts.map((_, i) =>
          [min + width * i, min + width * (i + 1)].map((n) => Number(n.toFixed(2))).join('–'),
        ),
      },
      { type: 'value', name: 'Count' },
    );
  }
  if (variant === 'Heatmap') {
    const data = values.flatMap((v, k) => v.flatMap((n, i) => (n === null ? [] : [[i, k, n]])));
    const [min, max] = extent(data.map((d) => d[2]));
    return {
      ...cartesian([{ type: 'heatmap', data }], category, { type: 'category', data: names }),
      visualMap: { min, max: max === min ? min + 1 : max, orient: 'horizontal', left: 'center', bottom: 0 },
      grid: { containLabel: true, bottom: 65 },
    };
  }
  if (variant === 'Range Area' || variant === 'Range Bar' || variant === 'Waterfall') {
    let total = 0;
    const points = rows.map((_, i) => {
      if (variant === 'Waterfall') {
        const previous = total;
        total += first[i] || 0;
        return [i, previous, total];
      }
      const [lo, hi] = extent(values.map((v) => v[i]));
      return [i, lo, hi];
    });
    const area = variant === 'Range Area';
    const renderItem = (params, api) => {
      const i = api.value(0),
        lo = api.coord([i, api.value(1)]),
        hi = api.coord([i, api.value(2)]);
      if (area && i + 1 < points.length) {
        const [x, l, h] = points[i + 1];
        return {
          type: 'polygon',
          shape: { points: [lo, hi, api.coord([x, h]), api.coord([x, l])] },
          style: { fill: '#40897f', opacity: 0.7 },
        };
      }
      const width = Math.abs(api.size([1, 0])[0]) * 0.65;
      return {
        type: 'rect',
        shape: {
          x: lo[0] - width / 2,
          y: Math.min(lo[1], hi[1]),
          width,
          height: Math.max(1, Math.abs(lo[1] - hi[1])),
        },
        style: { fill: variant === 'Waterfall' && api.value(2) < api.value(1) ? '#ae624f' : '#40897f' },
      };
    };
    return cartesian([{ name: variant, type: 'custom', renderItem, encode: { x: 0, y: [1, 2] }, data: points }]);
  }
  if (family === 'Funnel') {
    if (variant === 'Funnel')
      return {
        series: [
          {
            type: 'funnel',
            sort: 'none',
            gap: 3,
            left: '15%',
            width: '70%',
            label: { position: 'inside' },
            data: byCategory,
          },
        ],
      };
    // Cone funnel widths follow the successive stage values. Pyramid bands represent shares by area.
    const total = byCategory.reduce((s, v) => s + v.value, 0),
      max = extent(first)[1] || 1;
    let accumulated = 0;
    const bands = byCategory.map(({ name, value }, i) => {
      const previous = accumulated;
      accumulated += value;
      if (variant === 'Pyramid') {
        const y1 = Math.sqrt(previous / (total || 1)),
          y2 = Math.sqrt(accumulated / (total || 1));
        return { name, value, y1, y2, w1: y1, w2: y2 };
      }
      return {
        name,
        value,
        y1: i / byCategory.length,
        y2: (i + 1) / byCategory.length,
        w1: value / max,
        w2: (byCategory[i + 1]?.value ?? 0) / max,
      };
    });
    return {
      series: [
        {
          type: 'custom',
          coordinateSystem: 'none',
          data: bands.map((b) => ({ name: b.name, value: b.value })),
          renderItem: (params, api) => {
            const b = bands[params.dataIndex],
              w = api.getWidth(),
              h = api.getHeight() * 0.78,
              x = w / 2,
              y = 40;
            const corners = [
              [x - w * 0.34 * b.w1, y + h * b.y1],
              [x + w * 0.34 * b.w1, y + h * b.y1],
              [x + w * 0.34 * b.w2, y + h * b.y2],
              [x - w * 0.34 * b.w2, y + h * b.y2],
            ];
            return {
              type: 'group',
              children: [
                {
                  type: 'polygon',
                  shape: { points: corners },
                  style: {
                    fill: ['#287d76', '#535f99', '#985b52', '#877444'][params.dataIndex % 4],
                    stroke: '#fff',
                  },
                },
                {
                  type: 'text',
                  style: {
                    x,
                    y: y + (h * (b.y1 + b.y2)) / 2,
                    text: b.name,
                    align: 'center',
                    verticalAlign: 'middle',
                    fill: '#fff',
                  },
                },
              ],
            };
          },
        },
      ],
    };
  }
  throw Error('Unknown chart type ' + variant);
}

export async function mount(host, family, variant, columns, rows, theme) {
  const { init } = await import(engine.href);
  if (!host.isConnected) return;
  const chart = init(host, theme === 'dark' ? 'dark' : undefined);
  let windowStart = 0,
    windowEnd = 100,
    zoomable = false,
    settings = {};
  chart.on('datazoom', (e) => {
    const change = e.batch?.[0] || e;
    if (Number.isFinite(change.start) && Number.isFinite(change.end)) {
      windowStart = change.start;
      windowEnd = change.end;
    }
  });
  const zoomAroundCenter = (factor) => {
    const mid = (windowStart + windowEnd) / 2,
      width = Math.min(100, Math.max(5, (windowEnd - windowStart) * factor));
    setWindow(mid - width / 2, mid + width / 2);
  };
  const wheel = (e) => {
    if (!zoomable || settings.scrolling === false) return;
    e.preventDefault();
    zoomAroundCenter(Math.pow(1 + (settings.step || 15) / 100, Math.sign(e.deltaY)));
  };
  host.addEventListener('wheel', wheel, { passive: false });
  const setWindow = (start, end) => {
    const width = Math.min(100, Math.max(5, end - start));
    windowStart = Math.max(0, Math.min(100 - width, start));
    windowEnd = windowStart + width;
    if (zoomable) chart.dispatchAction({ type: 'dataZoom', start: windowStart, end: windowEnd });
  };
  const draw = (family, variant, seriesColumns = columns, seriesRows = rows, style = {}) => {
    const spec = options(family, variant, seriesColumns, seriesRows);
    settings = style;
    zoomable = Boolean(spec.xAxis && spec.series[0].type !== 'heatmap' && style.zoom !== false);
    if (zoomable) {
      const axis = family === 'Bar' ? { yAxisIndex: 0 } : { xAxisIndex: 0 };
      const window = { ...axis, filterMode: 'none', start: windowStart, end: windowEnd };
      spec.dataZoom = [{ ...window, type: 'inside', zoomOnMouseWheel: false, moveOnMouseWheel: false }];
      if (style.navigator) {
        spec.dataZoom.push({ ...window, type: 'slider', height: 18 });
        spec.grid = { ...spec.grid, bottom: 55 };
      }
      if (style.selecting)
        spec.toolbox = {
          feature: {
            dataZoom: { yAxisIndex: family === 'Bar' ? 0 : false, xAxisIndex: family === 'Bar' ? false : 0 },
          },
        };
    }
    if (style.legend) spec.legend = { show: true, top: style.title ? 27 : 0 };
    if (style.title) spec.title = { text: style.title, left: 'center', textStyle: { fontSize: 16 } };
    if (style.xTitle && spec.xAxis) spec.xAxis.name = style.xTitle;
    if (style.yTitle && spec.yAxis) spec.yAxis.name = style.yTitle;
    chart.setOption(
      {
        animation: !!style.animation,
        animationDuration: style.duration ?? 300,
        backgroundColor: 'transparent',
        aria: { enabled: true },
        tooltip: {
          renderMode: 'richText',
          trigger: style.crosshair && spec.xAxis ? 'axis' : 'item',
          axisPointer: {
            type: 'cross',
            label: { show: style.labels !== false },
            snap: !!style.snap,
            crossStyle: { color: style.color || '#707374' },
            lineStyle: { color: style.color || '#707374' },
          },
        },
        ...spec,
      },
      true,
    );
  };
  try {
    draw(family, variant);
  } catch (error) {
    host.removeEventListener('wheel', wheel);
    chart.dispose();
    throw error;
  }
  const resize = new ResizeObserver(() => chart.resize());
  resize.observe(host);
  return {
    draw,
    zoomable: () => zoomable,
    navigate(action) {
      const span = windowEnd - windowStart,
        mid = (windowStart + windowEnd) / 2;
      if (action === 'Reset the zoom') setWindow(0, 100);
      else if (action === 'Pan left' || action === 'Pan right') {
        const delta = ((action === 'Pan left' ? -1 : 1) * span) / 4;
        setWindow(windowStart + delta, windowEnd + delta);
      } else {
        const width = Math.min(100, Math.max(5, span * (action === 'Zoom in' ? 0.65 : 1 / 0.65)));
        setWindow(mid - width / 2, mid + width / 2);
      }
      return [windowStart, windowEnd];
    },
    image: () =>
      chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: getComputedStyle(host).backgroundColor }),
    destroy() {
      resize.disconnect();
      host.removeEventListener('wheel', wheel);
      chart.dispose();
    },
  };
}
