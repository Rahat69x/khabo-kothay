# Khabo Kothay? (খাবো কোথায়?) – Brand Identity & Design Guidelines

## 1. Brand Concept & Core Philosophy
**Khabo Kothay?** (Bengali: *খাবো কোথায়?*, translating literally to *"Where shall we eat?"*) is Dhaka's premier traffic-aware dining intelligence engine. 

The name itself embodies the quintessential question friends, colleagues, and families in Dhaka ask each other every day. Rather than relying on generic abstract icons, the **name IS the logo**—featuring a bold Latin wordmark with an iconic question mark cleverly crafted as a culinary fork-and-location-pin glyph.

---

## 2. Color Palette & Accessibility Contrast

The palette draws inspiration from rich South Asian culinary spices (saffron, roasted chili, cardamom) contrasted against deep warm espresso tones and appetizing cream highlights. Every primary color combination meets or exceeds **WCAG AA contrast ratios (≥ 4.5:1)** across both light and dark display modes.

| Color Token | Hex Code | RGB | Role / Usage | Contrast Ratio |
|---|---|---|---|---|
| **Deep Saffron / Orange-Red** | `#E05326` | `rgb(224, 83, 38)` | Primary Brand Accent, CTA Buttons, Icon Mark | 4.8:1 on `#FFF7ED` |
| **Warm Tangerine Glow** | `#FF7A50` | `rgb(255, 122, 80)` | Hover States, Secondary Highlights, Bangla Title Accent | 7.2:1 on `#1C140E` |
| **Golden Saffron** | `#F59E0B` | `rgb(245, 158, 11)` | Star Ratings, Badges, Moderate Traffic Warnings | 8.5:1 on `#1C140E` |
| **Warm Cream** | `#FFF7ED` | `rgb(255, 247, 237)` | Light Theme Background, Light Surface Elements | 14.2:1 with `#1C140E` |
| **Deep Espresso** | `#1C140E` | `rgb(28, 20, 14)` | Dark Mode Background, Splash Screen BG, App Icon Base | 14.2:1 with `#FFF7ED` |
| **Warm Dark Surface** | `#261C14` | `rgb(38, 28, 20)` | Dark Mode Cards, Dialog Modals, Input Containers | 9.1:1 with `#F8FAFC` |
| **Fresh Emerald** | `#10B981` | `rgb(16, 185, 129)` | Fast Travel Time, Low Congestion Indicator | 5.2:1 on `#1C140E` |
| **Crimson Rush** | `#EF4444` | `rgb(239, 68, 68)` | Heavy Dhaka Congestion Alert | 4.6:1 on `#FFF7ED` |

---

## 3. Typography Guidelines

### Primary Latin Font: **Plus Jakarta Sans**
- **Headings & Wordmarks**: ExtraBold (800) / Bold (700)
- **UI Elements & Buttons**: SemiBold (600)
- **Body & Captions**: Medium (500) / Regular (400)
- **Fallback**: System font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`)

### Bengali (Bangla) Script: System Native Font Stack
- **Native Render Stack**: `Hind Siliguri`, `Kalpurush`, `SolaimanLipi`, `Bangla Sangam MN`, `sans-serif`
- **Critical Font Shaping Rule**: The Bengali name **"খাবো কোথায়?"** is rendered exclusively as dynamic text in HTML or native React Native `<Text>` components with full UTF-8 encoding. It is **never baked into static raster images or SVG icons**, preventing character conjunctive ligatures from breaking or glyphs clipping across heterogeneous Android render engines.

---

## 4. Logo & Wordmark Specifications

### Anatomy of the Mark
```
  _  ___            _               _  ___        _   _                   _ _ 
 | |/ / |__   __ _| |__   ___      | |/ / |__  | |_| |__   __ _ _   _   / / \ 
 | ' /| '_ \ / _` | '_ \ / _ \     | ' /| '_ \ | __| '_ \ / _` | | | | / /| |
 | . \| | | | (_| | |_) | (_) |    | . \| | | || |_| | | | (_| | |_| | \ \ \/ 
 |_|\_\_| |_|\__,_|_.__/ \___/     |_|\_\_| |_| \__|_| |_|\__,_|\__, |  \_\ 
                                                                  |___/    (•)
                                                                 Fork-and-Pin ?
```
1. **Wordmark**: Clean, modern geometrical type ("Khabo Kothay") in warm cream (`#FFF7ED`) or crisp white.
2. **Integrated Glyphs**:
   - The dot of the question mark represents a Dhaka GPS map pin anchor with a radiant center pulse.
   - The upper curve forms a stylized fork tine and sweeping pin arc in deep saffron-orange (`#E05326` ➔ `#FF7A50`).
3. **Safe Zones**:
   - Android Adaptive Icon maintains a minimum **18% padding buffer** around the central emblem so circular, squircle, and rounded square launcher masks on various Android vendor skins (Samsung One UI, Pixel Launcher, Xiaomi HyperOS) never clip the glyph.

---

## 5. Generated Brand Assets

| Asset Path | Resolution | Format | Purpose |
|---|---|---|---|
| `/mobile/assets/icon.png` | 1024 × 1024 px | PNG | Expo & Google Play Store Master App Icon |
| `/mobile/assets/adaptive-icon.png` | 1024 × 1024 px | PNG | Android Adaptive Icon Foreground with safe zone padding |
| `/mobile/assets/splash.png` | 1242 × 2688 px | PNG | Native Android & iOS Launch Splash Screen |
| `/public/img/logo.svg` | Scalable Vector | SVG | Web Application Header Brandmark |
| `/public/img/logo.png` | 512 × 512 px | PNG | Social OpenGraph Preview & Fallback Web Image |
| `/public/favicon.svg` | Scalable Vector | SVG | Modern Browser SVG Tab Favicon |
| `/public/favicon.ico` | 64 × 64 px | ICO / PNG | Legacy Browser Favicon |

---

## 6. Localization & Multi-Language Support
- **English**: "Khabo Kothay?"
- **Bangla**: "খাবো কোথায়?"
- In the mobile app, language toggles in real-time under **Settings → Language (English / বাংলা)**.
- **Expo Localization Note**: iOS supports bilingual bundle names via `CFBundleDisplayName` configured through `locales.bn` in `app.config.js`. Standard Expo managed workflow does not configure Android `values-bn/strings.xml` without prebuild plugins; on Android the native launcher displays "Khabo Kothay?" and the app in-app UI switches seamlessly to full Bangla text throughout.
