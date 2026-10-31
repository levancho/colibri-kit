// Optional <ui-dialog> custom element (light DOM) around the same core.
import { createDialog } from "../core/dialog.js";

export class UiDialog extends HTMLElement {
  connectedCallback() { this.dataset.ui = "dialog"; queueMicrotask(() => { this.api = createDialog(this); }); }
  disconnectedCallback() { this.api?.destroy(); this.api = null; }
  show() { this.api?.show(); }
  close(v) { this.api?.close(v); }
  get open() { return !!this.api?.open; }
}
if (!customElements.get("ui-dialog")) customElements.define("ui-dialog", UiDialog);
