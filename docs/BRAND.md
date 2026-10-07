# Brand & Design System: "Khabo Kothay?" (খাবো কোথায়?)

Welcome to the brand identity guide and design token specification for **Khabo Kothay?** (খাবো কোথায়?). This document serves as the canonical reference for typography, colors, logos, digital assets, and user interface styling across the Web App (`/public`) and the Android Mobile App (`/mobile`).

---

## 1. Brand Concept: Indigo & Saffron

The brand palette is inspired by the vibrant contrast of modern Dhaka — trustworthy, energetic, and culturally grounded:
- **Indigo** is the primary anchor and interactive color: buttons, links, selected tabs, navigation lines, and restaurant map pins.
- **Saffron** is an intentional highlight color: the signature "Best overall" badge, the selected map pin on active interaction, the punctuation mark `?` in the logo wordmark, and subtle visual emphasis.

---

## 2. Palette & Design Tokens

Design tokens are defined in `/brand/tokens.json` as the **single source of truth**. All web CSS variables (`/public/css/theme.css`) and mobile theme objects (`/mobile/src/config/theme.generated.js`) are derived automatically.

### Light Mode Palette

| Token Name | Hex / Value | Description & Purpose | WCAG Contrast |
|---|---|---|---|
| `primary` | `#3B3FA8` | Deep Indigo for interactive elements, CTA buttons, links | 8.53:1 (on white) |
| `primaryHover` | `#32368F` | Darker indigo hover state | — |
| `primaryPressed` | `#2A2D78` | Active pressed button state | — |
| `onPrimary` | `#FFFFFF` | Text/icons displayed on primary surfaces | 8.53:1 (PASS) |
| `primaryTint` | `#E6E7F7` | Soft indigo wash for badge tracks and chip backgrounds | 6.96:1 with primary |
| `accent` | `#FFB020` | Vibrant Saffron highlight | 7.65:1 with onAccent |
| `accentHover` | `#F5A60F` | Saffron hover | — |
| `accentPressed` | `#E09600` | Saffron pressed | — |
| `onAccent` | `#3D2800` | Deep warm brown text on saffron surfaces | 7.65:1 (PASS) |
| `accentStrong` | `#8A5200` | High-contrast saffron for text & thin icons on light surfaces | 6.39:1 (PASS) |
| `bg` | `#F6F6FB` | Page viewport background (never pure white `#FFF`) | — |
| `surface` | `#FFFFFF` | Card, sheet, and panel surface background | 17.13:1 with ink |
| `surfaceAlt` | `#EEEFF8` | Secondary container and input field fill | — |
| `ink` | `#16183A` | Deep indigo-black for headings and body typography | 15.90:1 on bg |
| `muted` | `#5E6088` | Secondary labels, timestamps, alternative routes | 5.56:1 on bg (PASS) |
| `line` | `rgba(22,24,58,0.12)` | Subtle hairline borders and card outlines | — |
| `focusRing` | `#3B3FA8` | Keyboard and input accessibility focus outline | 7.92:1 on bg |
| `scrim` | `rgba(17,18,43,0.5)` | Modal backdrop dimming | — |
| `skeleton` | `#E8E9F4` | Shimmer loader skeleton fill | — |
| `success` | `#197847` | Positive state (Low traffic, verified) | 4.82:1 on tint (PASS)* |
| `successTint` | `#E3F4EA` | Soft green background for success status chips | — |
| `warning` | `#8A5200` | Alert state (Moderate traffic, price notices) | 5.72:1 on tint (PASS) |
| `warningTint` | `#FFF1D6` | Soft amber background for warning status chips | — |
| `danger` | `#BE382A` | Critical state (Heavy traffic, errors) | 4.57:1 on tint (PASS)* |
| `dangerTint` | `#FCE4E1` | Soft coral background for danger status chips | — |

> **Token Adjustments for WCAG Compliance**:
> - `light.success`: Minimally adjusted from `#1B7F4B` to `#197847` (4.39:1 $\to$ 4.82:1) to satisfy the strict 4.5:1 AA contrast ratio against `#E3F4EA`.
> - `light.danger`: Minimally adjusted from `#C0392B` to `#BE382A` (4.48:1 $\to$ 4.57:1) to satisfy the strict 4.5:1 AA contrast ratio against `#FCE4E1`.

---

### Dark Mode Palette

| Token Name | Hex / Value | Description & Purpose | WCAG Contrast |
|---|---|---|---|
| `primary` | `#8B90F0` | Bright periwinkle indigo for buttons and active states | 6.38:1 with onPrimary |
| `primaryHover` | `#A0A4F5` | Dark mode primary hover state | — |
| `primaryPressed` | `#7A7FE6` | Dark mode primary active pressed state | — |
| `onPrimary` | `#0F1038` | Deep midnight ink text on bright primary surfaces | 6.38:1 (PASS) |
| `primaryTint` | `#25285A` | Deep indigo container fill for tracks and badge fills | 4.80:1 with primary |
| `accent` | `#FFB020` | Consistent Saffron highlight | 7.65:1 with onAccent |
| `accentHover` | `#FFC04D` | Dark mode saffron hover | — |
| `accentPressed` | `#F0A010` | Dark mode saffron pressed | — |
| `onAccent` | `#3D2800` | Deep warm brown text on saffron surfaces | 7.65:1 (PASS) |
| `accentStrong` | `#FFB020` | Luminous saffron for high-contrast dark text and icons | 8.78:1 on surface |
| `bg` | `#11122B` | Viewport background (never pure black `#000`) | — |
| `surface` | `#1B1D45` | Elevated card and modal background | 13.72:1 with ink |
| `surfaceAlt` | `#232650` | Input fill and tertiary surfaces | — |
| `ink` | `#ECECFA` | Near-white typography for dark surfaces | 15.67:1 on bg |
| `muted` | `#A3A6D6` | Secondary typography, metadata, and alternative routes | 6.87:1 on surface |
| `line` | `rgba(236,236,250,0.14)`| Subtle container border outlines | — |
| `focusRing` | `#B6B9FF` | Glowing focus ring outline | 9.93:1 on bg |
| `scrim` | `rgba(0,0,0,0.6)` | Dimming overlay behind modals and sheets | — |
| `skeleton` | `#232650` | Loading skeleton shimmer track | — |
| `success` | `#5FD08D` | Vibrant emerald green for Low traffic chips | 6.78:1 on tint |
| `successTint` | `#12372A` | Deep dark emerald background | — |
| `warning` | `#FFCB6B` | Warm golden amber for Moderate traffic chips | 8.96:1 on tint |
| `warningTint` | `#3A2D10` | Deep dark amber background | — |
| `danger` | `#FF8A80` | Soft coral red for Heavy traffic chips | 6.68:1 on tint |
| `dangerTint` | `#3F1A1D` | Deep dark wine background | — |

---

## 3. Usage Rules (Do & Don't)

### Interactive Elements & Hierarchy
- **DO** use Indigo (`primary`) as the primary interactive color for buttons, navigation tabs, active filters, route lines, and standard restaurant map pins.
- **DO** use Saffron (`accent`) strictly as a highlight: the "Best overall" badge, the selected map pin on user tap, the `?` in the logo, and small emphasis stars.
- **DON'T** use Saffron as general body copy or as thin hairline icons on light surfaces. If saffron text is required on light backgrounds, always use `accentStrong` (`#8A5200`).
- **DON'T** use pure `#000000` or `#FFFFFF` page backgrounds. Always use `bg` (`#F6F6FB` / `#11122B`) and `surface` (`#FFFFFF` / `#1B1D45`).

### Traffic Chips & Status Cues
- **DO** pair color with a distinct icon AND a text label on every traffic chip:
  - Low: `🟢` icon + `Low Traffic` label (`success` on `successTint`)
  - Moderate: `🟡` icon + `Moderate Traffic` label (`warning` on `warningTint`)
  - Heavy: `🔴` icon + `Heavy Traffic` label (`danger` on `dangerTint`)
- **DON'T** rely on color alone as the sole indicator. Color blindness accessibility requires dual-channel feedback.
- **DON'T** use Saffron for traffic status under any circumstances.

### Badges & Pill Cues
- **Best overall**: Solid Saffron fill (`accent`) with `onAccent` text (`#3D2800`).
- **Fastest to reach / Best for price**: `primaryTint` background with `primary` text.
- **Try something new**: Outlined badge (`transparent` background) with `accentStrong` border and text.
- **Community-verified**: `successTint` background with `success` text.

### Explain-This-Recommendation Bars
- **DO** render recommendation factor breakdown bars using `primary` fill on a `primaryTint` track in both web and mobile.
- **DON'T** use rainbow, random, or arbitrary colors for factor scores.

### Maps & Routing
- **User Location**: Primary dot with a clean white ring border.
- **Restaurant Pins**: Primary fill with `onPrimary` rank number.
- **Selected Pin**: Saffron fill (`#FFB020`) with `onAccent` text and white outline.
- **Route Polyline**: Recommended route is a thick `primary` line; alternate paths are thin and `muted`.
- **Map Themes**: Light mode uses standard clean vector tiles; Dark mode automatically loads `/brand/map-style-dark.json` (dark roads, labels, and water tuned to match dark tokens).

---

## 4. Typography

Typography is self-hosted locally on the web and bundled within the mobile app. No external network requests (such as Google Fonts CDN) are made.

1. **Headings & Display**: **Plus Jakarta Sans** (SemiBold 600, Bold 700). Friendly, modern geometric sans-serif.
2. **Body Copy & UI Elements**: **Inter** (Regular 400, Medium 500, SemiBold 600). Neutral, highly legible screen typeface.
3. **Bangla Text (বাংলা)**: **Noto Sans Bengali** (Regular 400, Bold 700). Applied automatically to any Bangla characters (`খাবো কোথায়?`).

> **Rule for Bangla**: Bangla appears only as normal, selectable UI text (`<span class="bn-title">`), never baked into static images or logos.

---

## 5. Logo Identity (The Name is the Logo)

Master vector SVG files are stored in `/brand/logo/`. All letterforms have been converted into vector path outlines so the logo never depends on local font availability.

- **Wordmark**: `"Khabo Kothay?"` set in Plus Jakarta Sans Bold.
  - The text `"Khabo Kothay"` is Indigo (`#3B3FA8`) on light backgrounds and near-white (`#ECECFA`) on dark backgrounds.
  - The question mark `"?"` is always Saffron (`#FFB020`), with its base dot drawn as a custom map-pin drop vector.
- **Variants Provided**:
  - `wordmark-light.svg`: Indigo text + Saffron `?` for light surfaces.
  - `wordmark-dark.svg`: Off-white text (`#ECECFA`) + Saffron `?` for dark surfaces.
  - `wordmark-on-indigo.svg`: Pure white text (`#FFFFFF`) + Saffron `?` for solid indigo backgrounds and splash screens.
- **App Icon**:
  - Indigo (`#3B3FA8`) squircle/rounded-square canvas featuring a bold white `?` whose dot is a saffron map-pin drop.
  - Simple, balanced, and legible down to 48px.
  - Android 13+ Themed Icons supported via `adaptive-monochrome.svg` and `adaptive-icon-monochrome.png`.

### Logo Rules
1. **Clear Space**: Always maintain clear space around the wordmark equal to or greater than the height of the letter `"K"`.
2. **Minimum Size**:
   - Wordmark minimum height: `24px` on digital screens, `8mm` in print.
   - App Icon minimum size: `48px` x `48px`.
3. **No Stretching or Distortion**: The aspect ratio must remain strictly locked.
4. **No Arbitrary Recoloring**: Never change the text or saffron question mark to unapproved colors.
5. **Background Contrast**: Use `wordmark-light.svg` on light backgrounds, `wordmark-dark.svg` on dark backgrounds, and `wordmark-on-indigo.svg` on indigo surfaces.

---

## 6. How to Regenerate Theme & Brand Assets

All theme files and binary visual assets are generated programmatically from the single source of truth (`/brand/tokens.json`). **Never hand-edit generated files.**

### 1. Regenerate CSS & Mobile Theme Tokens
```bash
node scripts/build-theme.js
```
*Outputs:*
- `/public/css/theme.css` (CSS custom properties, light/dark media queries, data-theme overrides, self-hosted `@font-face` rules)
- `/mobile/src/config/theme.generated.js` (TypeScript/JavaScript light and dark token objects)

### 2. Regenerate All Vector & Raster Brand Assets
```bash
node scripts/build-brand-assets.js
```
*Outputs:*
- Mobile Icons & Splashes: `mobile/assets/icon.png`, `adaptive-icon.png`, `adaptive-icon-background.png`, `adaptive-icon-monochrome.png`, `notification-icon.png`, `splash.png`, `splash-dark.png`.
- Web Favicons & Logos: `public/favicon.svg`, `public/favicon.ico`, `favicon-32.png`, `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png`, `public/img/logo.svg`, `public/img/logo-dark.svg`, `public/img/social-card.png`.
- Google Play Store: `docs/play-store-assets/icon-512.png`, `feature-graphic-1024x500.png`.

### 3. Run Quality & Contrast Checks
```bash
node scripts/check-contrast.js      # Verifies 32 WCAG AA color pairs
node scripts/check-no-raw-colors.js  # Ensures zero raw hex colors in app code
npm test                            # Runs full test suite (backend + mobile + theme)
```
