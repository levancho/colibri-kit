function parse(text, separator = ',') {
  const rows = [];
  let row = [],
    field = '',
    quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') {
      field += '"';
      i++;
    } else if (c === '"' && (quoted || !field)) quoted = !quoted;
    else if (!quoted && c === separator) {
      row.push(field);
      field = '';
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (quoted) throw Error('Unclosed quoted field');
  if (row.length || field.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
function delimited(rows, separator) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const s = String(value ?? '');
          return s.includes(separator) || /["\r\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
        })
        .join(separator),
    )
    .join('\r\n');
}
export function writeClipboard(clipboard, rows) {
  clipboard.setData('text/plain', delimited(rows, '\t'));
  const table = document.createElement('table');
  for (const row of rows) {
    const tr = table.insertRow();
    for (const value of row) tr.insertCell().textContent = String(value ?? '');
  }
  clipboard.setData('text/html', table.outerHTML);
}
export function readClipboard(clipboard) {
  const html = clipboard.getData('text/html');
  if (html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const table = template.content.querySelector('table');
    if (table?.rows.length) {
      for (const br of table.querySelectorAll('br')) br.replaceWith('\n');
      return Array.from(table.rows, (tr) => Array.from(tr.cells, (td) => td.textContent));
    }
  }
  return parse(clipboard.getData('text/plain'), '\t');
}
export async function copy(rows) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    await navigator.clipboard.writeText(delimited(rows, '\t'));
    return;
  }
  const transfer = new DataTransfer();
  writeClipboard(transfer, rows);
  const formats = Object.fromEntries(
    transfer.types.map((type) => [type, new Blob([transfer.getData(type)], { type })]),
  );
  await navigator.clipboard.write([new ClipboardItem(formats)]);
}
export async function paste() {
  if (!navigator.clipboard?.read) return parse(await navigator.clipboard.readText(), '\t');
  const transfer = new DataTransfer();
  for (const item of await navigator.clipboard.read()) {
    for (const type of item.types) {
      if (type === 'text/html' || type === 'text/plain')
        transfer.setData(type, await (await item.getType(type)).text());
    }
  }
  return readClipboard(transfer);
}
