// Things that sit above the screen: Dialog, Sheet and toasts. Built on React Native's own Modal and Animated.
import { createContext, createElement as h, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, View } from "react-native";
import { useTheme } from "./provider.js";
import { toneName } from "./theme.js";
import { Text, Heading, Cluster } from "./components.js";

const web = Platform.OS === "web";
const depth = (shadow) => (web ? { boxShadow: shadow.boxShadow } : { shadowColor: shadow.shadowColor, shadowOffset: shadow.shadowOffset, shadowOpacity: shadow.shadowOpacity, shadowRadius: shadow.shadowRadius, elevation: shadow.elevation });

/**
 * A centred modal card. The backdrop and the Android back button call onClose; set dismissible={false} for
 * decisions that must be answered. actions is a row of buttons shown at the bottom right.
 */
export function Dialog({ visible, onClose, title, children, actions, dismissible = true }) {
  const theme = useTheme();
  return h(Modal, { visible, transparent: true, animationType: "fade", onRequestClose: dismissible ? onClose : undefined, statusBarTranslucent: true },
    h(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.space.l } },
      h(Pressable, { onPress: dismissible ? onClose : undefined, accessibilityLabel: "Close", accessible: dismissible, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.overlay } }),
      h(View, { accessibilityViewIsModal: true, accessibilityRole: web ? "dialog" : undefined, "aria-modal": true,
        style: { width: "100%", maxWidth: 420, padding: theme.space.l, gap: theme.space.s, borderRadius: theme.radius.l, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.surface, ...depth(theme.shadow.l) } },
        title ? h(Heading, { level: 3 }, title) : null,
        typeof children === "string" ? h(Text, { tone: "muted" }, children) : children,
        actions ? h(Cluster, { justify: "flex-end", gap: "xs", style: { marginTop: theme.space.xs } }, actions) : null)));
}

/** A panel that slides up from the bottom edge. Tap outside (or press back) to close. */
export function Sheet({ visible, onClose, title, children }) {
  const theme = useTheme();
  return h(Modal, { visible, transparent: true, animationType: "slide", onRequestClose: onClose, statusBarTranslucent: true },
    h(View, { style: { flex: 1, justifyContent: "flex-end" } },
      h(Pressable, { onPress: onClose, accessibilityLabel: "Close", style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.overlay } }),
      h(View, { accessibilityViewIsModal: true, style: { padding: theme.space.l, paddingBottom: theme.space.xl, gap: theme.space.s, borderTopLeftRadius: theme.radius.l, borderTopRightRadius: theme.radius.l, backgroundColor: theme.colors.surface, ...depth(theme.shadow.l) } },
        h(View, { style: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.line, marginBottom: theme.space["2xs"] } }),
        title ? h(Heading, { level: 3 }, title) : null,
        typeof children === "string" ? h(Text, { tone: "muted" }, children) : children)));
}

const ToastContext = createContext({ show() {}, hide() {} });
/** const toast = useToast(); toast.show("Saved", { tone: "ok", duration: 3000 }); */
export const useToast = () => useContext(ToastContext);

/** Put one near the root, inside ColibriProvider. Shows one message at a time above the bottom edge. */
export function ToastProvider({ children, offset = 32 }) {
  const theme = useTheme(), [toast, setToast] = useState(null), opacity = useRef(new Animated.Value(0)).current, timer = useRef(null);
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: !web }).start(() => setToast(null));
  }, [opacity]);
  const show = useCallback((message, options = {}) => {
    clearTimeout(timer.current);
    setToast({ message, tone: options.tone });
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: !web }).start();
    if (options.duration !== 0) timer.current = setTimeout(hide, options.duration ?? 3000);
  }, [opacity, hide]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const api = useMemo(() => ({ show, hide }), [show, hide]);
  const tone = toast ? theme.tones[toneName(toast.tone)] : null;
  return h(ToastContext.Provider, { value: api }, children,
    toast ? h(Animated.View, { pointerEvents: "box-none", style: { position: "absolute", left: theme.space.m, right: theme.space.m, bottom: offset, alignItems: "center", opacity } },
      h(Pressable, { onPress: hide, accessibilityRole: "alert", accessibilityLiveRegion: "polite",
        style: { maxWidth: 480, flexDirection: "row", alignItems: "center", gap: theme.space.xs, paddingVertical: theme.space.s, paddingHorizontal: theme.space.m, borderRadius: theme.radius.m, backgroundColor: theme.colors.fg, ...depth(theme.shadow.l) } },
        tone ? h(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: tone.inverse } }) : null,
        h(Text, { size: "sm", weight: "medium", style: { color: theme.colors.bg, flexShrink: 1 } }, toast.message))) : null);
}
