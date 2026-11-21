import './pivot.js';

export function mountInventory(container) {
  const settings = {
    label: 'Inventory', columns: [
      {field:'id',label:'SKU'}, {field:'item',label:'Item',editable:true,width:220},
      {field:'warehouse',label:'Warehouse'}, {field:'qty',label:'Quantity',editable:true,type:'number',
        validate: value => Number.isInteger(value) && value >= 0 ? '' : 'Enter a whole quantity of zero or more.'}
    ],
    rows: Array.from({length:50000}, (_,i) => ({
      id:'CB-'+String(i+1).padStart(5,'0'), item:['Notebook','Desk tray','Folio','Binder','Archive box'][i%5]+' '+(i+1),
      category:['Notebook','Desk tray','Folio','Binder','Archive box'][i%5], warehouse:['East','West','Central'][i%3], qty:(i*7919)%10007
    }))
  };
  const records = new Map(settings.rows.map(row => [row.id,row]));
  const help = container.querySelector('#help'), originalHelp = help.textContent;
  const mode = container.querySelector('#mode'), operation = container.querySelector('#operation');
  const dimension = container.querySelector('#dimension');
  const host = container.querySelector('#inventory');
  let grid;
  const back = container.querySelector('#return');
  back.onclick = () => { render(); grid.port.focus(); };
  host.addEventListener('colibri-change', e => records.set(e.detail.id,e.detail.row));
  function render() {
    grid?.destroy();
    back.hidden = true;
    container.querySelector('#aggregate').hidden = !['pivot','group'].includes(mode.value);
    container.querySelector('#axis').hidden = container.querySelector('#aggregate').hidden;
    if (mode.value === 'records') {
      help.textContent = originalHelp;
      grid = new ColibriGrid(host,{...settings,rows:[...records.values()]});
    } else {
      const across = mode.value === 'pivot' ? (dimension.value === 'category' ? 'warehouse' : 'category') : undefined;
      help.textContent = across ? 'Each cell summarizes the records at its row and column intersection.' : 'Each row summarizes all records in its group.';
      const projection = ColibriGrid.pivot(records.values(),{group:dimension.value,groupLabel:dimension.selectedOptions[0].text,across,measure:'qty',operation:operation.value});
      grid = new ColibriGrid(host,{...projection,label:'Inventory summary',onInspect:(summary,column) => {
        const source = [...records.values()].filter(row => row[dimension.value] === summary.group && (!across || row[across] === column.bucket));
        grid.destroy();
        back.hidden = false;
        help.textContent = [summary.group, across && column.label].filter(Boolean).join(' · ') + ' — ' + source.length.toLocaleString() + ' contributing records';
        grid = new ColibriGrid(host,{...settings,label:'Contributing records',rows:source});
        grid.port.focus();
      }});
      help.textContent += ' Select a figure to inspect its records.';
    }
  }
  mode.onchange = dimension.onchange = operation.onchange = render;
  render();
  return () => grid.destroy();
}
