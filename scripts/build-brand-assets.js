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
const light = tokens.light;
const dark = tokens.dark;

// 1. Generate outlined vector paths using Plus Jakarta Sans Bold
const fontBuffer = fs.readFileSync(path.join(rootDir, 'public', 'fonts', 'PlusJakartaSans-Bold.ttf'));
const font = opentype.parse(fontBuffer.buffer);

function getWordmarkPaths(fontSize, baselineY) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  let currentX = 0;
  const letterPaths = [];

  for (const char of 'Khabo Kothay') {
    const glyph = font.charToGlyph(char);
    if (char === ' ') {
      currentX += Number(((glyph.advanceWidth || 300) * scale).toFixed(1));
      continue;
    }
    const rx = Number(currentX.toFixed(1));
    const p = glyph.getPath(rx, baselineY, fontSize);
    letterPaths.push(p.toPathData(2));
    currentX += Number(((glyph.advanceWidth || 500) * scale).toFixed(1));
  }

  // Question mark top hook
  const qGlyph = font.charToGlyph('?');
  const qPath = qGlyph.getPath(0, 0, fontSize);
  const hookCmds = qPath.commands.slice(0, 34); // first contour is hook
  const qOffsetX = Number((currentX + 6 * (fontSize / 60)).toFixed(1));

  // Translate hook commands to target position
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
  const s = fontSize / 60; // scale factor
  // Custom Map Pin teardrop drop vector
  const pinPathData = `M ${dotCenterX} ${pinTipY} C ${dotCenterX - 4.5 * s} ${pinTipY - 4 * s} ${dotCenterX - 6 * s} ${pinTipY - 8.5 * s} ${dotCenterX - 6 * s} ${pinTipY - 12 * s} C ${dotCenterX - 6 * s} ${pinTipY - 16 * s} ${dotCenterX - 3.5 * s} ${pinTipY - 18.5 * s} ${dotCenterX} ${pinTipY - 18.5 * s} C ${dotCenterX + 3.5 * s} ${pinTipY - 18.5 * s} ${dotCenterX + 6 * s} ${pinTipY - 16 * s} ${dotCenterX + 6 * s} ${pinTipY - 12 * s} C ${dotCenterX + 6 * s} ${pinTipY - 8.5 * s} ${dotCenterX + 4.5 * s} ${pinTipY - 4 * s} ${dotCenterX} ${pinTipY} Z M ${dotCenterX} ${pinTipY - 14 * s} A ${2 * s} ${2 * s} 0 1 0 ${dotCenterX} ${pinTipY - 10 * s} A ${2 * s} ${2 * s} 0 1 0 ${dotCenterX} ${pinTipY - 14 * s} Z`;

  const totalWidth = dotCenterX + 16 * s;
  return {
    textPath: letterPaths.join(' '),
    hookPath: hookPathData,
    pinPath: pinPathData,
    width: totalWidth,
    height: fontSize * 1.3
  };
}

const wmMetrics = getWordmarkPaths(56, 68);

// Create Wordmark SVGs
function createWordmarkSvg(textColor, questionColor) {
  const vbWidth = Math.ceil(wmMetrics.width) + 10;
  const vbHeight = 90;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbWidth} ${vbHeight}" width="${vbWidth}" height="${vbHeight}">
  <path d="${wmMetrics.textPath}" fill="${textColor}" />
  <path d="${wmMetrics.hookPath}" fill="${questionColor}" />
  <path d="${wmMetrics.pinPath}" fill="${questionColor}" />
</svg>`;
}

const wordmarkLightSvg = createWordmarkSvg(light.primary, light.accent);
const wordmarkDarkSvg = createWordmarkSvg(dark.ink, dark.accent);
const wordmarkOnIndigoSvg = createWordmarkSvg('#FFFFFF', light.accent);

fs.writeFileSync(path.join(logoDir, 'wordmark-light.svg'), wordmarkLightSvg);
fs.writeFileSync(path.join(logoDir, 'wordmark-dark.svg'), wordmarkDarkSvg);
fs.writeFileSync(path.join(logoDir, 'wordmark-on-indigo.svg'), wordmarkOnIndigoSvg);

// Public Web Logos
fs.writeFileSync(path.join(publicImgDir, 'logo.svg'), wordmarkLightSvg);
fs.writeFileSync(path.join(publicImgDir, 'logo-dark.svg'), wordmarkDarkSvg);
fs.writeFileSync(path.join(publicImgDir, 'wordmark-on-indigo.svg'), wordmarkOnIndigoSvg);

// Create App Icon SVG (512x512 canvas)
// Bold white ? whose dot is a saffron pin on #3B3FA8 rounded square
function createAppIconSvg(size = 512, isMonochrome = false) {
  const cornerRadius = size * 0.22; // smooth squirclish rounded square
  const bgFill = isMonochrome ? 'none' : light.primary;
  const markColor = isMonochrome ? '#FFFFFF' : '#FFFFFF';
  const pinColor = isMonochrome ? '#FFFFFF' : light.accent;

  // Question mark geometry scaled for center of app icon
  const qSize = size * 0.58;
  const scale = qSize / 100;
  const cx = size / 2;
  const topHookY = size * 0.24;

  // Precise bold ? hook path scaled & centered
  // Based on Plus Jakarta Sans Bold ? hook
  const hookPath = `
    M ${cx + 10 * scale} ${topHookY + 40 * scale}
    L ${cx - 6 * scale} ${topHookY + 40 * scale}
    L ${cx - 6 * scale} ${topHookY + 36 * scale}
    C ${cx - 6 * scale} ${topHookY + 28 * scale} ${cx - 3 * scale} ${topHookY + 22 * scale} ${cx + 2 * scale} ${topHookY + 16 * scale}
    C ${cx + 8 * scale} ${topHookY + 10 * scale} ${cx + 16 * scale} ${topHookY + 4 * scale} ${cx + 16 * scale} ${topHookY - 4 * scale}
    C ${cx + 16 * scale} ${topHookY - 14 * scale} ${cx + 8 * scale} ${topHookY - 20 * scale} ${cx - 2 * scale} ${topHookY - 20 * scale}
    C ${cx - 12 * scale} ${topHookY - 20 * scale} ${cx - 18 * scale} ${topHookY - 13 * scale} ${cx - 19 * scale} ${topHookY - 5 * scale}
    L ${cx - 35 * scale} ${topHookY - 8 * scale}
    C ${cx - 33 * scale} ${topHookY - 23 * scale} ${cx - 23 * scale} ${topHookY - 33 * scale} ${cx - 2 * scale} ${topHookY - 33 * scale}
    C ${cx + 18 * scale} ${topHookY - 33 * scale} ${cx + 34 * scale} ${topHookY - 22 * scale} ${cx + 34 * scale} ${topHookY - 4 * scale}
    C ${cx + 34 * scale} ${topHookY + 10 * scale} ${cx + 24 * scale} ${topHookY + 20 * scale} ${cx + 18 * scale} ${topHookY + 27 * scale}
    C ${cx + 12 * scale} ${topHookY + 33 * scale} ${cx + 10 * scale} ${topHookY + 37 * scale} ${cx + 10 * scale} ${topHookY + 40 * scale}
    Z
  `;

  // Saffron Map Pin Drop at bottom
  const pinTipY = topHookY + 68 * scale;
  const pinRadius = 11 * scale;
  const pinCenterY = pinTipY - 15 * scale;
  const pinHoleRadius = 4 * scale;

  const pinPath = `
    M ${cx} ${pinTipY}
    C ${cx - 13 * scale} ${pinCenterY + 4 * scale} ${cx - pinRadius} ${pinCenterY - 2 * scale} ${cx - pinRadius} ${pinCenterY - 6 * scale}
    C ${cx - pinRadius} ${pinCenterY - 14 * scale} ${cx - 7 * scale} ${pinCenterY - 18 * scale} ${cx} ${pinCenterY - 18 * scale}
    C ${cx + 7 * scale} ${pinCenterY - 18 * scale} ${cx + pinRadius} ${pinCenterY - 14 * scale} ${cx + pinRadius} ${pinCenterY - 6 * scale}
    C ${cx + pinRadius} ${pinCenterY - 2 * scale} ${cx + 13 * scale} ${pinCenterY + 4 * scale} ${cx} ${pinTipY}
    Z
    M ${cx} ${pinCenterY - 10 * scale}
    A ${pinHoleRadius} ${pinHoleRadius} 0 1 0 ${cx} ${pinCenterY - 2 * scale}
    A ${pinHoleRadius} ${pinHoleRadius} 0 1 0 ${cx} ${pinCenterY - 10 * scale}
    Z
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${isMonochrome ? '' : `<rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${bgFill}"/>`}
  <path d="${hookPath}" fill="${markColor}"/>
  <path d="${pinPath}" fill="${pinColor}"/>
</svg>`;
}

// Android Adaptive Icon Foreground SVG
// Central safe zone (Android adaptive icon safe zone is 66% = inner 288px of 432px or 675px of 1024px)
function createAdaptiveForegroundSvg(size = 1024, isMonochrome = false) {
  const markColor = '#FFFFFF';
  const pinColor = isMonochrome ? '#FFFFFF' : light.accent;

  // Safe scale to fit inside 66% circle
  const qSize = size * 0.44;
  const scale = qSize / 100;
  const cx = size / 2;
  const topHookY = size * 0.35;

  const hookPath = `
    M ${cx + 10 * scale} ${topHookY + 40 * scale}
    L ${cx - 6 * scale} ${topHookY + 40 * scale}
    L ${cx - 6 * scale} ${topHookY + 36 * scale}
    C ${cx - 6 * scale} ${topHookY + 28 * scale} ${cx - 3 * scale} ${topHookY + 22 * scale} ${cx + 2 * scale} ${topHookY + 16 * scale}
    C ${cx + 8 * scale} ${topHookY + 10 * scale} ${cx + 16 * scale} ${topHookY + 4 * scale} ${cx + 16 * scale} ${topHookY - 4 * scale}
    C ${cx + 16 * scale} ${topHookY - 14 * scale} ${cx + 8 * scale} ${topHookY - 20 * scale} ${cx - 2 * scale} ${topHookY - 20 * scale}
    C ${cx - 12 * scale} ${topHookY - 20 * scale} ${cx - 18 * scale} ${topHookY - 13 * scale} ${cx - 19 * scale} ${topHookY - 5 * scale}
    L ${cx - 35 * scale} ${topHookY - 8 * scale}
    C ${cx - 33 * scale} ${topHookY - 23 * scale} ${cx - 23 * scale} ${topHookY - 33 * scale} ${cx - 2 * scale} ${topHookY - 33 * scale}
    C ${cx + 18 * scale} ${topHookY - 33 * scale} ${cx + 34 * scale} ${topHookY - 22 * scale} ${cx + 34 * scale} ${topHookY - 4 * scale}
    C ${cx + 34 * scale} ${topHookY + 10 * scale} ${cx + 24 * scale} ${topHookY + 20 * scale} ${cx + 18 * scale} ${topHookY + 27 * scale}
    C ${cx + 12 * scale} ${topHookY + 33 * scale} ${cx + 10 * scale} ${topHookY + 37 * scale} ${cx + 10 * scale} ${topHookY + 40 * scale}
    Z
  `;

  const pinTipY = topHookY + 68 * scale;
  const pinRadius = 11 * scale;
  const pinCenterY = pinTipY - 15 * scale;
  const pinHoleRadius = 4 * scale;

  const pinPath = `
    M ${cx} ${pinTipY}
    C ${cx - 13 * scale} ${pinCenterY + 4 * scale} ${cx - pinRadius} ${pinCenterY - 2 * scale} ${cx - pinRadius} ${pinCenterY - 6 * scale}
    C ${cx - pinRadius} ${pinCenterY - 14 * scale} ${cx - 7 * scale} ${pinCenterY - 18 * scale} ${cx} ${pinCenterY - 18 * scale}
    C ${cx + 7 * scale} ${pinCenterY - 18 * scale} ${cx + pinRadius} ${pinCenterY - 14 * scale} ${cx + pinRadius} ${pinCenterY - 6 * scale}
    C ${cx + pinRadius} ${pinCenterY - 2 * scale} ${cx + 13 * scale} ${pinCenterY + 4 * scale} ${cx} ${pinTipY}
    Z
    M ${cx} ${pinCenterY - 10 * scale}
    A ${pinHoleRadius} ${pinHoleRadius} 0 1 0 ${cx} ${pinCenterY - 2 * scale}
    A ${pinHoleRadius} ${pinHoleRadius} 0 1 0 ${cx} ${pinCenterY - 10 * scale}
    Z
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <path d="${hookPath}" fill="${markColor}"/>
  <path d="${pinPath}" fill="${pinColor}"/>
</svg>`;
}

// Notification Icon (Android white on transparent silhouette, 96x96)
function createNotificationIconSvg() {
  return createAdaptiveForegroundSvg(96, true);
}

// Splash Screen SVG (1242x2688 typical high-res mobile splash)
function createSplashSvg(bgColor, isDark) {
  const width = 1242;
  const height = 2688;
  const scale = 2.4;
  const wmWidth = wmMetrics.width * scale;
  const wmHeight = wmMetrics.height * scale;
  const startX = (width - wmWidth) / 2;
  const startY = height / 2 - wmHeight / 2;

  const textColor = '#FFFFFF';
  const questionColor = light.accent;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}" />
  <g transform="translate(${startX}, ${startY}) scale(${scale})">
    <path d="${wmMetrics.textPath}" fill="${textColor}" />
    <path d="${wmMetrics.hookPath}" fill="${questionColor}" />
    <path d="${wmMetrics.pinPath}" fill="${questionColor}" />
  </g>
</svg>`;
}

// Social Share Card (1200x630)
function createSocialCardSvg() {
  const width = 1200;
  const height = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${light.primary}" />
  <!-- Subtle decorative circles -->
  <circle cx="1100" cy="100" r="300" fill="#FFFFFF" opacity="0.04" />
  <circle cx="100" cy="550" r="250" fill="${light.accent}" opacity="0.08" />

  <!-- App Icon mark -->
  <g transform="translate(100, 160)">
    <rect width="140" height="140" rx="32" fill="#FFFFFF" opacity="0.1" />
    <g transform="translate(-10, -20) scale(0.32)">
      <path d="${wmMetrics.hookPath}" fill="#FFFFFF" />
      <path d="${wmMetrics.pinPath}" fill="${light.accent}" />
    </g>
  </g>

  <!-- Title & Tagline -->
  <g transform="translate(280, 220)">
    <text font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="64" fill="#FFFFFF">Khabo Kothay?</text>
    <text y="70" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="34" fill="${light.accent}">খাবো কোথায়? • Dhaka</text>
    <text y="130" font-family="'Inter', sans-serif" font-weight="500" font-size="24" fill="#E6E7F7">Real-time traffic-aware dining recommendations &amp; cost estimates</text>
  </g>

  <!-- Bottom Badges -->
  <g transform="translate(280, 440)">
    <rect width="180" height="42" rx="21" fill="${light.accent}" />
    <text x="90" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="${light.onAccent}">BEST OVERALL</text>

    <rect x="200" width="180" height="42" rx="21" fill="${light.primaryTint}" />
    <text x="290" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="16" fill="${light.primary}">FASTEST ROUTE</text>

    <rect x="400" width="180" height="42" rx="21" fill="#FFFFFF" opacity="0.15" />
    <text x="490" y="26" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#FFFFFF">GULSHAN • BANANI</text>
  </g>
</svg>`;
}

// Play Store Feature Graphic (1024x500)
function createPlayStoreFeatureSvg() {
  const width = 1024;
  const height = 500;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${light.primary}" />
  <circle cx="950" cy="80" r="260" fill="#FFFFFF" opacity="0.05" />
  <circle cx="80" cy="450" r="200" fill="${light.accent}" opacity="0.08" />

  <!-- Centered Logo and Taglines -->
  <g transform="translate(100, 150)">
    <g transform="translate(0, 0)">
      <path d="${wmMetrics.textPath}" fill="#FFFFFF" transform="scale(1.3)" />
      <path d="${wmMetrics.hookPath}" fill="${light.accent}" transform="scale(1.3)" />
      <path d="${wmMetrics.pinPath}" fill="${light.accent}" transform="scale(1.3)" />
    </g>
    <text x="0" y="160" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="32" fill="${light.accent}">খাবো কোথায়? — ঢাকা রেস্তোরাঁ নির্দেশিকা</text>
    <text x="0" y="210" font-family="'Inter', sans-serif" font-weight="500" font-size="22" fill="#E6E7F7">Traffic-aware travel times, transport costs &amp; personalized dining</text>
  </g>
</svg>`;
}

async function exportAssets() {
  console.log('--- Generating Brand Assets ---');

  // Master SVGs
  const appIconSvg = createAppIconSvg(1024);
  const adaptiveFgSvg = createAdaptiveForegroundSvg(1024);
  const adaptiveMonoSvg = createAdaptiveForegroundSvg(1024, true);
  const notificationSvg = createNotificationIconSvg();
  const splashLightSvg = createSplashSvg(light.primary, false);
  const splashDarkSvg = createSplashSvg(dark.bg, true);
  const socialCardSvg = createSocialCardSvg();
  const playStoreFeatureSvg = createPlayStoreFeatureSvg();

  fs.writeFileSync(path.join(brandDir, 'logo', 'icon.svg'), appIconSvg);
  fs.writeFileSync(path.join(brandDir, 'logo', 'adaptive-foreground.svg'), adaptiveFgSvg);
  fs.writeFileSync(path.join(brandDir, 'logo', 'adaptive-monochrome.svg'), adaptiveMonoSvg);

  // 1. App Icon (1024x1024)
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

  // Adaptive background (solid indigo)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: light.primary
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

  // Android Notification Icon (white on transparent)
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
  console.log('✓ mobile/assets/splash.png (Light)');

  await sharp(Buffer.from(splashDarkSvg))
    .resize(1242, 2688)
    .png()
    .toFile(path.join(mobileAssetsDir, 'splash-dark.png'));
  console.log('✓ mobile/assets/splash-dark.png (Dark)');

  // 4. Web Favicons
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createAppIconSvg(128));
  await sharp(Buffer.from(createAppIconSvg(32)))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  await sharp(Buffer.from(createAppIconSvg(192)))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'favicon-192.png'));
  await sharp(Buffer.from(createAppIconSvg(512)))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'favicon-512.png'));
  await sharp(Buffer.from(createAppIconSvg(180)))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Copy standard favicon.png & favicon.ico
  fs.copyFileSync(path.join(publicDir, 'favicon-32.png'), path.join(publicDir, 'favicon.png'));
  fs.copyFileSync(path.join(publicDir, 'favicon-32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('✓ Web favicons generated (32, 192, 512, apple-touch 180, svg, ico)');

  // 5. Social Card (1200x630)
  await sharp(Buffer.from(socialCardSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicImgDir, 'social-card.png'));
  console.log('✓ public/img/social-card.png (1200x630)');

  // 6. Play Store Assets
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

  console.log('\n✅ All brand assets built and exported successfully!');
}

exportAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
