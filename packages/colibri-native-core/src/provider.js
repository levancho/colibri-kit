// Theme context. Components work without a provider (default light theme); wrap the app to follow the
// system colour scheme or to re-brand:  <ColibriProvider hue={160}>…</ColibriProvider>
import { createContext, createElement, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { createTheme } from "./theme.js";

const ThemeContext = createContext(createTheme());

/** scheme: "auto" (follow the device), "light" or "dark". hue, chroma and radius re-brand everything below. */
export function ColibriProvider({ hue, chroma, radius, scheme = "auto", children }) {
  const device = useColorScheme();
  const resolved = scheme === "auto" ? (device === "dark" ? "dark" : "light") : scheme;
  const theme = useMemo(() => createTheme({ hue, chroma, radius, scheme: resolved }), [hue, chroma, radius, resolved]);
  return createElement(ThemeContext.Provider, { value: theme }, children);
}

export const useTheme = () => useContext(ThemeContext);
