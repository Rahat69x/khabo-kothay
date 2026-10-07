import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { tuneFares } from '../../scripts/tune-fares.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

describe('Fare Tuning Utility (scripts/tune-fares.js)', () => {
  it('tunes base and per-km rates accurately from sample fare log', () => {
    const csvPath = path.join(rootDir, 'docs', 'fare-log.csv');
    const outPath = path.join(rootDir, 'config', 'fares.suggested.json');

    const result = tuneFares(csvPath, outPath);

    expect(result).toBeDefined();
    expect(result.report).toBeDefined();
    expect(result.suggestedConfig).toBeDefined();

    // Check modes present in fare-log.csv
    expect(result.report.rickshaw).toBeDefined();
    expect(result.report.cng).toBeDefined();
    expect(result.report.car).toBeDefined();

    expect(result.report.rickshaw.sampleCount).toBeGreaterThanOrEqual(5);
    expect(result.report.cng.sampleCount).toBeGreaterThanOrEqual(5);
    expect(result.report.car.sampleCount).toBeGreaterThanOrEqual(5);

    expect(result.report.rickshaw.suggestedPerKm).toBeGreaterThan(0);
    expect(result.report.cng.suggestedPerKm).toBeGreaterThan(0);
    expect(result.report.car.suggestedPerKm).toBeGreaterThan(0);

    // Verify output file exists
    expect(fs.existsSync(outPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(saved.rickshaw.perKm).toBe(result.report.rickshaw.suggestedPerKm);
  });
});
