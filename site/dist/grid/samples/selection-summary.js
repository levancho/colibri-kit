// Reserve space for the exact overflow count before deciding how many chips fit.
export function selectionSummary(trigger) {
  const more = document.createElement('span');
  more.className = 'selection-more';
  more.hidden = true;
  let frame;
  const observer = new ResizeObserver(schedule);

  function schedule() {
    if (!frame) frame = requestAnimationFrame(layout);
  }
  function layout() {
    frame = 0;
    if (!more.isConnected || !trigger.clientWidth) return;
    const chips = [...trigger.children].filter(child => child !== more);
    for (const chip of chips) chip.hidden = false;
    more.hidden = true;
    const style = getComputedStyle(trigger);
    const width = trigger.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap) || 0;
    const widths = chips.map(chip => chip.getBoundingClientRect().width);
    let used = widths.reduce((total, w) => total + w, 0) + (chips.length - 1) * gap;
    if (used <= width) return;
    more.hidden = false;
    for (let i = chips.length - 1; i >= 0; i--) {
      used -= widths[i] + (i ? gap : 0);
      chips[i].hidden = true;
      more.textContent = '+' + (chips.length - i) + ' more';
      if (used + (i ? gap : 0) + more.getBoundingClientRect().width <= width) break;
    }
  }
  return {
    refresh() {
      trigger.setAttribute('aria-description', trigger.title);
      if (trigger.children.length < 2) {
        observer.disconnect();
        return;
      }
      trigger.append(more);
      observer.observe(trigger);
      schedule();
    },
    disconnect() {
      observer.disconnect();
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
