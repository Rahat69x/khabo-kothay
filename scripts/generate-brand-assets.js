import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const mobileAssetsDir = path.join(rootDir, 'mobile', 'assets');
const publicDir = path.join(rootDir, 'public');
const publicImgDir = path.join(publicDir, 'img');

if (!fs.existsSync(mobileAssetsDir)) fs.mkdirSync(mobileAssetsDir, { recursive: true });
if (!fs.existsSync(publicImgDir)) fs.mkdirSync(publicImgDir, { recursive: true });

// 1. Full Wordmark SVG (for Header and Web)
const headerLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 90" width="460" height="90">
  <defs>
    <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A50" />
      <stop offset="100%" stop-color="#E05326" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
  </defs>

  <!-- Stylized Fork & Pin Icon -->
  <g transform="translate(15, 12)">
    <!-- Map Pin Background -->
    <path d="M 32 0 C 14.3 0 0 14.3 0 32 C 0 48.5 24 72 32 78 C 40 72 64 48.5 64 32 C 64 14.3 49.7 0 32 0 Z" fill="url(#coralGrad)" />
    
    <!-- Fork Silhouette Inside Pin -->
    <!-- Handle -->
    <rect x="29" y="32" width="6" height="24" rx="3" fill="#FFF7ED" />
    <!-- Base -->
    <path d="M 23 26 C 23 32, 41 32, 41 26 Z" fill="#FFF7ED" />
    <!-- Prongs -->
    <rect x="23" y="14" width="4" height="15" rx="2" fill="#FFF7ED" />
    <rect x="30" y="12" width="4" height="17" rx="2" fill="#FFF7ED" />
    <rect x="37" y="14" width="4" height="15" rx="2" fill="#FFF7ED" />

    <!-- Pulse dot -->
    <circle cx="32" cy="32" r="3" fill="#F59E0B" />
  </g>

  <!-- Wordmark Text: "Khabo Kothay?" -->
  <text x="94" y="58" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="38" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">Khabo</text>
  <text x="224" y="58" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="38" font-weight="800" fill="url(#coralGrad)" letter-spacing="-0.5">Kothay</text>
  
  <!-- Stylized Question Mark (styled as fork-pin curve) -->
  <g transform="translate(366, 22)">
    <path d="M 8 10 C 8 2, 28 2, 28 14 C 28 24, 18 25, 18 34" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
    <circle cx="18" cy="46" r="3.5" fill="url(#goldGrad)" />
  </g>
</svg>
`;

// 2. Square App Icon SVG (1024x1024)
const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#241812" />
      <stop offset="100%" stop-color="#120D0A" />
    </linearGradient>
    <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A50" />
      <stop offset="100%" stop-color="#E05326" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background with warm rounded squircle -->
  <rect width="1024" height="1024" rx="224" fill="url(#bgGrad)" />
  <rect width="1024" height="1024" rx="224" fill="none" stroke="rgba(255, 122, 80, 0.2)" stroke-width="8" />

  <!-- Subtle ambient glow circle -->
  <circle cx="512" cy="460" r="320" fill="rgba(224, 83, 38, 0.15)" filter="url(#glow)" />

  <!-- Central Pin Icon -->
  <g transform="translate(362, 180) scale(4.5)">
    <!-- Map Pin Background -->
    <path d="M 32 0 C 14.3 0 0 14.3 0 32 C 0 50, 24 76, 32 82 C 40 76, 64 50, 64 32 C 64 14.3 49.7 0 32 0 Z" fill="url(#coralGrad)" filter="url(#glow)" />
    
    <!-- Fork Silhouette -->
    <!-- Handle -->
    <rect x="29" y="34" width="6" height="26" rx="3" fill="#FFF7ED" />
    <!-- Base -->
    <path d="M 23 27 C 23 34, 41 34, 41 27 Z" fill="#FFF7ED" />
    <!-- Prongs -->
    <rect x="23" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />
    <rect x="30" y="12" width="4" height="18" rx="2" fill="#FFF7ED" />
    <rect x="37" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />

    <!-- Question Mark Curve Accompanying Pin -->
    <circle cx="32" cy="32" r="5" fill="#F59E0B" />
  </g>

  <!-- Clean Wordmark Badge at Bottom of Icon -->
  <text x="512" y="760" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="88" font-weight="900" fill="#FFF7ED" text-anchor="middle" letter-spacing="-1">Khabo</text>
  <text x="512" y="860" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="88" font-weight="900" fill="url(#coralGrad)" text-anchor="middle" letter-spacing="-1">Kothay?</text>
</svg>
`;

// 3. Android Adaptive Icon (Safe zone centered 512x512 with margin)
const adaptiveIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#241812" />
      <stop offset="100%" stop-color="#120D0A" />
    </linearGradient>
    <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A50" />
      <stop offset="100%" stop-color="#E05326" />
    </linearGradient>
  </defs>

  <rect width="1024" height="1024" fill="url(#bgGrad)" />

  <!-- Center Safe Zone (within central 66% circle) -->
  <g transform="translate(372, 240) scale(4.2)">
    <path d="M 32 0 C 14.3 0 0 14.3 0 32 C 0 50, 24 76, 32 82 C 40 76, 64 50, 64 32 C 64 14.3 49.7 0 32 0 Z" fill="url(#coralGrad)" />
    <rect x="29" y="34" width="6" height="26" rx="3" fill="#FFF7ED" />
    <path d="M 23 27 C 23 34, 41 34, 41 27 Z" fill="#FFF7ED" />
    <rect x="23" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />
    <rect x="30" y="12" width="4" height="18" rx="2" fill="#FFF7ED" />
    <rect x="37" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />
    <circle cx="32" cy="32" r="5" fill="#F59E0B" />
  </g>

  <text x="512" y="730" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="76" font-weight="900" fill="#FFF7ED" text-anchor="middle">Khabo</text>
  <text x="512" y="820" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="76" font-weight="900" fill="url(#coralGrad)" text-anchor="middle">Kothay?</text>
</svg>
`;

// 4. Splash Screen SVG (1242x2688 typical high-res mobile splash)
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1242 2688" width="1242" height="2688">
  <defs>
    <linearGradient id="bgSplash" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E140E" />
      <stop offset="100%" stop-color="#0E0805" />
    </linearGradient>
    <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A50" />
      <stop offset="100%" stop-color="#E05326" />
    </linearGradient>
    <filter id="splashGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="1242" height="2688" fill="url(#bgSplash)" />
  <circle cx="621" cy="1150" r="350" fill="rgba(224, 83, 38, 0.12)" filter="url(#splashGlow)" />

  <g transform="translate(421, 920) scale(6.2)">
    <path d="M 32 0 C 14.3 0 0 14.3 0 32 C 0 50, 24 76, 32 82 C 40 76, 64 50, 64 32 C 64 14.3 49.7 0 32 0 Z" fill="url(#coralGrad)" />
    <rect x="29" y="34" width="6" height="26" rx="3" fill="#FFF7ED" />
    <path d="M 23 27 C 23 34, 41 34, 41 27 Z" fill="#FFF7ED" />
    <rect x="23" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />
    <rect x="30" y="12" width="4" height="18" rx="2" fill="#FFF7ED" />
    <rect x="37" y="14" width="4" height="16" rx="2" fill="#FFF7ED" />
    <circle cx="32" cy="32" r="5" fill="#F59E0B" />
  </g>

  <text x="621" y="1620" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="108" font-weight="900" fill="#FFF7ED" text-anchor="middle" letter-spacing="-1">Khabo</text>
  <text x="621" y="1740" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="108" font-weight="900" fill="url(#coralGrad)" text-anchor="middle" letter-spacing="-1">Kothay?</text>
  <text x="621" y="1830" font-family="'Plus Jakarta Sans', -apple-system, sans-serif" font-size="34" font-weight="600" fill="#A89F91" text-anchor="middle" letter-spacing="0.5">Real-time traffic &amp; personalized dining</text>
</svg>
`;

// 5. Favicon SVG (64x64)
const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#1C140E" />
  <path d="M 32 4 C 18 4 8 15 8 28 C 8 42, 27 58, 32 60 C 37 58, 56 42, 56 28 C 56 15, 46 4, 32 4 Z" fill="#E05326" />
  <!-- Fork -->
  <rect x="30" y="28" width="4" height="16" rx="2" fill="#FFF7ED" />
  <path d="M 25 24 C 25 29, 39 29, 39 24 Z" fill="#FFF7ED" />
  <rect x="25" y="14" width="3" height="11" rx="1" fill="#FFF7ED" />
  <rect x="30.5" y="12" width="3" height="13" rx="1" fill="#FFF7ED" />
  <rect x="36" y="14" width="3" height="11" rx="1" fill="#FFF7ED" />
</svg>
`;

async function generateAssets() {
  console.log('🎨 Generating brand assets for "Khabo Kothay?"...');

  // Save SVG sources
  fs.writeFileSync(path.join(publicImgDir, 'logo.svg'), headerLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'logo.svg'), headerLogoSvg);
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.svg'), appIconSvg);

  // 1. Generate 1024x1024 App Icon PNG
  await sharp(Buffer.from(appIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, 'icon.png'));
  console.log('✅ Generated mobile/assets/icon.png (1024x1024)');

  // 2. Generate Adaptive Icon PNG
  await sharp(Buffer.from(adaptiveIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(mobileAssetsDir, 'adaptive-icon.png'));
  console.log('✅ Generated mobile/assets/adaptive-icon.png');

  // 3. Generate Splash Screen PNG
  await sharp(Buffer.from(splashSvg))
    .resize(1242, 2688)
    .png()
    .toFile(path.join(mobileAssetsDir, 'splash.png'));
  console.log('✅ Generated mobile/assets/splash.png (1242x2688)');

  // 4. Generate Web Header Logo PNG
  await sharp(Buffer.from(headerLogoSvg))
    .resize(460, 90)
    .png()
    .toFile(path.join(publicImgDir, 'logo.png'));
  console.log('✅ Generated public/img/logo.png');

  // 5. Generate Favicon PNG/ICO
  await sharp(Buffer.from(faviconSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  
  // Also copy to favicon.ico
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✅ Generated public/favicon.ico & public/favicon.png');

  console.log('🎉 All brand assets generated successfully!');
}

generateAssets().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
