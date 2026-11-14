// What the browser demo bundle resolves "react-native" to: react-native-web, plus the few names that optional
// libraries import from React Native but react-native-web does not export. Used only by tools/build-native-demo.mjs.
export * from "react-native-web";
export const TurboModuleRegistry = { get: () => null, getEnforcing: () => null };
