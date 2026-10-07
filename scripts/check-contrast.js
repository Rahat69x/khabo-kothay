import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tokensPath = path.join(rootDir, 'brand', 'tokens.json');

function hexToLuminance(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.startsWith('rgba') || cleanHex.startsWith('rgb')) {
    // Extract rgb numbers if formatted as rgba
    const match = cleanHex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10) / 255;
      const g = parseInt(match[2], 10) / 255;
      const b = parseInt(match[3], 10) / 255;
      const toLinear = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
  }
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex.substring(0, 6), 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const toLinear = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(color1, color2) {
  const l1 = hexToLuminance(color1);
  const l2 = hexToLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast() {
  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const { light, dark } = tokens;

  const lightMapBg = '#F2EFE9';
  const darkMapBg = dark.bg; // #11122B

  const testCases = [
    // 4.5:1 Targets - Light Theme
    { theme: 'light', name: 'ink on bg', fg: light.ink, bg: light.bg, minRatio: 4.5 },
    { theme: 'light', name: 'ink on surface', fg: light.ink, bg: light.surface, minRatio: 4.5 },
    { theme: 'light', name: 'muted on bg', fg: light.muted, bg: light.bg, minRatio: 4.5 },
    { theme: 'light', name: 'muted on surface', fg: light.muted, bg: light.surface, minRatio: 4.5 },
    { theme: 'light', name: 'onPrimary on primary', fg: light.onPrimary, bg: light.primary, minRatio: 4.5 },
    { theme: 'light', name: 'onAccent on accent', fg: light.onAccent, bg: light.accent, minRatio: 4.5 },
    { theme: 'light', name: 'primary text on bg', fg: light.primary, bg: light.bg, minRatio: 4.5 },
    { theme: 'light', name: 'primary text on primaryTint', fg: light.primary, bg: light.primaryTint, minRatio: 4.5 },
    { theme: 'light', name: 'accentStrong on surface', fg: light.accentStrong, bg: light.surface, minRatio: 4.5 },
    { theme: 'light', name: 'success on successTint', fg: light.success, bg: light.successTint, minRatio: 4.5 },
    { theme: 'light', name: 'warning on warningTint', fg: light.warning, bg: light.warningTint, minRatio: 4.5 },
    { theme: 'light', name: 'danger on dangerTint', fg: light.danger, bg: light.dangerTint, minRatio: 4.5 },

    // 4.5:1 Targets - Dark Theme
    { theme: 'dark', name: 'ink on bg', fg: dark.ink, bg: dark.bg, minRatio: 4.5 },
    { theme: 'dark', name: 'ink on surface', fg: dark.ink, bg: dark.surface, minRatio: 4.5 },
    { theme: 'dark', name: 'muted on bg', fg: dark.muted, bg: dark.bg, minRatio: 4.5 },
    { theme: 'dark', name: 'muted on surface', fg: dark.muted, bg: dark.surface, minRatio: 4.5 },
    { theme: 'dark', name: 'onPrimary on primary', fg: dark.onPrimary, bg: dark.primary, minRatio: 4.5 },
    { theme: 'dark', name: 'onAccent on accent', fg: dark.onAccent, bg: dark.accent, minRatio: 4.5 },
    { theme: 'dark', name: 'primary text on bg', fg: dark.primary, bg: dark.bg, minRatio: 4.5 },
    { theme: 'dark', name: 'primary text on primaryTint', fg: dark.primary, bg: dark.primaryTint, minRatio: 4.5 },
    { theme: 'dark', name: 'accentStrong on surface', fg: dark.accentStrong, bg: dark.surface, minRatio: 4.5 },
    { theme: 'dark', name: 'success on successTint', fg: dark.success, bg: dark.successTint, minRatio: 4.5 },
    { theme: 'dark', name: 'warning on warningTint', fg: dark.warning, bg: dark.warningTint, minRatio: 4.5 },
    { theme: 'dark', name: 'danger on dangerTint', fg: dark.danger, bg: dark.dangerTint, minRatio: 4.5 },

    // 3:1 Targets - Focus rings & Maps
    { theme: 'light', name: 'focusRing on bg', fg: light.focusRing, bg: light.bg, minRatio: 3.0 },
    { theme: 'dark', name: 'focusRing on bg', fg: dark.focusRing, bg: dark.bg, minRatio: 3.0 },
    { theme: 'light', name: 'pin primary on light map bg', fg: light.primary, bg: lightMapBg, minRatio: 3.0 },
    { theme: 'light', name: 'route primary on light map bg', fg: light.primary, bg: lightMapBg, minRatio: 3.0 },
    { theme: 'dark', name: 'pin primary on dark map bg', fg: dark.primary, bg: darkMapBg, minRatio: 3.0 },
    { theme: 'dark', name: 'pin saffron on dark map bg', fg: dark.accent, bg: darkMapBg, minRatio: 3.0 },
    { theme: 'dark', name: 'route primary on dark map bg', fg: dark.primary, bg: darkMapBg, minRatio: 3.0 },
    { theme: 'dark', name: 'alternative route muted on dark map bg', fg: dark.muted, bg: darkMapBg, minRatio: 3.0 }
  ];

  let failures = 0;
  console.log('--- WCAG Contrast Ratio Audit ---');
  for (const test of testCases) {
    const ratio = getContrastRatio(test.fg, test.bg);
    const pass = ratio >= test.minRatio;
    const status = pass ? 'PASS' : 'FAIL';
    const ratioFormatted = ratio.toFixed(2);
    console.log(
      `[${status}] [${test.theme.toUpperCase()}] ${test.name.padEnd(38)}: ${ratioFormatted}:1 (min ${test.minRatio}:1) | ${test.fg} on ${test.bg}`
    );
    if (!pass) {
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`\n❌ Error: ${failures} contrast checks failed WCAG requirements!`);
    process.exit(1);
  }

  console.log(`\n✅ All ${testCases.length} contrast checks PASSED successfully!`);
}

checkContrast();
