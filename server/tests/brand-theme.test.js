import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

describe('Brand Theme Quality Checks (Automated)', () => {
  it('passes scripts/check-contrast.js WCAG contrast checks with 0 failures', () => {
    const stdout = execSync('node scripts/check-contrast.js', { cwd: rootDir, encoding: 'utf8' });
    expect(stdout).toContain('All 32 contrast checks PASSED successfully!');
    expect(stdout).not.toContain('[FAIL]');
  });

  it('passes scripts/check-no-raw-colors.js with 0 raw hex violations in app code', () => {
    const stdout = execSync('node scripts/check-no-raw-colors.js', { cwd: rootDir, encoding: 'utf8' });
    expect(stdout).toContain('Zero raw hex colors found in app source code!');
    expect(stdout).not.toContain('FAIL:');
  });

  it('validates /brand/tokens.json single source of truth structure', () => {
    const tokensPath = path.join(rootDir, 'brand', 'tokens.json');
    expect(fs.existsSync(tokensPath)).toBe(true);

    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    expect(tokens.light).toBeDefined();
    expect(tokens.dark).toBeDefined();

    // Check light tokens
    expect(tokens.light.primary).toBe('#3B3FA8');
    expect(tokens.light.accent).toBe('#FFB020');
    expect(tokens.light.accentStrong).toBe('#8A5200');
    expect(tokens.light.bg).toBe('#F6F6FB');
    expect(tokens.light.surface).toBe('#FFFFFF');
    expect(tokens.light.ink).toBe('#16183A');

    // Check dark tokens
    expect(tokens.dark.primary).toBe('#8B90F0');
    expect(tokens.dark.accent).toBe('#FFB020');
    expect(tokens.dark.bg).toBe('#11122B');
    expect(tokens.dark.surface).toBe('#1B1D45');
    expect(tokens.dark.ink).toBe('#ECECFA');
  });

  it('validates /brand/map-style-dark.json exists and is valid GeoJSON/Google Maps style', () => {
    const mapStylePath = path.join(rootDir, 'brand', 'map-style-dark.json');
    expect(fs.existsSync(mapStylePath)).toBe(true);

    const mapStyles = JSON.parse(fs.readFileSync(mapStylePath, 'utf8'));
    expect(Array.isArray(mapStyles)).toBe(true);
    expect(mapStyles.length).toBeGreaterThan(0);
  });

  it('ensures generated theme files exist and are not empty', () => {
    const cssPath = path.join(rootDir, 'public', 'css', 'theme.css');
    const mobileThemePath = path.join(rootDir, 'mobile', 'src', 'config', 'theme.generated.js');

    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(mobileThemePath)).toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    expect(cssContent).toContain('--color-primary: #3B3FA8;');
    expect(cssContent).toContain('[data-theme="dark"]');
    expect(cssContent).toContain('@media (prefers-color-scheme: dark)');

    const mobileThemeContent = fs.readFileSync(mobileThemePath, 'utf8');
    expect(mobileThemeContent).toContain('export const lightTheme');
    expect(mobileThemeContent).toContain('export const darkTheme');
  });

  it('ensures all brand logo assets exist', () => {
    const files = [
      'brand/logo/wordmark-light.svg',
      'brand/logo/wordmark-dark.svg',
      'brand/logo/wordmark-on-indigo.svg',
      'brand/logo/icon.svg',
      'brand/logo/adaptive-foreground.svg',
      'brand/logo/adaptive-monochrome.svg',
      'mobile/assets/icon.png',
      'mobile/assets/adaptive-icon.png',
      'mobile/assets/adaptive-icon-background.png',
      'mobile/assets/adaptive-icon-monochrome.png',
      'mobile/assets/notification-icon.png',
      'mobile/assets/splash.png',
      'mobile/assets/splash-dark.png',
      'public/favicon.svg',
      'public/favicon.ico',
      'public/apple-touch-icon.png',
      'public/img/logo.svg',
      'public/img/logo-dark.svg',
      'public/img/wordmark-on-indigo.svg',
      'public/img/social-card.png',
      'docs/play-store-assets/icon-512.png',
      'docs/play-store-assets/feature-graphic-1024x500.png'
    ];

    for (const f of files) {
      const fullPath = path.join(rootDir, f);
      expect(fs.existsSync(fullPath), `Asset should exist: ${f}`).toBe(true);
    }
  });
});
