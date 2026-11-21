// Editable fixtures for the Colibri example and the paired browser replay.
export const columns = [
  { field: 'id', label: 'ID', type: 'number', width: 70 },
  { field: 'first', label: 'First name', editable: true, width: 120 },
  { field: 'last', label: 'Last name', editable: true, width: 120 },
  { field: 'level', label: 'Level', type: 'number', editable: true, width: 88 },
  { field: 'optIn', label: 'Opt-in', type: 'boolean', editable: true, width: 86 },
  { field: 'info', label: 'More info', type: 'uri', editable: true, width: 170 },
  { field: 'photo', label: 'Photo', type: 'image', width: 90 },
  { field: 'manager', label: 'Manager', type: 'drilldown', width: 120 },
  { field: 'protected', label: 'Protected', type: 'protected', width: 102 },
];
export function sampleRows() {
  const names = [
    ['Ada', 'Stone'],
    ['Ben', 'Wong'],
    ['Cy', 'Reed'],
    ['Dee', 'Shah'],
    ['Eli', 'Park'],
    ['Flo', 'West'],
  ];
  const photos = names.map(([first, last], index) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = ['#326358', '#725379', '#315e82'][index % 3];
    ctx.fillRect(0, 0, 96, 96);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '38px sans-serif';
    ctx.fillText(first[0] + last[0], 48, 61);
    return canvas.toDataURL();
  });
  return Array.from({ length: 48 }, (_, i) => ({
    id: i + 1,
    first: names[i % names.length][0],
    last: names[i % names.length][1],
    level: 1 + ((i * 7) % 48),
    optIn: i % 2 === 1,
    info: 'https://example.org/staff/' + (i + 1),
    photo: [photos[i % photos.length]],
    manager: [{ text: 'Rae Bell' }],
    protected: null,
  }));
}
export function createExample(host, rows = sampleRows()) {
  return new ColibriGrid(host, { editorPresentation: 'inline', label: 'Employee directory', columns, rows });
}
