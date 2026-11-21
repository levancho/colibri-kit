export function configureFillHandle(c) {
  c.button('Select A1:B3', () => {
    c.grid.activate(0, 0);
    c.grid.activate(2, 1, true);
    c.grid.port.focus();
  });
}
