// ApplicationBoard for the gestures entry: the core kanban board, plus dragging a card from one lane to another.
//
// How the drag works. A press of 300 ms on a card lifts it. The card that moves is a copy drawn above the whole
// board (the lanes are inside a horizontal scroll view, which would clip the real card), placed with shared values
// from the card's measured position; the real card is dimmed meanwhile. The lane under the finger is worked out on
// the UI thread from the finger position and the scroll offset, the board scrolls sideways while the finger is near
// an edge, and letting go over another lane moves the card there. React state changes when the card is lifted and
// when it is dropped.
import { createElement as h, memo, useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, LayoutAnimationConfig, LinearTransition, measure, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useFrameCallback, useScrollOffset, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { useTheme } from "../provider.js";
import { depth, flat, GLYPH } from "../internal.js";
import { Stack, Text, Heading, Button, Badge, Avatar } from "../components.js";
import { Sheet } from "./sheets.js";
import { FILL, SPRING, clamp, hiddenFromReaders, useStable } from "./shared.js";

const EMPTY = [];
const send = (onAction, action, id, extra) => onAction?.({ action, id, ...extra });
/** "$1,100" → 1100, "Pro" → null. */
const num = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value ?? "").trim();
  if (!/^[^A-Za-z]*\d/.test(text)) return null;
  const parsed = parseFloat(text.replace(/[−–]/g, "-").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const group = (value) => { const [whole, part] = String(value).split("."); return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (part ? "." + part : ""); };
/** Formats a number like a sample price: money(640, "$320") → "$640". */
const money = (amount, sample = "") => { const prefix = String(sample).match(/^[^\d-]*/)?.[0] ?? ""; return prefix + group(Number.isInteger(amount) ? amount : amount.toFixed(2)); };
const Tag = ({ style, ...rest }) => h(Badge, { style: flat({ alignSelf: "auto" }, style), ...rest });
const row = (gap = 8, align = "center") => ({ flexDirection: "row", alignItems: align, gap });
const caps = { letterSpacing: 1, textTransform: "uppercase" };
const EDGE = 56, SCROLL_SPEED = 12, HOLD = 300;

const Chip = memo(function Chip({ label, value, selected = false, onSelect, detail }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect?.(value), hitSlop: 6, accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: 32, paddingHorizontal: 12, ...row(6), borderRadius: theme.radius.full, borderWidth: 1, borderColor: selected ? c.accent : c.line, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : c.surface }) },
    h(Text, { size: "sm", weight: "medium", style: { color: selected ? c.accent : c.fg } }, label),
    detail == null ? null : h(Text, { size: "xs", weight: "semibold", style: { color: selected ? c.accent : c.muted } }, detail));
});
const OptionRow = memo(function OptionRow({ label, value, selected, onSelect }) {
  const theme = useTheme(), c = theme.colors;
  return h(Pressable, { onPress: () => onSelect?.(value), accessibilityRole: "button", accessibilityState: { selected }, "aria-pressed": selected,
    style: ({ pressed }) => ({ minHeight: theme.touch, paddingHorizontal: theme.space.s, ...row(theme.space.s), borderRadius: theme.radius.s, backgroundColor: selected ? c.accentSoft : pressed ? c.sunken : "transparent" }) },
    h(Text, { weight: selected ? "semibold" : "regular", style: { flex: 1, color: selected ? c.accent : c.fg } }, label),
    selected ? h(Text, { weight: "bold", tone: "accent" }, GLYPH.check) : null);
});

/** What a card shows. Used for the card in its lane and for the copy that follows the finger. */
const DealFace = memo(function DealFace({ deal }) {
  const theme = useTheme();
  return [
    h(View, { key: "top", style: row(theme.space.xs, "flex-start") },
      h(Text, { weight: "semibold", numberOfLines: 2, style: { flex: 1 } }, deal.company), h(Text, { tone: "muted", weight: "bold" }, GLYPH.more)),
    h(Text, { key: "value", size: "lg", weight: "bold", style: { letterSpacing: -0.3 } }, deal.value),
    deal.next ? h(Text, { key: "next", size: "sm", tone: "muted", numberOfLines: 2 }, deal.next) : null,
    h(View, { key: "owner", style: row(theme.space.xs) }, h(Avatar, { name: deal.owner, size: 24 }), h(Text, { size: "sm", tone: "muted", numberOfLines: 1, style: { flex: 1 } }, deal.owner)),
  ];
});
const cardStyle = (theme, pressed) => ({ padding: theme.space.s, gap: theme.space.xs, borderRadius: theme.radius.m, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: pressed ? theme.colors.bg : theme.colors.surface, ...depth(theme.shadow.s) });

const DealCard = memo(function DealCard({ deal, lane, lifted, drag, onOpen }) {
  const theme = useTheme(), card = useAnimatedRef();
  const pan = usePanGesture(useMemo(() => ({
    activateAfterLongPress: HOLD,
    onActivate: (event) => { "worklet"; const box = measure(card); if (box) drag.lift(deal.id, lane, box, event); },
    onUpdate: (event) => { "worklet"; drag.move(deal.id, event); },
    onDeactivate: (event) => { "worklet"; drag.drop(deal.id, event); },
  }), [drag, deal.id, lane, card]));
  return h(GestureDetector, { gesture: pan, touchAction: "pan-y", userSelect: "none" },
    // The fade-in belongs to this view, so the dimming of a lifted card is on the Pressable inside it.
    h(Animated.View, { ref: card, layout: LinearTransition.duration(200), entering: FadeIn.duration(200) },
      h(Pressable, { onPress: () => onOpen(deal.id), accessibilityRole: "button", accessibilityLabel: `${deal.company}, ${deal.value}, ${deal.owner}. Change stage`, accessibilityHint: "Press and hold to drag to another stage",
        style: ({ pressed }) => [cardStyle(theme, pressed), lifted && { opacity: 0.3 }] },
        h(DealFace, { deal }))));
});

const Lane = memo(function Lane({ lane, index, width, lifted, hover, drag, onOpen }) {
  const theme = useTheme(), c = theme.colors, deals = lane.deals ?? EMPTY;
  const values = deals.map((deal) => num(deal.value)), total = values.length && values.every((value) => value != null) ? money(values.reduce((sum, value) => sum + value, 0), deals[0].value) : null;
  // The outline of the lane a held card is over.
  const over = useAnimatedStyle(() => ({ opacity: withTiming(hover.value === index ? 1 : 0, { duration: 120 }) }), [hover, index]);
  return h(View, { accessibilityLabel: `${lane.title}, ${deals.length} ${deals.length === 1 ? "opportunity" : "opportunities"}`, style: { width, padding: theme.space.xs, gap: theme.space.xs, borderRadius: theme.radius.l, borderWidth: 1, borderColor: c.line, backgroundColor: c.sunken } },
    h(Animated.View, { style: [FILL, { pointerEvents: "none", margin: -1, borderRadius: theme.radius.l, borderWidth: 2, borderColor: c.accent, backgroundColor: c.accentSoft }, over] }),
    h(View, { style: { ...row(theme.space.xs), paddingHorizontal: theme.space["2xs"], minHeight: 32 } },
      h(Text, { weight: "bold", numberOfLines: 1, style: { flexShrink: 1 } }, lane.title), h(Tag, { style: { backgroundColor: c.surface } }, deals.length),
      h(View, { style: { flex: 1 } }), total ? h(Text, { size: "sm", tone: "muted", weight: "medium" }, total) : null),
    deals.length ? deals.map((deal) => h(DealCard, { key: deal.id, deal, lane: index, lifted: lifted === deal.id, drag, onOpen }))
      : h(View, { style: { minHeight: 72, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.m, borderWidth: 1, borderStyle: "dashed", borderColor: c.line } }, h(Text, { size: "sm", tone: "muted" }, "No opportunities")));
});

/**
 * A kanban board: lanes in a horizontal pager that snaps lane by lane, with chips to jump to a lane.
 * Same props and events as the core ApplicationBoard. Pressing a card calls onAction({ action: "edit-deal", id })
 * and opens a sheet to move it to another lane; that sheet is the way to move a card with a screen reader, a
 * keyboard or a switch. New here: press and hold a card to lift it, drag it over another lane and let go. Either
 * way the move calls onAction({ action: "move-deal", id, value: laneId }) and the card joins the end of that lane.
 * The board keeps its own copy of the lanes, so a move shows at once, and takes a new copy when the content of
 * model.lanes changes.
 * model: { title, description, lanes: [{ id, title, deals: [{ id, company, value, owner, next? }] }] }.
 */
export function ApplicationBoard({ model = {}, onAction, style }) {
  const theme = useTheme(), window = useWindowDimensions(), chips = useRef(null);
  const given = useMemo(() => JSON.stringify(model.lanes ?? EMPTY), [model.lanes]);
  const [state, setState] = useState({ given, lanes: model.lanes ?? EMPTY });
  if (state.given !== given) setState({ given, lanes: model.lanes ?? EMPTY });
  const lanes = state.lanes, [at, setAt] = useState(0), [open, setOpen] = useState(null), [measured, setMeasured] = useState(0), [lifted, setLifted] = useState(null);
  const gap = theme.space.s, laneWidth = Math.max(220, Math.min(300, (measured || window.width - theme.space.m * 2) - 56)), pitch = laneWidth + gap, count = lanes.length;
  const openLane = lanes.find((lane) => lane.deals?.some((deal) => deal.id === open)), openDeal = openLane?.deals.find((deal) => deal.id === open);
  // The sheet keeps showing the card it was opened for while it slides away.
  const lastOpen = useRef(null);
  if (openDeal) lastOpen.current = { deal: openDeal, lane: openLane };
  const sheetDeal = openDeal ?? lastOpen.current?.deal, sheetLane = openLane ?? lastOpen.current?.lane;
  const liftedDeal = lifted == null ? null : lanes.flatMap((lane) => lane.deals ?? EMPTY).find((deal) => deal.id === lifted);

  const board = useAnimatedRef(), pager = useAnimatedRef(), scrollX = useScrollOffset(pager);
  const active = useSharedValue(""), held = useSharedValue(false), hover = useSharedValue(-1), source = useSharedValue(-1);
  // The copy that follows the finger: where it started (inside the board), its size, how far it has moved, how lifted it looks.
  const originX = useSharedValue(0), originY = useSharedValue(0), ghostWidth = useSharedValue(0), moveX = useSharedValue(0), moveY = useSharedValue(0), raised = useSharedValue(0), shown = useSharedValue(0);
  const fingerX = useSharedValue(0), boardX = useSharedValue(0), boardWidth = useSharedValue(0);

  // Keeps the chip of the lane in view (chip widths are not measured, so the offset is an estimate).
  const show = useStable((index) => { if (index === at || index < 0 || index >= lanes.length) return; setAt(index); if (index >= lanes.length - 1) chips.current?.scrollToEnd({ animated: true }); else chips.current?.scrollTo({ x: Math.max(0, index * 96 - 48), animated: true }); });
  const jump = useStable((index) => { show(index); pager.current?.scrollTo({ x: index * pitch, animated: true }); });
  // On the web the press that lifted a card is still reported as a press when the finger lifts over the card. A
  // card that is being carried, or was put down a moment ago, is not also opened.
  const carried = useRef({ now: false, until: 0 }).current;
  const edit = useStable((id) => { if (carried.now || Date.now() < carried.until) return; setOpen(id); send(onAction, "edit-deal", id); });
  const transfer = (id, laneId) => {
    const from = lanes.find((lane) => lane.deals?.some((deal) => deal.id === id)), deal = from?.deals.find((each) => each.id === id);
    if (!deal || !lanes.some((lane) => lane.id === laneId) || laneId === from.id) return;
    // Only the two lanes involved become new objects, so the other lanes do not render again.
    const next = lanes.map((lane) => (lane.id === laneId ? { ...lane, deals: [...(lane.deals ?? EMPTY), deal] } : lane.id === from.id ? { ...lane, deals: lane.deals.filter((each) => each.id !== id) } : lane));
    setState({ given, lanes: next }); send(onAction, "move-deal", id, { value: laneId });
  };
  const move = useStable((laneId) => { const id = open; setOpen(null); if (id != null) transfer(id, laneId); });
  const picked = useStable((id) => { carried.now = true; setLifted(id); auto.setActive(true); });
  const dropped = useStable((id, laneIndex) => { carried.now = false; carried.until = Date.now() + 300; auto.setActive(false); setLifted(null); if (laneIndex >= 0 && lanes[laneIndex]) transfer(id, lanes[laneIndex].id); });

  const drag = useMemo(() => {
    const aim = () => {
      "worklet";
      if (!held.value) return;
      hover.value = clamp(Math.floor((fingerX.value - boardX.value + scrollX.value + gap / 2) / pitch), 0, count - 1);
    };
    const finish = (id, lane) => { "worklet"; active.value = ""; shown.value = 0; raised.value = 0; scheduleOnRN(dropped, id, lane); };
    return {
      aim,
      lift: (id, lane, box, event) => {
        "worklet";
        const frame = measure(board);
        if (active.value !== "" || !frame) return;
        active.value = id; held.value = true; source.value = lane;
        boardX.value = frame.pageX; boardWidth.value = frame.width; fingerX.value = event.absoluteX;
        originX.value = box.pageX - frame.pageX; originY.value = box.pageY - frame.pageY; ghostWidth.value = box.width;
        moveX.value = 0; moveY.value = 0; shown.value = 1; raised.value = withTiming(1, { duration: 140 });
        aim();
        scheduleOnRN(picked, id);
      },
      move: (id, event) => {
        "worklet";
        if (active.value !== id || !held.value) return;
        moveX.value = event.translationX; moveY.value = event.translationY; fingerX.value = event.absoluteX;
        aim();
      },
      drop: (id) => {
        "worklet";
        if (active.value !== id || !held.value) return;
        held.value = false;
        const to = hover.value;
        hover.value = -1;
        if (to >= 0 && to !== source.value) {
          // Over another lane: the copy shrinks away where it is and the card appears at the end of that lane.
          raised.value = withTiming(0, { duration: 140 }, () => { "worklet"; finish(id, to); });
          return;
        }
        // Back where it came from.
        moveY.value = withSpring(0, SPRING);
        moveX.value = withSpring(0, { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass, overshootClamping: true }, () => { "worklet"; finish(id, -1); });
      },
    };
  }, [active, held, hover, source, originX, originY, ghostWidth, moveX, moveY, raised, shown, fingerX, boardX, boardWidth, scrollX, board, gap, pitch, count, picked, dropped]);

  // While a card is held near the left or right edge of the board, scroll the lanes.
  const auto = useFrameCallback(useCallback(() => {
    "worklet";
    if (!held.value) return;
    const x = fingerX.value - boardX.value, low = EDGE, high = boardWidth.value - EDGE;
    const speed = x < low ? (x - low) / EDGE : x > high ? (x - high) / EDGE : 0;
    if (speed === 0) return;
    scrollTo(pager, Math.max(0, scrollX.value + clamp(speed, -1, 1) * SCROLL_SPEED), 0, false);
    drag.aim();
  }, [held, fingerX, boardX, boardWidth, scrollX, pager, drag]), false);

  const ghost = useAnimatedStyle(() => ({
    opacity: shown.value * (0.4 + 0.6 * raised.value), width: ghostWidth.value,
    transform: [{ translateX: originX.value + moveX.value }, { translateY: originY.value + moveY.value }, { scale: 1 + 0.04 * raised.value }, { rotate: `${2 * raised.value}deg` }],
  }), [shown, raised, ghostWidth, originX, originY, moveX, moveY]);
  useAnimatedReaction(() => Math.round(scrollX.value / pitch), (now, before) => { "worklet"; if (now !== before && !held.value) scheduleOnRN(show, now); }, [scrollX, held, pitch, show]);

  return h(Animated.View, { ref: board, style: flat({ gap: theme.space.xs }, style), onLayout: (event) => setMeasured(event.nativeEvent.layout.width) },
    model.title || model.description ? h(View, { style: { gap: 2 } }, model.title ? h(Heading, { level: 3 }, model.title) : null, model.description ? h(Text, { size: "sm", tone: "muted" }, model.description) : null) : null,
    h(ScrollView, { ref: chips, horizontal: true, showsHorizontalScrollIndicator: false, accessibilityLabel: "Stages", keyboardShouldPersistTaps: "handled", style: { flexGrow: 0 }, contentContainerStyle: { gap: 8, alignItems: "center", paddingVertical: 6 } },
      h(Text, { size: "xs", weight: "semibold", tone: "muted", style: { marginRight: 2 } }, "Stages"),
      lanes.map((lane, index) => h(Chip, { key: lane.id, label: lane.title, value: index, detail: lane.deals?.length ?? 0, selected: index === at, onSelect: jump }))),
    h(Animated.ScrollView, { ref: pager, horizontal: true, showsHorizontalScrollIndicator: false, decelerationRate: "fast", scrollEventThrottle: 16,
      // While a card is carried the finger does not scroll the lanes and they do not snap, so the edge scrolling can run freely.
      snapToInterval: lifted == null ? pitch : undefined, scrollEnabled: lifted == null,
      contentContainerStyle: { gap, alignItems: "flex-start", paddingBottom: theme.space["2xs"] } },
      // Cards fade in when they arrive in a lane, not when the board first appears.
      h(LayoutAnimationConfig, { skipEntering: true }, lanes.map((lane, index) => h(Lane, { key: lane.id, lane, index, width: laneWidth, lifted: lane.deals?.some((deal) => deal.id === lifted) ? lifted : null, hover, drag, onOpen: edit })))),
    h(Animated.View, { ...hiddenFromReaders, style: [{ position: "absolute", left: 0, top: 0, zIndex: 10, pointerEvents: "none" }, ghost] },
      liftedDeal ? h(View, { style: [cardStyle(theme, false), depth(theme.shadow.l), { borderColor: theme.colors.accent }] }, h(DealFace, { deal: liftedDeal })) : null),
    h(Sheet, { visible: !!openDeal, onClose: () => setOpen(null), title: sheetDeal?.company },
      sheetDeal ? h(Stack, { gap: "xs" },
        h(Text, { tone: "muted" }, [sheetDeal.value, sheetDeal.owner].filter(Boolean).join(" · ")),
        h(Text, { size: "xs", weight: "bold", tone: "muted", style: flat(caps, { marginTop: theme.space.xs }) }, "Move to stage"),
        h(Stack, { gap: "3xs" }, lanes.map((lane) => h(OptionRow, { key: lane.id, label: lane.title, value: lane.id, selected: lane.id === sheetLane?.id, onSelect: move }))),
        h(Button, { title: "Close", variant: "ghost", block: true, onPress: () => setOpen(null) })) : null));
}
