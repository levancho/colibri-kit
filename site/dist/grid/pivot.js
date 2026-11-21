// Projects flat records into grid-ready grouped totals or a two-axis pivot.
window.ColibriGrid.pivot = function pivot(records, { group, across, measure, operation = 'sum', groupLabel = group }) {
  if (!['sum','count','min','max','mean'].includes(operation)) throw new TypeError('Unknown aggregation');
  const groups = new Map(), buckets = new Map();
  function aggregate(current, value) {
    if (operation === 'count') return (current ?? 0) + 1;
    if (!Number.isFinite(value)) return current;
    if (operation === 'min') return current === undefined ? value : Math.min(current, value);
    if (operation === 'max') return current === undefined ? value : Math.max(current, value);
    if (operation === 'mean') {
      const state = current || { sum:0, count:0 };
      state.sum += value;
      state.count++;
      return state;
    }
    return (current ?? 0) + value;
  }
  const columns = [{ field:'group', label:groupLabel }];
  for (const record of records) {
    const category = record[group], bucket = across ? record[across] : operation;
    if (!buckets.has(bucket)) {
      const field = 'v' + buckets.size;
      buckets.set(bucket, field);
      columns.push({ field, label:String(bucket ?? '(blank)'), bucket, type:'number', groupDigits:true, inspectable:true });
    }
    let row = groups.get(category);
    if (!row) {
      row = { id:groups.size, group:category ?? '(blank)' };
      groups.set(category, row);
    }
    const field = buckets.get(bucket);
    row[field] = aggregate(row[field], record[measure]);
  }
  const rows = Array.from(groups.values());
  if (operation === 'mean') for (const row of rows) for (const field of buckets.values()) {
    if (row[field]) row[field] = row[field].sum / row[field].count;
  }
  return { columns, rows };
};
