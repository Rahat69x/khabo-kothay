import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function tuneFares(csvFilePath, outputJsonPath) {
  const csvFile = csvFilePath || path.join(rootDir, 'docs', 'fare-log.csv');
  const outFile = outputJsonPath || path.join(rootDir, 'config', 'fares.suggested.json');

  if (!fs.existsSync(csvFile)) {
    throw new Error(`Fare log file not found at: ${csvFile}`);
  }

  const raw = fs.readFileSync(csvFile, 'utf8').trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return { tuned: {}, count: 0 };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim());
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = parts[i];
    });
    return obj;
  });

  // Group by mode
  const byMode = {};
  rows.forEach(r => {
    const mode = (r.mode || '').toLowerCase();
    if (!mode) return;
    if (!byMode[mode]) byMode[mode] = [];
    byMode[mode].push({
      distance: parseFloat(r.distance_km) || 0,
      minutes: parseFloat(r.minutes) || 0,
      fare: parseFloat(r.fare_paid_bdt) || 0
    });
  });

  const baseConfigPath = path.join(rootDir, 'server', 'config', 'fares.json');
  const existingConfig = fs.existsSync(baseConfigPath)
    ? JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'))
    : {};

  const suggestedConfig = JSON.parse(JSON.stringify(existingConfig));
  const report = {};

  console.log('\n--- Real Fare Tuning (Least Squares Regression) ---');

  for (const [mode, entries] of Object.entries(byMode)) {
    if (entries.length < 5) {
      console.log(`Skipping mode "${mode}": only ${entries.length} rows (minimum 5 required)`);
      continue;
    }

    // Least Squares fit for fare = a + b * distance
    // n*sum(xy) - sum(x)*sum(y) / (n*sum(x^2) - (sum(x))^2)
    const n = entries.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    entries.forEach(e => {
      sumX += e.distance;
      sumY += e.fare;
      sumXY += e.distance * e.fare;
      sumXX += e.distance * e.distance;
    });

    const denom = n * sumXX - sumX * sumX;
    let perKm = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 20;
    let baseFare = (sumY - perKm * sumX) / n;

    // Constrain baseFare >= 0
    if (baseFare < 0) {
      baseFare = 0;
      perKm = sumXY / sumXX;
    }

    const roundedBase = Math.round(baseFare);
    const roundedPerKm = Math.round(perKm);

    // Compute Mean Absolute Error
    let totalError = 0;
    entries.forEach(e => {
      const pred = roundedBase + roundedPerKm * e.distance;
      totalError += Math.abs(pred - e.fare);
    });
    const avgError = (totalError / n).toFixed(1);

    if (!suggestedConfig[mode]) {
      suggestedConfig[mode] = { name: mode };
    }
    suggestedConfig[mode].baseFare = roundedBase;
    suggestedConfig[mode].perKm = roundedPerKm;

    report[mode] = {
      sampleCount: n,
      suggestedBaseFare: roundedBase,
      suggestedPerKm: roundedPerKm,
      meanAbsoluteErrorBdt: avgError
    };

    console.log(`✓ Mode: [${mode}] (${n} rides) -> Base Fare: ৳${roundedBase}, Per Km: ৳${roundedPerKm} | Avg Error: ±৳${avgError}`);
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(suggestedConfig, null, 2), 'utf8');
  console.log(`\nWritten suggested parameters to: ${path.relative(rootDir, outFile)}`);

  return { report, suggestedConfig };
}

if (process.argv[1] && process.argv[1].endsWith('tune-fares.js')) {
  try {
    tuneFares();
  } catch (e) {
    console.error('Fare tuning error:', e.message);
  }
}
