import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const webFontsDir = path.join(rootDir, 'public', 'fonts');
const mobileFontsDir = path.join(rootDir, 'mobile', 'assets', 'fonts');

fs.mkdirSync(webFontsDir, { recursive: true });
fs.mkdirSync(mobileFontsDir, { recursive: true });

const fonts = [
  {
    name: 'PlusJakartaSans-Bold.ttf',
    url: 'https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf'
  },
  {
    name: 'Inter-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf'
  },
  {
    name: 'Inter-SemiBold.ttf',
    url: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf'
  },
  {
    name: 'NotoSansBengali-Regular.ttf',
    url: 'https://fonts.gstatic.com/s/notosansbengali/v33/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6KmsolLudA.ttf'
  },
  {
    name: 'NotoSansBengali-Bold.ttf',
    url: 'https://fonts.gstatic.com/s/notosansbengali/v33/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6Kmsm5MudA.ttf'
  }
];

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('Downloading fonts for web self-hosting and mobile bundling...');
  for (const f of fonts) {
    const webDest = path.join(webFontsDir, f.name);
    const mobileDest = path.join(mobileFontsDir, f.name);
    try {
      console.log(`Downloading ${f.name}...`);
      await downloadFile(f.url, webDest);
      fs.copyFileSync(webDest, mobileDest);
      console.log(`✓ Saved ${f.name} to web and mobile font directories.`);
    } catch (err) {
      console.error(`Failed to download ${f.name}:`, err.message);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
