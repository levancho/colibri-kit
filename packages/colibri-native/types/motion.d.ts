// Types for src/motion.js: entrances, presence, press feedback, loops, one-shot animations, Collapse and ThemeScope.
import type { ComponentType, ReactNode, Ref } from "react";
import type { Animated, PressableProps, StyleProp, View, ViewProps, ViewStyle } from "react-native";
import type { RadiusName, Scheme } from "../index";

/** true while the device asks for reduced motion (AccessibilityInfo). Every helper here then skips to its end state. */
export function useReducedMotion(): boolean;

export type EnterMotion = "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "zoom" | "pop" | "flip";
export const ENTER_MOTIONS: EnterMotion[];
type AnimatedViewStyle = Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
interface MotionViewProps extends Omit<ViewProps, "style"> { style?: AnimatedViewStyle }

export interface EnterProps extends MotionViewProps {
  motion?: EnterMotion;
  /** Milliseconds before it starts; index × stagger (40) is added, so a list can cascade. */
  delay?: number; index?: number; stagger?: number;
  duration?: number;
  /** How far the slide presets travel, in points (12). */
  distance?: number;
  onEnd?: () => void;
}
/** Plays an entrance once, on mount. Change its key to replay. */
export const Enter: ComponentType<EnterProps>;

export interface PresenceProps extends MotionViewProps {
  visible?: boolean; motion?: EnterMotion;
  duration?: number; exitDuration?: number; distance?: number;
  /** Also animate the first render. */
  appear?: boolean;
  /** Keep the children mounted (hidden) after the exit instead of unmounting them. */
  keepMounted?: boolean;
  onExited?: () => void;
}
/** Animates children in and out as visible changes; they stay mounted until the exit has finished. */
export const Presence: ComponentType<PresenceProps>;

export type PressEffect = "shrink" | "grow" | "lift" | "tilt" | "dim";
export const PRESS_EFFECTS: PressEffect[];
export interface MotionPressableProps extends Omit<PressableProps, "style" | "children"> {
  effect?: PressEffect;
  /** The scale (shrink, grow), distance in points (lift), angle in degrees (tilt) or opacity (dim). */
  amount?: number;
  /** A plain style: not a function of the pressed state. */
  style?: AnimatedViewStyle;
  children?: ReactNode; ref?: Ref<View>;
}
/** A Pressable that answers a touch (and a mouse hover) with a spring. */
export const MotionPressable: ComponentType<MotionPressableProps>;

export type LoopMotion = "spin" | "pulse" | "bounce" | "ping" | "float";
export const LOOP_MOTIONS: LoopMotion[];
export interface MotionLoopProps extends MotionViewProps { motion?: LoopMotion; /** One cycle, in milliseconds. */ duration?: number; paused?: boolean }
export const MotionLoop: ComponentType<MotionLoopProps>;

export type PlayMotion = "shake" | "bounce" | "pulse" | "pop" | "flash" | "heartbeat" | "tada" | "wiggle";
export const PLAY_MOTIONS: PlayMotion[];
export interface MotionHandle {
  /** Put this on an Animated.View. */
  style: Animated.WithAnimatedObject<ViewStyle>;
  /** Restarts the animation; resolves true when it ran to the end, false when it was interrupted. */
  play(name: PlayMotion, options?: { duration?: number }): Promise<boolean>;
  /** Stops and returns to rest. */
  stop(): void;
}
/** One-shot attention animations played from code. */
export function useMotion(): MotionHandle;

export interface CollapseProps extends MotionViewProps { open?: boolean; duration?: number; onEnd?: (open: boolean) => void }
/** Opens and closes its children by animating height. */
export const Collapse: ComponentType<CollapseProps>;

export interface ThemeScopeProps extends ViewProps {
  /** Each one defaults to the value of the theme around the scope. */
  hue?: number; chroma?: number; radius?: RadiusName; scheme?: Scheme;
  /** Paint the scope's own background in a bordered box; padded (default true) and style apply to that box. */
  surface?: boolean; padded?: boolean;
}
/** Re-themes everything inside it, starting from the theme around it. */
export const ThemeScope: ComponentType<ThemeScopeProps>;
