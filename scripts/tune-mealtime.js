#!/usr/bin/env node
/**
 * scripts/tune-mealtime.js
 * Analyzes anonymous meal-time feedback logs and suggests updated wait and eating times.
 * Computes median actual durations per (mode, venueType) when at least 5 records exist.
 * Writes suggestions to config/mealtime.suggested.json without overwriting live config.
 */

import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE = path.resolve('server', 'data', 'mealtime-feedback.jsonl');
const CONFIG_FILE = path.resolve('config', 'mealtime.json');
const SUGGESTED_FILE = path.resolve('config', 'mealtime.suggested.json');

function computeMedian(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function tuneMealTimeFromLogs() {
  console.log('--- Meal-Time Benchmarks Tuning ---');

  if (!fs.existsSync(FEEDBACK_FILE)) {
    console.log(`No feedback records found at ${FEEDBACK_FILE}. Using baseline config.`);
    return null;
  }

  const rawLines = fs.readFileSync(FEEDBACK_FILE, 'utf8')
    .split('\n')
    .filter(l => l.trim().length > 0);

  if (rawLines.length === 0) {
    console.log('Feedback file is empty. No tuning performed.');
    return null;
  }

  const records = [];
  for (const line of rawLines) {
    try {
      records.push(JSON.parse(line));
    } catch (e) {}
  }

  console.log(`Total feedback records parsed: ${records.length}`);

  // Group by mode + venueType
  const groups = new Map();
  for (const r of records) {
    const key = `${r.mode || 'lunch'}::${r.venueType || 'quick-service'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(r);
  }

  const baseConfig = fs.existsSync(CONFIG_FILE)
    ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    : { venueTypeMatrix: {} };

  const suggestedConfig = JSON.parse(JSON.stringify(baseConfig));
  if (!suggestedConfig.suggestedAdjustments) {
    suggestedConfig.suggestedAdjustments = {};
  }

  let tunedCount = 0;
  for (const [key, groupRecords] of groups.entries()) {
    const [mode, venueType] = key.split('::');
    if (groupRecords.length < 5) {
      console.log(`[SKIP] ${mode} / ${venueType}: Only ${groupRecords.length} records (< 5 threshold).`);
      continue;
    }

    const actualTotals = groupRecords.map(r => r.actualMinutes);
    const medianTotal = computeMedian(actualTotals);
    const lateCount = groupRecords.filter(r => r.wasLate).length;
    const lateRate = Number(((lateCount / groupRecords.length) * 100).toFixed(1));

    console.log(`[TUNE] ${mode} / ${venueType} (${groupRecords.length} records): Median total = ${medianTotal} min, Late rate = ${lateRate}%`);

    suggestedConfig.suggestedAdjustments[key] = {
      mode,
      venueType,
      sampleSize: groupRecords.length,
      medianTotalMinutes: medianTotal,
      lateRatePercent: lateRate,
      suggestedWaitMinutes: Math.max(3, Math.round(medianTotal * 0.25)),
      suggestedEatMinutes: Math.max(10, Math.round(medianTotal * 0.75))
    };
    tunedCount++;
  }

  fs.writeFileSync(SUGGESTED_FILE, JSON.stringify(suggestedConfig, null, 2), 'utf8');
  console.log(`\n✓ Suggested benchmarks written to: ${SUGGESTED_FILE}`);
  console.log(`Tuned groups: ${tunedCount}. Live config ${CONFIG_FILE} remains untouched.`);

  return suggestedConfig;
}

if (process.argv[1] && process.argv[1].endsWith('tune-mealtime.js')) {
  tuneMealTimeFromLogs();
}
