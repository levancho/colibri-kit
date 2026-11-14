// Shared helpers for the component files. Not part of the public API.
import { createContext } from "react";
import { Platform } from "react-native";

export const web = Platform.OS === "web";
/** Depth: boxShadow on the web, shadow props and elevation on iOS and Android. Pass theme.shadow.s | m | l. */
export const depth = (shadow) => (web ? { boxShadow: shadow.boxShadow } : { shadowColor: shadow.shadowColor, shadowOffset: shadow.shadowOffset, shadowOpacity: shadow.shadowOpacity, shadowRadius: shadow.shadowRadius, elevation: shadow.elevation });
/** A gap prop is a space token ("3xs" … "2xl") or a number. */
export const gapOf = (theme, gap) => (typeof gap === "number" ? gap : theme.space[gap] ?? theme.space.s);
/** Merges style values (objects, arrays, falsy) into one flat array for the style prop. */
export const flat = (...styles) => styles.flat(Infinity).filter(Boolean);
// Buttons and badges keep their own width in a column, and line up with their neighbours in a Cluster row.
export const InRow = createContext(false);
export const selfAlign = (inRow) => (inRow ? null : { alignSelf: "flex-start" });
/** Text glyphs used as icons, so the package needs no icon font or SVG dependency. */
export const GLYPH = { check: "✓", close: "×", chevronRight: "›", chevronLeft: "‹", chevronDown: "⌄", chevronUp: "⌃", more: "⋯", search: "⌕", plus: "+", minus: "−", star: "★", starEmpty: "☆", dot: "•", arrowRight: "→", arrowLeft: "←", arrowUp: "↑", arrowDown: "↓", info: "i", warn: "!", menu: "☰" };
