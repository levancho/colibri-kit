// Optional entry: @colibri-kit/native/svg. Needs react-native-svg. See ARCHITECTURE.md ("Optional entries").
//
// Charts that core React Native cannot draw (lines, areas, pies, rings) and an outline icon set, themed like the
// rest of Colibri: series colours come from the theme hue exactly as in the bar charts of the main entry, so the
// two families can share a screen. Every chart is one image for screen readers, described by a generated summary
// of its numbers unless you pass accessibilityLabel.
//
//   import { LineChart, DonutChart, Icon } from "@colibri-kit/native/svg";
export { LineChart, AreaChart, BarChart } from "./cartesian.js";
export { PieChart, DonutChart } from "./pie.js";
export { Sparkline, ProgressRing, Gauge } from "./indicators.js";
export { Icon, iconNames } from "./icons.js";
