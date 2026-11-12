# Colibri for React Native: example app

`App.js` shows every component in `@colibri-kit/native`. The same file runs on https://colibri-kit.io/native/ through react-native-web.

## Run it on a phone

The simplest route is a fresh Expo project, so the Expo, React and React Native versions match each other:

```sh
npx create-expo-app@latest colibri-demo --template blank
cd colibri-demo
npm install @colibri-kit/native
cp ../colibri-kit/examples/native/App.js App.js
npx expo start
```

Scan the QR code with Expo Go. Before `@colibri-kit/native` is on npm, install it from a checkout instead: run `npm pack` in `packages/colibri-native` and `npm install` the resulting `.tgz`.

`package.json` and `app.json` in this folder describe the same app for people who prefer to start here; run `npx expo install --fix` after `npm install` to pin matching versions.
