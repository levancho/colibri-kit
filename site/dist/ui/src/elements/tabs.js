// Optional Custom Element wrapper: <ui-tabs> = same markup + same core, auto-lifecycle.
// Light DOM only (no Shadow DOM), so page CSS styles everything exactly as with data-ui="tabs".
import { createTabs } from "../core/tabs.js";

export class UiTabs extends HTMLElement {
  connectedCallback() {
    this.dataset.ui = "tabs";
    queueMicrotask(() => { if (this.isConnected) this.api = createTabs(this); });
  }
  disconnectedCallback() { queueMicrotask(() => { if (!this.isConnected) { this.api?.destroy(); this.api = null; } }); }
  get value() { return this.api?.value; }
  set value(v) { this.api?.select(v); }
}
if (!customElements.get("ui-tabs")) customElements.define("ui-tabs", UiTabs);
