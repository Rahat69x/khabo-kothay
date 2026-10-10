import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1IqB-z_mpcQlKE4fgXzq5ZukaP2k9QTnu';
const DEFAULT_DOWNLOAD_URL = 'http://localhost:3000/download';

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function generateQrPng({
  url = DEFAULT_DOWNLOAD_URL,
  outputPath,
  title = 'KHABO KOTHAY?',
  subtitle = 'Scan to Open Android APK Download Page',
  badge = 'Version 1.1.0 • ~61 MB • Android 8.0+'
}) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeBadge = escapeXml(badge);

  // Generate high-resolution QR matrix as SVG
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H', // High error correction so center logo doesn't disrupt reading
    margin: 2,
    color: {
      dark: '#171717',
      light: '#FFFFFF'
    }
  });

  // Convert QR SVG into PNG buffer (640x640)
  const qrBuffer = await sharp(Buffer.from(qrSvg))
    .resize(640, 640)
    .png()
    .toBuffer();

  // Create center icon badge (130x130) with white border and rounded corners
  const iconSvgPath = path.join(rootDir, 'public', 'img', 'icon.svg');
  let iconBuffer;
  if (fs.existsSync(iconSvgPath)) {
    const rawIcon = fs.readFileSync(iconSvgPath);
    iconBuffer = await sharp(rawIcon)
      .resize(130, 130)
      .composite([
        {
          input: Buffer.from(`
            <svg width="130" height="130">
              <rect x="0" y="0" width="130" height="130" rx="28" fill="none" stroke="#FFFFFF" stroke-width="8"/>
              <rect x="4" y="4" width="122" height="122" rx="24" fill="none" stroke="#FF5722" stroke-width="4"/>
            </svg>
          `),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();
  }

  // Composite QR code with center logo
  const composites = [];
  if (iconBuffer) {
    composites.push({
      input: iconBuffer,
      top: Math.round((640 - 130) / 2),
      left: Math.round((640 - 130) / 2)
    });
  }

  const qrWithLogo = await sharp(qrBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  // Now create the complete branded presentation card (960 x 1200)
  const cardSvg = `
  <svg width="960" height="1200" viewBox="0 0 960 1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FBF9F5"/>
        <stop offset="100%" stop-color="#F2EDE4"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.08"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="960" height="1200" rx="36" fill="url(#bgGrad)"/>
    <rect x="1.5" y="1.5" width="957" height="1197" rx="34.5" fill="none" stroke="#E5DEC9" stroke-width="3"/>

    <!-- Header Section -->
    <g transform="translate(80, 80)">
      <rect x="0" y="0" width="800" height="96" rx="20" fill="#171717"/>
      <circle cx="48" cy="48" r="18" fill="#FF5722"/>
      <text x="80" y="46" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" letter-spacing="1">KHABO KOTHAY?</text>
      <text x="80" y="74" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="16" fill="#F8F7F4" opacity="0.8">খাবো কোথায়? • Android App Release</text>
    </g>

    <!-- Title & Instructions -->
    <text x="480" y="240" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="34" fill="#171717">${safeTitle}</text>
    <text x="480" y="280" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="20" fill="#666159">${safeSubtitle}</text>

    <!-- White Inner QR Card -->
    <rect x="130" y="320" width="700" height="700" rx="32" fill="#FFFFFF" filter="url(#shadow)"/>
    <rect x="130" y="320" width="700" height="700" rx="32" fill="none" stroke="#ECE6D9" stroke-width="2"/>

    <!-- Badges & Footer below QR -->
    <g transform="translate(480, 1060)">
      <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#FF5722" fill-opacity="0.12"/>
      <text x="0" y="6" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="16" fill="#BF360C">${safeBadge}</text>
    </g>

    <text x="480" y="1125" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="15" fill="#8C8476">Point phone camera to scan • Google Drive &amp; Direct Server Download</text>
  </svg>
  `;

  const finalCard = await sharp(Buffer.from(cardSvg))
    .composite([
      {
        input: qrWithLogo,
        top: 350,
        left: 160
      }
    ])
    .png()
    .toBuffer();

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, finalCard);
  }

  return finalCard;
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const downloadQrPath = path.join(rootDir, 'public', 'downloads', 'khabo-kothay-qr.png');
  const driveQrPath = path.join(rootDir, 'public', 'downloads', 'khabo-kothay-drive-qr.png');
  const imgQrPath = path.join(rootDir, 'public', 'img', 'qr-download.png');
  const artifactPath = path.join('C:\\Users\\Rahat\\.gemini\\antigravity-ide\\brain\\c5ecb402-014e-4b1c-8194-b12e61e13568', 'khabo_kothay_apk_qr.png');

  console.log('Generating branded QR code cards...');

  // 1. Download Page QR
  await generateQrPng({
    url: 'http://localhost:3000/download',
    outputPath: downloadQrPath,
    title: 'Scan to Open Download Page',
    subtitle: 'Point camera to open mobile APK installer page',
    badge: 'Khabo Kothay? v1.1.0 • ~61 MB • Android 8.0+'
  });
  console.log('✓ Generated:', downloadQrPath);

  // 2. Drive Direct Folder QR
  await generateQrPng({
    url: DRIVE_FOLDER_URL,
    outputPath: driveQrPath,
    title: 'Scan for Google Drive APK',
    subtitle: 'Opens Google Drive Cloud Folder Directly',
    badge: 'Google Drive Official Host • Safe & Verified'
  });
  console.log('✓ Generated:', driveQrPath);

  // 3. Copy to public/img and artifacts
  fs.copyFileSync(downloadQrPath, imgQrPath);
  console.log('✓ Copied to:', imgQrPath);

  if (fs.existsSync(path.dirname(artifactPath))) {
    fs.copyFileSync(downloadQrPath, artifactPath);
    console.log('✓ Copied to artifacts:', artifactPath);
  }

  // Also raw QR codes without card wrapper
  const rawQrBuf = await QRCode.toBuffer(DEFAULT_DOWNLOAD_URL, {
    width: 512,
    margin: 1,
    color: { dark: '#171717', light: '#FFFFFF' }
  });
  fs.writeFileSync(path.join(rootDir, 'public', 'downloads', 'qr-code-raw.png'), rawQrBuf);
  console.log('✓ Generated raw QR code PNG');
}
