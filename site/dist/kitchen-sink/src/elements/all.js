// Colibri UI: optional custom elements for EVERY primitive: <ui-tabs>, <ui-select>, <ui-dropdown-menu>, …
// Light DOM, no Shadow DOM, no styles. Same core as data-ui="…". Import once: import "@colibri-kit/ui/elements/all".
import { registry } from "../core/registry.js";

for (const [name, factory] of Object.entries(registry)) {
  const tag = `ui-${name}`;
  if (customElements.get(tag)) continue;
  customElements.define(tag, class extends HTMLElement {
    connectedCallback() { this.dataset.ui ||= name; queueMicrotask(() => { if (this.isConnected) this.api = factory(this); }); }
    disconnectedCallback() { queueMicrotask(() => { if (!this.isConnected) { this.api?.destroy?.(); this.api = null; } }); }
  });
}
