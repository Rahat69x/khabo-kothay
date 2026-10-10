import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import opentype from 'opentype.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const brandDir = path.join(rootDir, 'brand');
const logoDir = path.join(brandDir, 'logo');
const tokensPath = path.join(brandDir, 'tokens.json');
const mobileAssetsDir = path.join(rootDir, 'mobile', 'assets');
const publicDir = path.join(rootDir, 'public');
const publicImgDir = path.join(publicDir, 'img');
const docsPlayStoreDir = path.join(rootDir, 'docs', 'play-store-assets');

[logoDir, mobileAssetsDir, publicImgDir, docsPlayStoreDir].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const BRAND_ORANGE = '#FF8C00';
const BRAND_BLACK = '#111111';
const BRAND_WHITE = '#FFFFFF';

// 1. Generate outlined vector paths using Plus Jakarta Sans Bold
const fontBuffer = fs.readFileSync(path.join(rootDir, 'public', 'fonts', 'PlusJakartaSans-Bold.ttf'));
const font = opentype.parse(fontBuffer.buffer);

/**
 * Builds the precision K-Pin Symbol vector path elements
 * Coordinate system: 512x512 canvas
 */
function createSymbolPaths(pinColor = BRAND_ORANGE, kColor = BRAND_WHITE) {
  // Pin: outer teardrop + inner circular cutout (evenodd)
  const pinPath = `M 163 198
    C 134 165 122 147 122 128
    C 122 105 140 88 163 88
    C 186 88 204 105 204 128
    C 204 147 192 165 163 198 Z
    M 163 114
    A 14 14 0 1 0 163 142
    A 14 14 0 1 0 163 114 Z`;

  // Stylized K polygon
  const kPath = `M 135 204
    L 191 204
    L 191 246
    L 366 110
    L 366 186
    L 224 282
    L 372 386
    L 304 386
    L 191 316
    L 135 386
    Z`;

  return { pinPath, kPath };
}

/**
 * App Icon SVG (512x512)
 */
function createAppIconSvg(size = 512, isMonochrome = false, transparent = false) {
  const cornerRadius = size * 0.22;
  const bgFill = transparent ? 'none' : BRAND_BLACK;
  const kColor = isMonochrome ? BRAND_WHITE : BRAND_WHITE;
  const pinColor = isMonochrome ? BRAND_WHITE : BRAND_ORANGE;

  const { pinPath, kPath } = createSymbolPaths(pinColor, kColor);
  const scale = size / 512;

  const bgRect = transparent ? '' : `<rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${bgFill}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bgRect}
  <g transform="scale(${scale})">
    <path d="${pinPath}" fill="${pinColor}" fill-rule="evenodd"/>
    <path d="${kPath}" fill="${kColor}"/>
  </g>
</svg>`;
}

/**
 * Android Adaptive Icon Foreground SVG (1024x1024)
 * Places symbol inside the 66% Android safe zone (inner 675px)
 */
function createAdaptiveForegroundSvg(size = 1024, isMonochrome = false) {
  const pinColor = isMonochrome ? BRAND_WHITE : BRAND_ORANGE;
  const kColor = BRAND_WHITE;
  const { pinPath, kPath } = createSymbolPaths(pinColor, kColor);

  // Optical scaling: 512 base scaled to safe zone
  const scale = (size / 512) * 0.76;
  const offsetX = (size - 512 * scale) / 2;
  const offsetY = (size - 512 * scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    <path d="${pinPath}" fill="${pinColor}" fill-rule="evenodd"/>
    <path d="${kPath}" fill="${kColor}"/>
  </g>
</svg>`;
}

/**
 * Notification Icon (Android white silhouette, 96x96)
 */
function createNotificationIconSvg() {
  const { pinPath, kPath } = createSymbolPaths(BRAND_WHITE, BRAND_WHITE);
  const size = 96;
  const scale = (size / 512) * 0.82;
  const offsetX = (size - 512 * scale) / 2;
  const offsetY = (size - 512 * scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    <path d="${pinPath}" fill="${BRAND_WHITE}" fill-rule="evenodd"/>
    <path d="${kPath}" fill="${BRAND_WHITE}"/>
  </g>
</svg>`;
}

/**
 * Builds vector path outlines for "Khabo Kothay?" wordmark
 */
function getWordmarkPaths(fontSize, baselineY, startX = 0) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  let currentX = startX;
  const khaboPaths = [];
  const kothayPaths = [];

  for (const char of 'Khabo') {
    const glyph = font.charToGlyph(char);
    const rx = Number(currentX.toFixed(1));
    const p = glyph.getPath(rx, baselineY, fontSize);
    khaboPaths.push(p.toPathData(2));
    currentX += Number(((glyph.advanceWidth || 500) * scale).toFixed(1));
  }

  // Inter-word spacing
  currentX += Number((260 * scale).toFixed(1));

  for (const char of 'Kothay') {
    const glyph = font.charToGlyph(char);
    const rx = Number(currentX.toFixed(1));
    const p = glyph.getPath(rx, baselineY, fontSize);
    kothayPaths.push(p.toPathData(2));
    currentX += Number(((glyph.advanceWidth || 500) * scale).toFixed(1));
  }

  // Question mark top hook
  const qGlyph = font.charToGlyph('?');
  const qPath = qGlyph.getPath(0, 0, fontSize);
  const hookCmds = qPath.commands.slice(0, 34);
  const qOffsetX = Number((currentX + 5 * (fontSize / 60)).toFixed(1));

  const hookTranslated = hookCmds.map(c => {
    const cmd = { ...c };
    if (cmd.x !== undefined) cmd.x = Number((cmd.x + qOffsetX).toFixed(1));
    if (cmd.y !== undefined) cmd.y = Number((cmd.y + baselineY).toFixed(1));
    if (cmd.x1 !== undefined) cmd.x1 = Number((cmd.x1 + qOffsetX).toFixed(1));
    if (cmd.y1 !== undefined) cmd.y1 = Number((cmd.y1 + baselineY).toFixed(1));
    if (cmd.x2 !== undefined) cmd.x2 = Number((cmd.x2 + qOffsetX).toFixed(1));
    if (cmd.y2 !== undefined) cmd.y2 = Number((cmd.y2 + baselineY).toFixed(1));
    return cmd;
  });

  const tempPath = new opentype.Path();
  tempPath.commands = hookTranslated;
  const hookPathData = tempPath.toPathData(2);

  // Pin dot at bottom of ?
  const dotCenterX = qOffsetX + (21 * fontSize) / 100;
  const pinTipY = baselineY + 1 * (fontSize / 60);
  const s = fontSize / 60;
  const pinPathData = `M ${dotCenterX} ${pinTipY} C ${dotCenterX - 4.5 * s} ${pinTipY - 4 * s} ${dotCenterX - 6 * s} ${pinTipY - 8.5 * s} ${dotCenterX - 6 * s} ${pinTipY - 12 * s} C ${dotCenterX - 6 * s} ${pinTipY - 16 * s} ${dotCenterX - 3.5 * s} ${pinTipY - 18.5 * s} ${dotCenterX} ${pinTipY - 18.5 * s} C ${dotCenterX + 3.5 * s} ${pinTipY - 18.5 * s} ${dotCenterX + 6 * s} ${pinTipY - 16 * s} ${dotCenterX + 6 * s} ${pinTipY - 12 * s} C ${dotCenterX + 6 * s} ${pinTipY - 8.5 * s} ${dotCenterX + 4.5 * s} ${pinTipY - 4 * s} ${dotCenterX} ${pinTipY} Z M ${dotCenterX} ${pinTipY - 14 * s} A ${2 * s} ${2 * s} 0 1 0 ${dotCenterX} ${pinTipY - 10 * s} A ${2 * s} ${2 * s} 0 1 0 ${dotCenterX} ${pinTipY - 14 * s} Z`;

  const totalWidth = dotCenterX + 16 * s;
  return {
    khaboPath: khaboPaths.join(' '),
    kothayPath: kothayPaths.join(' '),
    hookPath: hookPathData,
    pinPath: pinPathData,
    width: totalWidth,
    height: fontSize * 1.3
  };
}

/**
 * Horizontal Combo Logo (Icon Badge + Typography)
 */
function createHorizontalLogoSvg({ isDark = false, compact = false, showBadge = true }) {
  const iconSize = compact ? 42 : 54;
  const fontSize = compact ? 30 : 38;
  const baselineY = compact ? 32 : 41;
  const textStartX = iconSize + (compact ? 12 : 16);

  const wm = getWordmarkPaths(fontSize, baselineY, textStartX);
  const totalWidth = Math.ceil(wm.width) + 8;
  const totalHeight = iconSize;

  const textColor = isDark ? BRAND_WHITE : BRAND_BLACK;
  const iconBg = isDark ? '#1C1917' : BRAND_BLACK;
  const iconScale = iconSize / 512;

  const { pinPath, kPath } = createSymbolPaths(BRAND_ORANGE, BRAND_WHITE);

  const badgeRect = showBadge
    ? `<rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="${iconBg}" />`
    : '';

  const symbolG = `
    <g transform="scale(${iconScale})">
      <path d="${pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
      <path d="${kPath}" fill="${BRAND_WHITE}" />
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
  ${badgeRect}
  ${symbolG}
  <path d="${wm.khaboPath}" fill="${textColor}" />
  <path d="${wm.kothayPath}" fill="${textColor}" />
  <path d="${wm.hookPath}" fill="${BRAND_ORANGE}" />
  <path d="${wm.pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
</svg>`;
}

/**
 * Pure Wordmark SVGs (without symbol badge, for backwards compat and flexible layout)
 */
function createPureWordmarkSvg(textColor, questionColor) {
  const wmMetrics = getWordmarkPaths(56, 68, 0);
  const vbWidth = Math.ceil(wmMetrics.width) + 10;
  const vbHeight = 90;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}">
  <path d="${wmMetrics.khaboPath} ${wmMetrics.kothayPath}" fill="${textColor}" />
  <path d="${wmMetrics.hookPath}" fill="${questionColor}" />
  <path d="${wmMetrics.pinPath}" fill="${questionColor}" fill-rule="evenodd" />
</svg>`;
}

/**
 * Mobile Splash Screen SVG (1242x2688)
 */
function createSplashSvg(isDark = false) {
  const width = 1242;
  const height = 2688;
  const bgColor = isDark ? BRAND_BLACK : '#FFFBF7';
  const textColor = isDark ? BRAND_WHITE : BRAND_BLACK;
  const badgeBg = BRAND_BLACK;

  // Centered App Icon
  const iconSize = 280;
  const iconX = (width - iconSize) / 2;
  const iconY = height / 2 - 240;
  const scale = iconSize / 512;
  const { pinPath, kPath } = createSymbolPaths(BRAND_ORANGE, BRAND_WHITE);

  // Wordmark below
  const wmFontSize = 82;
  const wmBaseline = 0;
  const wm = getWordmarkPaths(wmFontSize, wmBaseline, 0);
  const wmX = (width - wm.width) / 2;
  const wmY = iconY + iconSize + 110;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}" />
  
  <!-- Centered Icon Badge -->
  <g transform="translate(${iconX}, ${iconY})">
    <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="${badgeBg}" />
    <g transform="scale(${scale})">
      <path d="${pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
      <path d="${kPath}" fill="${BRAND_WHITE}" />
    </g>
  </g>

  <!-- Brand Wordmark -->
  <g transform="translate(${wmX}, ${wmY})">
    <path d="${wm.khaboPath}" fill="${textColor}" />
    <path d="${wm.kothayPath}" fill="${textColor}" />
    <path d="${wm.hookPath}" fill="${BRAND_ORANGE}" />
    <path d="${wm.pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
  </g>

  <!-- Tagline / Subtitle -->
  <text x="${width / 2}" y="${wmY + 80}" text-anchor="middle" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="36" fill="${BRAND_ORANGE}">খাবো কোথায়? • Dhaka</text>
  <text x="${width / 2}" y="${wmY + 130}" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="500" font-size="28" fill="${isDark ? '#A8A29E' : '#78716C'}">Real-time traffic &amp; dining recommendations</text>
</svg>`;
}

/**
 * Social Share Card (1200x630)
 */
function createSocialCardSvg() {
  const width = 1200;
  const height = 630;
  const { pinPath, kPath } = createSymbolPaths(BRAND_ORANGE, BRAND_WHITE);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${BRAND_BLACK}" />
  <!-- Subtle decorative ambient elements -->
  <circle cx="1100" cy="100" r="320" fill="${BRAND_ORANGE}" opacity="0.08" />
  <circle cx="100" cy="550" r="280" fill="#FFFFFF" opacity="0.03" />

  <!-- App Icon mark -->
  <g transform="translate(100, 160)">
    <rect width="180" height="180" rx="40" fill="#1C1917" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
    <g transform="scale(${180 / 512})">
      <path d="${pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
      <path d="${kPath}" fill="${BRAND_WHITE}" />
    </g>
  </g>

  <!-- Title & Tagline -->
  <g transform="translate(320, 230)">
    <text font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="64" fill="${BRAND_WHITE}">Khabo Kothay?</text>
    <text y="70" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="34" fill="${BRAND_ORANGE}">খাবো কোথায়? • Dhaka</text>
    <text y="130" font-family="'Inter', sans-serif" font-weight="500" font-size="24" fill="#E7E5E4">Real-time traffic-aware dining recommendations &amp; cost estimates</text>
  </g>

  <!-- Bottom Badges -->
  <g transform="translate(320, 470)">
    <rect width="180" height="42" rx="21" fill="${BRAND_ORANGE}" />
    <text x="90" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="#111111">BEST OVERALL</text>

    <rect x="200" width="180" height="42" rx="21" fill="#2A1D17" stroke="${BRAND_ORANGE}" stroke-width="1.5" />
    <text x="290" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="${BRAND_ORANGE}">FASTEST ROUTE</text>

    <rect x="400" width="180" height="42" rx="21" fill="rgba(255,255,255,0.1)" />
    <text x="490" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="${BRAND_WHITE}">GULSHAN • BANANI</text>
  </g>
</svg>`;
}

/**
 * Play Store Feature Graphic (1024x500)
 */
function createPlayStoreFeatureSvg() {
  const width = 1024;
  const height = 500;
  const { pinPath, kPath } = createSymbolPaths(BRAND_ORANGE, BRAND_WHITE);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${BRAND_BLACK}" />
  <circle cx="950" cy="80" r="260" fill="${BRAND_ORANGE}" opacity="0.10" />
  <circle cx="80" cy="450" r="200" fill="#FFFFFF" opacity="0.04" />

  <!-- Left: App Icon -->
  <g transform="translate(80, 130)">
    <rect width="180" height="180" rx="40" fill="#1C1917" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
    <g transform="scale(${180 / 512})">
      <path d="${pinPath}" fill="${BRAND_ORANGE}" fill-rule="evenodd" />
      <path d="${kPath}" fill="${BRAND_WHITE}" />
    </g>
  </g>

  <!-- Right: Logo & Typography -->
  <g transform="translate(300, 200)">
    <text font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="56" fill="${BRAND_WHITE}">Khabo Kothay?</text>
    <text y="60" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="30" fill="${BRAND_ORANGE}">খাবো কোথায়? — ঢাকা রেস্তোরাঁ নির্দেশিকা</text>
    <text y="115" font-family="'Inter', sans-serif" font-weight="500" font-size="20" fill="#E7E5E4">Traffic-aware travel times, transport costs &amp; personalized dining</text>
  </g>
</svg>`;
}

async function exportAssets() {
  console.log('--- Generating Upgraded Brand Assets ---');

  // Master SVGs
  const appIconSvg = createAppIconSvg(1024, false, false);
  const appIconTransparentSvg = createAppIconSvg(1024, false, true);
  const adaptiveFgSvg = createAdaptiveForegroundSvg(1024, false);
  const adaptiveMonoSvg = createAdaptiveForegroundSvg(1024, true);
  const notificationSvg = createNotificationIconSvg();

  // Horizontal Combo Logos
  const horizontalLightSvg = createHorizontalLogoSvg({ isDark: false });
  const horizontalDarkSvg = createHorizontalLogoSvg({ isDark: true });

  // Pure wordmarks (for backwards compat and pure text needs)
  const wordmarkLightSvg = createPureWordmarkSvg(BRAND_BLACK, BRAND_ORANGE);
  const wordmarkDarkSvg = createPureWordmarkSvg(BRAND_WHITE, BRAND_ORANGE);
  const wordmarkOnIndigoSvg = createPureWordmarkSvg(BRAND_WHITE, BRAND_ORANGE);

  // Splash Screens
  const splashLightSvg = createSplashSvg(false);
  const splashDarkSvg = createSplashSvg(true);

  // Marketing Graphics
  const socialCardSvg = createSocialCardSvg();
  const playStoreFeatureSvg = createPlayStoreFeatureSvg();

  // Write SVGs to brand/logo/
  fs.writeFileSync(path.join(logoDir, 'icon.svg'), appIconSvg);
  fs.writeFileSync(path.join(logoDir, 'icon-transparent.svg'), appIconTransparentSvg);
  fs.writeFileSync(path.join(logoDir, 'adaptive-foreground.svg'), adaptiveFgSvg);
  fs.writeFileSync(path.join(logoDir, 'adaptive-monochrome.svg'), adaptiveMonoSvg);
  fs.writeFileSync(path.join(logoDir, 'notification-icon.svg'), notificationSvg);
  fs.writeFileSync(path.join(logoDir, 'logo-horizontal-light.svg'), horizontalLightSvg);
  fs.writeFileSync(path.join(logoDir, 'logo-horizontal-dark.svg'), horizontalDarkSvg);
  fs.writeFileSync(path.join(logoDir, 'wordmark-light.svg'), wordmarkLightSvg);
  fs.writeFileSync(path.join(logoDir, 'wordmark-dark.svg'), wordmarkDarkSvg);
  fs.writeFileSync(path.join(logoDir, 'wordmark-on-indigo.svg'), wordmarkOnIndigoSvg);

  // Write SVGs to public/img/ and mobile/assets/
  fs.writeFileSync(path.join(publicImgDir, 'icon.svg'), appIconSvg);
  fs.writeFileSync(path.join(publicImgDir, 'icon-transparent.svg'), appIconTransparentSvg);
  fs.writeFileSync(path.join(publicImgDir, 'logo.svg'), horizontalLightSvg);
  fs.writeFileSync(path.join(publicImgDir, 'logo-dark.svg'), horizontalDarkSvg);
  fs.writeFileSync(path.join(publicImgDir, 'wordmark-on-indigo.svg'), wordmarkOnIndigoSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.svg'), appIconSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon-transparent.svg'), appIconTransparentSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'logo.svg'), horizontalLightSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'logo-dark.svg'), horizontalDarkSvg);

  // 1. Mobile App Icon (1024x1024)
  await sharp(Buffer.from(appIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, 'icon.png'));
  console.log('✓ mobile/assets/icon.png (1024x1024)');

  // 2. Android Adaptive Icon
  await sharp(Buffer.from(adaptiveFgSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, 'adaptive-icon.png'));
  console.log('✓ mobile/assets/adaptive-icon.png (1024x1024 foreground)');

  // Adaptive background (solid Brand Black #111111)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BRAND_BLACK
    }
  })
    .png()
    .toFile(path.join(mobileAssetsDir, 'adaptive-icon-background.png'));
  console.log('✓ mobile/assets/adaptive-icon-background.png (1024x1024)');

  // Android themed icon monochrome layer
  await sharp(Buffer.from(adaptiveMonoSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, 'adaptive-icon-monochrome.png'));
  console.log('✓ mobile/assets/adaptive-icon-monochrome.png (1024x1024)');

  // Android Notification Icon (white on transparent silhouette, 96x96)
  await sharp(Buffer.from(notificationSvg))
    .resize(96, 96)
    .png()
    .toFile(path.join(mobileAssetsDir, 'notification-icon.png'));
  console.log('✓ mobile/assets/notification-icon.png (96x96)');

  // 3. Splash Screens
  await sharp(Buffer.from(splashLightSvg))
    .resize(1242, 2688)
    .png()
    .toFile(path.join(mobileAssetsDir, 'splash.png'));
  console.log('✓ mobile/assets/splash.png (Light 1242x2688)');

  await sharp(Buffer.from(splashDarkSvg))
    .resize(1242, 2688)
    .png()
    .toFile(path.join(mobileAssetsDir, 'splash-dark.png'));
  console.log('✓ mobile/assets/splash-dark.png (Dark 1242x2688)');

  // 4. Web Logos (PNG and SVG)
  await sharp(Buffer.from(horizontalLightSvg))
    .png()
    .toFile(path.join(publicImgDir, 'logo.png'));
  await sharp(Buffer.from(horizontalLightSvg))
    .png()
    .toFile(path.join(brandDir, 'logo', 'logo-horizontal.png'));
  await sharp(Buffer.from(horizontalLightSvg))
    .png()
    .toFile(path.join(mobileAssetsDir, 'logo-horizontal.png'));
  console.log('✓ public/img/logo.png & mobile/assets/logo-horizontal.png');

  // 5. Web Favicons (SVG, ICO, PNGs: 32, 48, 64, 128, 192, 512, apple-touch 180)
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createAppIconSvg(128));
  for (const s of [32, 48, 64, 128, 192, 512]) {
    await sharp(Buffer.from(createAppIconSvg(s)))
      .resize(s, s)
      .png()
      .toFile(path.join(publicDir, `favicon-${s}.png`));
  }
  await sharp(Buffer.from(createAppIconSvg(180)))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Copy standard favicon.png & favicon.ico
  fs.copyFileSync(path.join(publicDir, 'favicon-32.png'), path.join(publicDir, 'favicon.png'));
  fs.copyFileSync(path.join(publicDir, 'favicon-32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('✓ Web favicons generated (32, 48, 64, 128, 192, 512, apple-touch 180, svg, ico)');

  // 6. Social Card (1200x630)
  await sharp(Buffer.from(socialCardSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicImgDir, 'social-card.png'));
  console.log('✓ public/img/social-card.png (1200x630)');

  // 7. Play Store Assets
  await sharp(Buffer.from(appIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(docsPlayStoreDir, 'icon-512.png'));
  console.log('✓ docs/play-store-assets/icon-512.png (512x512)');

  await sharp(Buffer.from(playStoreFeatureSvg))
    .resize(1024, 500)
    .png()
    .toFile(path.join(docsPlayStoreDir, 'feature-graphic-1024x500.png'));
  console.log('✓ docs/play-store-assets/feature-graphic-1024x500.png (1024x500)');

  console.log('\n✅ All upgraded brand assets built and exported successfully!');
}

exportAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
