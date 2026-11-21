export function configurePasteSupport(c) {
  c.button('Copy 2 × 2 sample', async () => {
    try {
      await navigator.clipboard.writeText('Atlas revision\tAda Bell\nBeacon revision\tLena Park');
      c.notice('Copied two rows and two columns');
    } catch {
      c.notice('Clipboard access was declined');
    }
  });
}
