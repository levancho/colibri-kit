// Local file I/O for the workbench. No records leave the browser.
window.ColibriGrid.files = (() => {
  const base = new URL('.', document.currentScript?.src || new URL('/grid/files.js', location.href));
  const libraries = new Map();
  function library(file) {
    if (!libraries.has(file))
      libraries.set(
        file,
        new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = new URL('vendor/' + file, base);
          script.onload = resolve;
          script.onerror = () => {
            libraries.delete(file);
            reject(Error('Could not load ' + file));
          };
          document.head.append(script);
        }),
      );
    return libraries.get(file);
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  const { parse, delimited } = ColibriGrid.delimited;
  const xml = (str) =>
    String(str ?? '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  async function excel(matrix, columns, rows) {
    await library('jszip.min.js');
    const zip = new JSZip();
    const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.';
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const relation = (type, target) =>
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' +
      rel +
      '/' +
      type +
      '" Target="' +
      target +
      '"/></Relationships>';
    const flagColumns = columns.map((c, i) => (c.flags ? i : -1)).filter((i) => i >= 0);
    const flags = new Map(),
      anchors = [];
    for (const i of flagColumns)
      for (let r = 0; r < rows.length; r++) {
        const flag = columns[i].flags[rows[r][columns[i].field]];
        if (!flag) continue;
        if (!flags.has(flag)) {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 22;
          const ctx = canvas.getContext('2d');
          ctx.font = '20px system-ui';
          ctx.fillText(flag, 0, 19);
          const id = flags.size + 1;
          flags.set(flag, id);
          zip.file('xl/media/flag' + id + '.png', canvas.toDataURL().split(',')[1], { base64: true });
        }
        const img = flags.get(flag),
          id = anchors.length + 1;
        anchors.push(
          '<xdr:oneCellAnchor><xdr:from><xdr:col>' +
            i +
            '</xdr:col><xdr:colOff>15000</xdr:colOff><xdr:row>' +
            (r + 1) +
            '</xdr:row><xdr:rowOff>10000</xdr:rowOff></xdr:from><xdr:ext cx="190500" cy="124000"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' +
            id +
            '" name="Flag ' +
            id +
            '"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId' +
            img +
            '"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>',
        );
      }
    const drawing = anchors.length > 0;
    zip.file(
      '[Content_Types].xml',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="' +
        mime +
        'sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="' +
        mime +
        'worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="' +
        mime +
        'styles+xml"/>' +
        (drawing
          ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
          : '') +
        '</Types>',
    );
    zip.file('_rels/.rels', relation('officeDocument', 'xl/workbook.xml'));
    zip.file(
      'xl/_rels/workbook.xml.rels',
      relation('worksheet', 'worksheets/sheet1.xml').replace(
        '</Relationships>',
        '<Relationship Id="rId2" Type="' + rel + '/styles" Target="styles.xml"/></Relationships>',
      ),
    );
    zip.file(
      'xl/workbook.xml',
      '<workbook xmlns="' +
        ns +
        '" xmlns:r="' +
        rel +
        '"><sheets><sheet name="Records" sheetId="1" r:id="rId1"/></sheets></workbook>',
    );
    zip.file(
      'xl/styles.xml',
      '<styleSheet xmlns="' +
        ns +
        '"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="7" applyNumberFormat="1"/><xf applyAlignment="1"><alignment indent="2" horizontal="left"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    );
    if (drawing) {
      zip.file('xl/worksheets/_rels/sheet1.xml.rels', relation('drawing', '../drawings/drawing1.xml'));
      zip.file(
        'xl/drawings/drawing1.xml',
        '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="' +
          rel +
          '">' +
          anchors.join('') +
          '</xdr:wsDr>',
      );
      zip.file(
        'xl/drawings/_rels/drawing1.xml.rels',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          [...flags.values()]
            .map(
              (id) =>
                '<Relationship Id="rId' + id + '" Type="' + rel + '/image" Target="../media/flag' + id + '.png"/>',
            )
            .join('') +
          '</Relationships>',
      );
    }
    const widths =
      '<cols>' +
      columns
        .map(
          (c, i) =>
            '<col min="' +
            (i + 1) +
            '" max="' +
            (i + 1) +
            '" width="' +
            Math.max(12, Math.round((c.width || 130) / 7)) +
            '" customWidth="1"/>',
        )
        .join('') +
      '</cols>';
    zip.file(
      'xl/worksheets/sheet1.xml',
      '<worksheet xmlns="' +
        ns +
        '" xmlns:r="' +
        rel +
        '">' +
        widths +
        '<sheetData>' +
        matrix
          .map(
            (row, i) =>
              '<row ht="' +
              (i ? 20 : 28) +
              '" customHeight="1">' +
              row
                .map((v, j) => {
                  const style = i === 0 ? 1 : columns[j].kind === 'money' ? 2 : columns[j].flags ? 3 : 0;
                  return Number.isFinite(v)
                    ? '<c s="' + style + '"><v>' + v + '</v></c>'
                    : '<c s="' + style + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>';
                })
                .join('') +
              '</row>',
          )
          .join('') +
        '</sheetData>' +
        (drawing ? '<drawing r:id="rId1"/>' : '') +
        '</worksheet>',
    );
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }
  function draw(matrix, start, end, col, last) {
    const canvas = document.createElement('canvas');
    canvas.width = (last - col) * 150;
    canvas.height = (end - start + 1) * 26;
    const ctx = canvas.getContext('2d');
    ctx.font = '13px system-ui';
    const rows = [matrix[0], ...matrix.slice(start, end)];
    rows.forEach((r, i) => {
      ctx.fillStyle = i === 0 ? '#233b40' : i % 2 ? '#fff' : '#eef3f2';
      ctx.fillRect(0, i * 26, canvas.width, 26);
      ctx.fillStyle = i === 0 ? 'white' : '#152b30';
      for (let j = col; j < last; j++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect((j - col) * 150, i * 26, 150, 26);
        ctx.clip();
        ctx.fillText(String(r[j] ?? ''), (j - col) * 150 + 6, i * 26 + 18);
        ctx.restore();
      }
    });
    return canvas;
  }
  async function save(format, columns, rows) {
    const matrix = [columns.map((c) => c.label), ...rows.map((r) => columns.map((c) => r[c.field] ?? ''))];
    if (format === 'JSON')
      return download(
        new Blob(
          [JSON.stringify(rows.map((r) => Object.fromEntries(columns.map((c) => [c.field, r[c.field] ?? null]))))],
          { type: 'application/json' },
        ),
        'records.json',
      );
    if (format === 'CSV')
      return download(
        new Blob(
          [
            '\uFEFF',
            delimited(
              matrix.map((row) => row.map((v) => (typeof v === 'string' && /^[=+@\-\t\r]/.test(v) ? "'" + v : v))),
              ',',
            ),
          ],
          { type: 'text/csv' },
        ),
        'records.csv',
      );
    if (format === 'XLSX') return download(await excel(matrix, columns, rows), 'records.xlsx');
    const pdf = format === 'PDF';
    if (
      !pdf &&
      columns.length * 150 <= 16384 &&
      matrix.length * 26 <= 32760 &&
      columns.length * 150 * matrix.length * 26 <= 32000000
    ) {
      const canvas = draw(matrix, 1, matrix.length, 0, columns.length);
      const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (image) return download(image, 'records.png');
    }
    await library(pdf ? 'jspdf.min.js' : 'jszip.min.js');
    const pages = pdf
      ? new jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true })
      : new JSZip();
    let page = 0;
    for (let i = 1; i < Math.max(2, matrix.length); i += 36)
      for (let j = 0; j < columns.length; j += 8) {
        const canvas = draw(matrix, i, Math.min(i + 36, matrix.length), j, Math.min(columns.length, j + 8));
        if (pdf) {
          if (page) pages.addPage();
          const scale = Math.min(800 / canvas.width, 550 / canvas.height);
          pages.addImage(
            canvas.toDataURL('image/jpeg', 0.92),
            'JPEG',
            20,
            20,
            canvas.width * scale,
            canvas.height * scale,
          );
        } else {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (matrix.length <= 37 && columns.length <= 8) return download(blob, 'records.png');
          pages.file('records-' + String(page + 1).padStart(4, '0') + '.png', blob);
        }
        page++;
        if (page % 12 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      }
    if (pdf) pages.save('records.pdf');
    else download(await pages.generateAsync({ type: 'blob' }), 'records-png.zip');
  }
  return { parse, delimited, save };
})();
