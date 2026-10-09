import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// App code directories to inspect
const scanDirs = [
  path.join(rootDir, 'mobile', 'src'),
  path.join(rootDir, 'public', 'js'),
  path.join(rootDir, 'public', 'css')
];

// Exclude auto-generated and theme configuration files
const excludedFiles = [
  path.normalize(path.join(rootDir, 'mobile', 'src', 'config', 'theme.generated.js')),
  path.normalize(path.join(rootDir, 'mobile', 'src', 'config', 'theme.js')),
  path.normalize(path.join(rootDir, 'public', 'css', 'theme.css'))
];

// Regex to detect raw hex colors (e.g. #FFF, #123456, #12345678)
// Avoid false positives like anchor links (e.g. href="#results") or comments
const hexColorRegex = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function checkNoRawColors() {
  let filesToScan = [];
  for (const dir of scanDirs) {
    filesToScan = filesToScan.concat(getFilesRecursively(dir));
  }

  // Filter for js and css files, ignoring generated ones
  filesToScan = filesToScan.filter(filePath => {
    const norm = path.normalize(filePath);
    if (excludedFiles.includes(norm)) return false;
    return norm.endsWith('.js') || norm.endsWith('.jsx') || norm.endsWith('.css');
  });

  let violations = [];

  for (const file of filesToScan) {
    const relativePath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Ignore comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

      const matches = line.match(hexColorRegex);
      if (matches) {
        // Filter out non-color tokens if any (like url fragments)
        matches.forEach(match => {
          violations.push({
            file: relativePath,
            line: index + 1,
            hex: match,
            snippet: trimmed
          });
        });
      }
    });
  }

  console.log(`\n--- Auditing Raw Hex Colors in App Code ---`);
  console.log(`Scanned ${filesToScan.length} app source files.`);

  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} raw hex color violation(s) in app code:`);
    violations.slice(0, 30).forEach(v => {
      console.error(`  - ${v.file}:${v.line} -> found "${v.hex}" in: ${v.snippet}`);
    });
    if (violations.length > 30) {
      console.error(`  ... and ${violations.length - 30} more violations.`);
    }
    console.error(`\nPlease use theme tokens or CSS variables instead of raw hex colors.`);
    process.exit(1);
  }

  console.log(`✅ Zero raw hex colors found in app source code! All styles utilize theme tokens.\n`);
}

checkNoRawColors();
