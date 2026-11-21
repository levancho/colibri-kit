// Recorded browser observations from scripts/check-colibri-{grid-samples,sample-references}.cjs.
export const checks = {
  "add-columns": {
    "Colibri": "10,000 records, 2–200 columns, committed edit retained",
    "Glide": "Changed 10 → 200 → 2 columns using the story control; scrollable width expanded and contracted"
  },
  "freeze-columns": {
    "Colibri": "First two fields retained their horizontal position",
    "Glide": "First-column values stayed at identical pixels after scrolling 800 pixels"
  },
  "search-as-filter": {
    "Colibri": "240 → 30 matching → 0 matching → 240",
    "Glide": "Search reduced the scrollable rows and clearing it restored them"
  },
  "custom-cells": {
    "Colibri": "17 fields, rating saved at 2/5, hierarchy collapsed and restored",
    "Glide": "Opened tags on an editable row and read its choices: Bug, Feature, Enhancement"
  },
  "custom-cell-editing": {
    "Colibri": "Stage saved, duplicate tag suppressed, canceled draft discarded",
    "Glide": "Changed dropdown to B, reopened a multiselect editor and canceled it"
  },
  "validate-data": {
    "Colibri": "Invalid edit rejected, 7,200 saved, invalid two-cell paste rolled back",
    "Glide": "Rejected Invalid and committed Valid to a text cell"
  },
  "header-menus": {
    "Colibri": "Descending sort changed first record; Copy, Paste, Fill down, Fill right, Clear",
    "Glide": "Opened the header menu and selected Add column right; the reference dismisses the menu"
  },
  "paste-support": {
    "Colibri": "Atlas revision\tAda Bell\nBeacon revision\tLena Park",
    "Glide": "Pasted the same 2 × 2 matrix and read all four strings back from the canvas"
  },
  "fill-handle": {
    "Colibri": "Dragged one project value over four rows",
    "Glide": "Filled first-name value across three records"
  },
  "rapid-updates": {
    "Colibri": "Last row changed 36387 → 36390 while first-row budget stayed 1200",
    "Glide": "Live update counter advanced (80000 → 120000)"
  }
};
