// The catalog: every demo, grouped the way the site lists them. A group file exports an array of
// { id, title, description, Demo } where Demo is a component that shows the piece in use.
import core from "./core.js";
import base from "./base.js";
import data from "./data.js";
import menus from "./menus.js";
import navigation from "./navigation.js";
import mobile from "./mobile.js";
import forms from "./forms.js";
import pickers from "./pickers.js";
import conversation from "./conversation.js";
import ai from "./ai.js";
import motion from "./motion.js";
import blocks from "./blocks.js";
import sidebars from "./sidebars.js";
import applications from "./applications.js";

const group = (id, title, description, demos) => ({ id, title, description, demos });
export const GROUPS = [
  group("core", "Basics", "Layout, text, buttons and the everyday controls.", core),
  group("base", "Display", "Surfaces, typography and small building blocks.", base),
  group("data", "Data display", "Tables, lists, carousels and placeholders.", data),
  group("menus", "Overlays", "Things that open above the screen.", menus),
  group("mobile", "Phone patterns", "Pieces only a phone app needs: bottom bar, app bar, swipe rows, action sheets.", mobile),
  group("navigation", "Navigation", "Moving between and within screens.", navigation),
  group("forms", "Forms", "Inputs and selection controls.", forms),
  group("pickers", "Pickers", "Sliders, dates, colours, files and reordering.", pickers),
  group("conversation", "Conversation", "Messages, attachments and charts.", conversation),
  group("ai", "AI elements", "Chat, reasoning, tools and agent status.", ai),
  group("motion", "Motion and theming", "Entrances, state changes and scoped themes.", motion),
  group("blocks", "Auth blocks", "Ready-made sign-in and sign-up screens.", blocks),
  group("sidebars", "Nav layouts", "Ready-made navigation layouts with a slide-in panel.", sidebars),
  group("applications", "App components", "Dashboard pieces: metrics, charts, tables, boards.", applications),
].filter((entry) => entry.demos.length);

export const DEMOS = Object.fromEntries(GROUPS.flatMap((entry) => entry.demos.map((demo) => [demo.id, { ...demo, group: entry.title }])));
