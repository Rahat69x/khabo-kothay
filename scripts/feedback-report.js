import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function generateFeedbackReport(feedbackFilePath) {
  const file = feedbackFilePath || path.join(rootDir, 'server', 'data', 'feedback.jsonl');

  if (!fs.existsSync(file)) {
    console.log('No feedback records found yet at:', path.relative(rootDir, file));
    return { count: 0 };
  }

  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  const records = lines.map(l => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter(Boolean);

  console.log('====================================================');
  console.log('         TESTER FEEDBACK ANALYTICS REPORT           ');
  console.log('====================================================\n');

  console.log(`Total Responses Collected: ${records.length}`);
  if (records.length === 0) return { count: 0 };

  const yesCount = records.filter(r => r.answer === 'Yes').length;
  const noCount = records.filter(r => r.answer === 'No').length;
  const unsureCount = records.filter(r => r.answer === 'Not sure').length;

  console.log(`Overall Top-Pick Acceptance Rate: ${((yesCount / records.length) * 100).toFixed(1)}%`);
  console.log(`  - Yes: ${yesCount} (${((yesCount / records.length) * 100).toFixed(1)}%)`);
  console.log(`  - No: ${noCount} (${((noCount / records.length) * 100).toFixed(1)}%)`);
  console.log(`  - Not sure: ${unsureCount} (${((unsureCount / records.length) * 100).toFixed(1)}%)\n`);

  // Acceptance by Area
  console.log('--- Acceptance by Area ---');
  const byArea = {};
  records.forEach(r => {
    const area = r.areaName || 'Unknown';
    if (!byArea[area]) byArea[area] = { total: 0, yes: 0 };
    byArea[area].total++;
    if (r.answer === 'Yes') byArea[area].yes++;
  });
  for (const [area, s] of Object.entries(byArea)) {
    const pct = ((s.yes / s.total) * 100).toFixed(1);
    console.log(`  • ${area.padEnd(20)}: ${pct}% (${s.yes}/${s.total})`);
  }

  // Acceptance by Cuisine
  console.log('\n--- Acceptance by Cuisine ---');
  const byCuisine = {};
  records.forEach(r => {
    const c = r.cuisine || 'All';
    if (!byCuisine[c]) byCuisine[c] = { total: 0, yes: 0 };
    byCuisine[c].total++;
    if (r.answer === 'Yes') byCuisine[c].yes++;
  });
  for (const [c, s] of Object.entries(byCuisine)) {
    const pct = ((s.yes / s.total) * 100).toFixed(1);
    console.log(`  • ${c.padEnd(16)}: ${pct}% (${s.yes}/${s.total})`);
  }

  // Acceptance by Priority
  console.log('\n--- Acceptance by Priority ---');
  const byPriority = {};
  records.forEach(r => {
    const p = r.priority || 'Best Overall';
    if (!byPriority[p]) byPriority[p] = { total: 0, yes: 0 };
    byPriority[p].total++;
    if (r.answer === 'Yes') byPriority[p].yes++;
  });
  for (const [p, s] of Object.entries(byPriority)) {
    const pct = ((s.yes / s.total) * 100).toFixed(1);
    console.log(`  • ${p.padEnd(18)}: ${pct}% (${s.yes}/${s.total})`);
  }

  // Common Reasons
  console.log('\n--- Common Feedback Reasons / Keywords ---');
  const reasons = records.filter(r => r.reason).map(r => r.reason);
  if (reasons.length === 0) {
    console.log('  (No text reasons recorded yet)');
  } else {
    reasons.slice(0, 5).forEach((re, i) => {
      console.log(`  ${i + 1}. "${re}"`);
    });
  }

  // 10 Most Recent "No" cases
  console.log('\n--- 10 Most Recent "No" Cases ---');
  const noCases = records.filter(r => r.answer === 'No').slice(-10).reverse();
  if (noCases.length === 0) {
    console.log('  None recorded.');
  } else {
    noCases.forEach((nc, i) => {
      console.log(`  [${i + 1}] Area: ${nc.areaName} | Cuisine: ${nc.cuisine} | Priority: ${nc.priority} | Reason: "${nc.reason || 'None provided'}"`);
    });
  }

  console.log('\n====================================================\n');
  return { count: records.length, yesCount, noCount };
}

if (process.argv[1] && process.argv[1].endsWith('feedback-report.js')) {
  generateFeedbackReport();
}
