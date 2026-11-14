import test from 'node:test';
import assert from 'node:assert/strict';
import { oklch, oklchToRgb, mix } from '../packages/colibri-native-core/src/color.js';
import { createTheme, toneName } from '../packages/colibri-native-core/src/theme.js';

const luminance = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

test('oklch converts known colours to sRGB', () => {
  assert.equal(oklch(1, 0, 0), '#ffffff');
  assert.equal(oklch(0, 0, 0), '#000000');
  assert.deepEqual(oklchToRgb(0.62796, 0.25768, 29.234), [255, 0, 0]); // sRGB red
  assert.deepEqual(oklchToRgb(0.45201, 0.31321, 264.052), [0, 0, 255]); // sRGB blue
  assert.equal(oklch(0.5, 0.1, 255, 0.14).startsWith('rgba('), true);
});

test('colours outside sRGB are clipped to a valid value', () => {
  for (const hue of [0, 60, 120, 180, 240, 300]) for (const channel of oklchToRgb(0.7, 0.37, hue)) assert.ok(channel >= 0 && channel <= 255 && Number.isInteger(channel));
  const [, chroma] = mix([0.5, 0.2, 30], [1, 0, 0], 0.5);
  assert.ok(Math.abs(chroma - 0.1) < 1e-9);
});

test('a theme has the Colibri token names in both schemes', () => {
  const light = createTheme(), dark = createTheme({ scheme: 'dark' });
  for (const theme of [light, dark]) {
    for (const name of ['bg', 'surface', 'sunken', 'fg', 'muted', 'line', 'accent', 'brandFg', 'ok', 'warn', 'bad']) assert.match(theme.colors[name], /^#[0-9a-f]{6}$/, name);
    assert.deepEqual(Object.keys(theme.tones), ['accent', 'ok', 'warn', 'bad']);
    assert.deepEqual(Object.keys(theme.space), ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl']);
  }
  assert.equal(light.colors.surface, '#ffffff');
  assert.notEqual(light.colors.bg, dark.colors.bg);
  assert.equal(light.scheme, 'light'); assert.equal(dark.scheme, 'dark');
});

test('options are bounded and tone aliases resolve', () => {
  const theme = createTheme({ hue: 9999, chroma: -3, radius: 'nope', scheme: 'sepia' });
  assert.deepEqual([theme.hue, theme.chroma, theme.scheme, theme.radius.s], [360, 0, 'light', 6]);
  assert.equal(createTheme({ radius: 'round' }).radius.l, 24);
  assert.deepEqual(['success', 'warning', 'danger', 'destructive', 'ok', 'nope'].map(toneName), ['ok', 'warn', 'bad', 'bad', 'ok', null]);
});

test('text and buttons meet WCAG AA contrast for every hue, light and dark', () => {
  for (const scheme of ['light', 'dark']) for (let hue = 0; hue < 360; hue += 15) {
    const { colors } = createTheme({ hue, scheme }), where = `${scheme} hue ${hue}`;
    assert.ok(contrast(colors.fg, colors.bg) >= 7, `${where}: text ${contrast(colors.fg, colors.bg).toFixed(2)}`);
    assert.ok(contrast(colors.muted, colors.surface) >= 4.5, `${where}: muted ${contrast(colors.muted, colors.surface).toFixed(2)}`);
    assert.ok(contrast(colors.brandFg, colors.accent) >= 4.5, `${where}: button ${contrast(colors.brandFg, colors.accent).toFixed(2)}`);
    assert.ok(contrast(colors.accent, colors.surface) >= 4.5, `${where}: accent text ${contrast(colors.accent, colors.surface).toFixed(2)}`);
    for (const tone of ['ok', 'warn', 'bad']) assert.ok(contrast(colors[tone], colors.surface) >= 4.5, `${where}: ${tone}`);
  }
});
