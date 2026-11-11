// Source of site/dist/widgets/embed.js (built by tools/build-widgets.mjs).
// Defines <colibri-widget config='{…}'>. The widget renders inside a shadow root with its own copy of Colibri CSS,
// so the host page's styles and the widget's styles cannot affect each other. No network requests, no cookies.
import { renderWidget, parseConfig, WIDGET_CSS } from "../site/src/widgets/render.js";
import colibri from "../packages/colibri-css/dist/colibri.min.css";

// Tokens are declared on :root, which matches nothing inside a shadow root; :host is the equivalent there.
const CSS = colibri.replaceAll(":root", ":host") + ":host{display:block}:host([inline]){display:inline-block;vertical-align:middle}" + WIDGET_CSS;
let sheet;

class ColibriWidget extends HTMLElement {
  static observedAttributes = ["config"];
  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    if (!root.adoptedStyleSheets.length) {
      if (!sheet) { sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); }
      root.adoptedStyleSheets = [sheet];
    }
    const config = parseConfig(this.getAttribute("config"));
    this.toggleAttribute("inline", config.t === "badge");
    root.innerHTML = renderWidget(config);
    // A sign-up form without an endpoint has nowhere to send the address; do nothing rather than reload the page.
    root.querySelector("form[data-cw-demo]")?.addEventListener("submit", (event) => event.preventDefault());
  }
}
if (!customElements.get("colibri-widget")) customElements.define("colibri-widget", ColibriWidget);
