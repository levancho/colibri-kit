import React, { useState } from 'react';
import { ColibriGrid } from '@colibri-kit/ui/react/grid';
import { projectRows } from '../cells.js';
import { projectColumns } from './columns.jsx';

export default function PasteSupport() {
  const [rows, setRows] = useState(() => projectRows('paste-support'));
  const [message, setMessage] = useState('');
  async function copyExample() {
    try {
      await navigator.clipboard.writeText('Atlas revision\tAda Bell\nBeacon revision\tLena Park');
      setMessage('Copied two rows and two columns');
    } catch {
      setMessage('Clipboard access was declined');
    }
  }
  return (
    <>
      <button onClick={copyExample}>Copy 2 × 2 sample</button>
      <ColibriGrid label="Paste support" rows={rows} columns={projectColumns} onRowsChange={setRows} />
      <output>{message}</output>
    </>
  );
}
