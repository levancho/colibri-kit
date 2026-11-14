// Optional entry: @colibri-kit/native/gestures. Finger-driven versions of the core components, built on
// react-native-reanimated and react-native-gesture-handler. A component here has the same name and props as the
// core one, so switching is a change of import path:
//
//   import { BottomSheet, SwipeRow, Sortable } from "@colibri-kit/native/gestures";
//
// WHAT THE APP MUST PROVIDE
//  - react-native-gesture-handler 3 (the hook API: usePanGesture and friends), react-native-reanimated 4 and
//    react-native-worklets, installed and set up as their own guides say, including the worklets Babel plugin.
//  - GestureHandlerRootView at the root of the app, once:
//
//      import { GestureHandlerRootView } from "react-native-gesture-handler";
//      export default function App() { return <GestureHandlerRootView style={{ flex: 1 }}>…</GestureHandlerRootView>; }
//
//    Without it no gesture here is recognised (and Gesture Handler throws in development). The sheets and the
//    drawer open in a Modal and add the root view that a Modal needs themselves.
//
// The rules the files in this folder follow are at the top of shared.js.
export { BottomSheet, Sheet, Drawer } from "./sheets.js";
export { SwipeRow, SwipeGroup } from "./swipe.js";
export { Sortable } from "./sortable.js";
export { Slider } from "./slider.js";
export { Carousel } from "./carousel.js";
export { AnimatedList, PressableScale } from "./motion.js";
