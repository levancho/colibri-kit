// Builds site/dist/native/demo.js: the React Native showcase (examples/native/App.js, the catalog of every demo) compiled for browsers with
// react-native-web, so the components can be tried on the site without a phone.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// node tools/build-native-demo.mjs [outfile]   (default: site/dist/native/demo.js)
const outfile = path.resolve(process.argv[2] ?? path.join(root, "site/dist/native/demo.js"));
await build({
  stdin: { resolveDir: root, loader: "js", contents: `
    import { AppRegistry } from "react-native";
    import App from "./examples/native/App.js";
    AppRegistry.registerComponent("ColibriNative", () => App);
    AppRegistry.runApplication("ColibriNative", { rootTag: document.getElementById("app") });
    document.documentElement.dataset.nativeReady = "";` },
  outfile, bundle: true, minify: true, format: "iife", target: "es2022", legalComments: "none",
  loader: { ".js": "jsx" }, jsx: "automatic",
  alias: { "react-native": "react-native-web", "@colibri-kit/native": path.join(root, "packages/colibri-native/src/index.js") },
  define: { "process.env.NODE_ENV": '"production"', __DEV__: "false", global: "globalThis" },
});
console.log(`built ${path.relative(root, outfile)} (${Math.ceil(fs.statSync(outfile).size / 1024)} KiB)`);
