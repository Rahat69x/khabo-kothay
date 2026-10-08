import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tokensPath = path.join(rootDir, 'brand', 'tokens.json');
const themeCssPath = path.join(rootDir, 'public', 'css', 'theme.css');
const themeGeneratedJsPath = path.join(rootDir, 'mobile', 'src', 'config', 'theme.generated.js');

function buildTheme() {
  if (!fs.existsSync(tokensPath)) {
    throw new Error(`tokens.json not found at ${tokensPath}`);
  }

  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const light = tokens.light;
  const dark = tokens.dark;

  // Generate public/css/theme.css
  const generateCssVars = (t) => `
  --color-primary: ${t.primary};
  --color-primary-hover: ${t.primaryHover};
  --color-primary-pressed: ${t.primaryPressed};
  --color-on-primary: ${t.onPrimary};
  --color-primary-tint: ${t.primaryTint};

  --color-accent: ${t.accent};
  --color-accent-hover: ${t.accentHover};
  --color-accent-pressed: ${t.accentPressed};
  --color-on-accent: ${t.onAccent};
  --color-accent-strong: ${t.accentStrong};

  --color-bg: ${t.bg};
  --color-surface: ${t.surface};
  --color-surface-alt: ${t.surfaceAlt};
  --color-ink: ${t.ink};
  --color-muted: ${t.muted};
  --color-line: ${t.line};

  --color-focus-ring: ${t.focusRing};
  --color-scrim: ${t.scrim};
  --color-skeleton: ${t.skeleton};

  --color-success: ${t.success};
  --color-success-tint: ${t.successTint};
  --color-warning: ${t.warning};
  --color-warning-tint: ${t.warningTint};
  --color-danger: ${t.danger};
  --color-danger-tint: ${t.dangerTint};

  /* Semantic UI Aliases */
  --bg-primary: var(--color-bg);
  --bg-secondary: var(--color-surface-alt);
  --bg-surface: var(--color-surface);
  --text-main: var(--color-ink);
  --text-muted: var(--color-muted);
  --text-subtle: var(--color-muted);
  --line-color: var(--color-line);
  --border-color: var(--color-line);

  --primary: var(--color-primary);
  --primary-hover: var(--color-primary-hover);
  --primary-pressed: var(--color-primary-pressed);
  --primary-tint: var(--color-primary-tint);
  --on-primary: var(--color-on-primary);

  --accent: var(--color-accent);
  --accent-hover: var(--color-accent-hover);
  --accent-pressed: var(--color-accent-pressed);
  --accent-strong: var(--color-accent-strong);
  --on-accent: var(--color-on-accent);

  --focus-ring: var(--color-focus-ring);
  --skeleton-color: var(--color-skeleton);
  --scrim-color: var(--color-scrim);

  --traffic-low: var(--color-success);
  --traffic-low-tint: var(--color-success-tint);
  --traffic-mod: var(--color-warning);
  --traffic-mod-tint: var(--color-warning-tint);
  --traffic-heavy: var(--color-danger);
  --traffic-heavy-tint: var(--color-danger-tint);

  --badge-best-bg: var(--color-accent);
  --badge-best-text: var(--color-on-accent);
  --badge-fast-bg: var(--color-primary-tint);
  --badge-fast-text: var(--color-primary);
  --badge-price-bg: var(--color-primary-tint);
  --badge-price-text: var(--color-primary);
  --badge-new-border: var(--color-accent-strong);
  --badge-new-text: var(--color-accent-strong);
  --badge-verified-bg: var(--color-success-tint);
  --badge-verified-text: var(--color-success);
`;

  const cssContent = `/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
 * Generated from brand/tokens.json by scripts/build-theme.js
 */

/* Self-Hosted Brand Fonts (Zero external Google Font requests) */
@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/PlusJakartaSans-Bold.ttf') format('truetype');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/Inter-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/Inter-SemiBold.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans Bengali';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSansBengali-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'Noto Sans Bengali';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/NotoSansBengali-Bold.ttf') format('truetype');
}

:root {
  --font-heading: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-bangla: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;

  color-scheme: light;
${generateCssVars(light)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${generateCssVars(dark)}
  }
}

[data-theme="dark"] {
  color-scheme: dark;
${generateCssVars(dark)}
}

[data-theme="light"] {
  color-scheme: light;
${generateCssVars(light)}
}

/* Typography Hierarchy & Language Auto-Selection */
body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-ink);
}

h1, h2, h3, h4, h5, h6, .brand-title, .modal-title {
  font-family: var(--font-heading);
}

:lang(bn), .bn, .bn-title, [data-lang="bn"] {
  font-family: var(--font-bangla);
}

h1:lang(bn), h2:lang(bn), h3:lang(bn), .brand-title:lang(bn) {
  font-family: var(--font-bangla);
}
`;

  fs.mkdirSync(path.dirname(themeCssPath), { recursive: true });
  fs.writeFileSync(themeCssPath, cssContent.trim() + '\n', 'utf8');
  console.log(`✓ Generated ${path.relative(rootDir, themeCssPath)}`);

  // Generate mobile/src/config/theme.generated.js
  const makeMobileThemeObj = (isDark, t) => {
    return {
      isDark,
      tokens: { ...t },
      colors: {
        primary: t.primary,
        primaryHover: t.primaryHover,
        primaryPressed: t.primaryPressed,
        onPrimary: t.onPrimary,
        primaryTint: t.primaryTint,
        primaryGlow: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.2)',

        accent: t.accent,
        accentHover: t.accentHover,
        accentPressed: t.accentPressed,
        onAccent: t.onAccent,
        accentStrong: t.accentStrong,
        secondary: t.accent,
        pressed: t.primaryPressed,
        tint: t.primaryTint,

        background: t.bg,
        bg: t.bg,
        card: t.surface,
        surface: t.surface,
        surfaceAlt: t.surfaceAlt,
        text: t.ink,
        ink: t.ink,
        textMuted: t.muted,
        mutedText: t.muted,
        textSubtle: t.muted,
        muted: t.muted,
        border: t.line,
        line: t.line,

        focusRing: t.focusRing,
        scrim: t.scrim,
        skeleton: t.skeleton,

        success: t.success,
        successTint: t.successTint,
        warning: t.warning,
        warningTint: t.warningTint,
        danger: t.danger,
        dangerTint: t.dangerTint,

        trafficLow: t.success,
        trafficLowTint: t.successTint,
        trafficModerate: t.warning,
        trafficModerateTint: t.warningTint,
        trafficHeavy: t.danger,
        trafficHeavyTint: t.dangerTint,

        badgeBest: t.accent,
        badgeBestText: t.onAccent,
        badgeFast: t.primaryTint,
        badgeFastText: t.primary,
        badgePrice: t.primaryTint,
        badgePriceText: t.primary,
        badgeNewBorder: t.accentStrong,
        badgeNewText: t.accentStrong,
        badgeVerified: t.successTint,
        badgeVerifiedText: t.success
      },
      fonts: {
        regular: { fontFamily: 'Inter-Regular', fontWeight: 'normal' },
        medium: { fontFamily: 'Inter-SemiBold', fontWeight: '500' },
        bold: { fontFamily: 'PlusJakartaSans-Bold', fontWeight: 'bold' },
        heavy: { fontFamily: 'PlusJakartaSans-Bold', fontWeight: '800' },
        heading: 'PlusJakartaSans-Bold',
        body: 'Inter-Regular',
        bodySemiBold: 'Inter-SemiBold',
        bangla: 'NotoSansBengali-Regular',
        banglaBold: 'NotoSansBengali-Bold'
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
      },
      radius: {
        sm: 8,
        md: 14,
        lg: 20,
        full: 9999
      },
      minTouchTarget: 48
    };
  };

  const lightObj = makeMobileThemeObj(false, light);
  const darkObj = makeMobileThemeObj(true, dark);

  const jsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Generated from brand/tokens.json by scripts/build-theme.js

export const lightTheme = ${JSON.stringify(lightObj, null, 2)};

export const darkTheme = ${JSON.stringify(darkObj, null, 2)};

export const tokens = ${JSON.stringify(tokens, null, 2)};

export default {
  light: lightTheme,
  dark: darkTheme,
  tokens
};
`;

  fs.mkdirSync(path.dirname(themeGeneratedJsPath), { recursive: true });
  fs.writeFileSync(themeGeneratedJsPath, jsContent.trim() + '\n', 'utf8');
  console.log(`✓ Generated ${path.relative(rootDir, themeGeneratedJsPath)}`);
}

buildTheme();
