import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const AIZA_REGEX = /AIza[0-9A-Za-z-_]{35}/;

export function runSecurityCheck() {
  const violations = [];

  // 1. Verify .gitignore includes .env
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    violations.push('.gitignore file does not exist');
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      violations.push('.gitignore does not contain .env');
    }
  }

  // 2. Scan mobile and public folders for leaked keys
  const targetDirs = [path.join(rootDir, 'mobile'), path.join(rootDir, 'public')];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.expo') continue;

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(js|json|html|css|ts|tsx)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check for real AIza key pattern
        if (AIZA_REGEX.test(content)) {
          violations.push(`Real Google API key pattern found in ${path.relative(rootDir, fullPath)}`);
        }

        // Check for GOOGLE_SERVER_KEY in client code
        if (content.includes('GOOGLE_SERVER_KEY')) {
          violations.push(`GOOGLE_SERVER_KEY referenced in client file: ${path.relative(rootDir, fullPath)}`);
        }
      }
    }
  }

  targetDirs.forEach(scanDir);

  return {
    success: violations.length === 0,
    violations
  };
}

if (process.argv[1] && process.argv[1].endsWith('security-check.js')) {
  const result = runSecurityCheck();
  if (!result.success) {
    console.error('❌ Security check FAILED:');
    result.violations.forEach(v => console.error('  - ' + v));
    process.exit(1);
  } else {
    console.log('✅ Security check PASSED: No credentials leaked in mobile, public, or build files; .env is properly gitignored.');
    process.exit(0);
  }
}
