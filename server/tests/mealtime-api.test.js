import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../routes/api.js';
import featureFlags from '../config/featureFlags.js';
import { tuneMealTimeFromLogs } from '../../scripts/tune-mealtime.js';
import fs from 'fs';
import path from 'path';
import { dataFile } from '../config/paths.js';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

describe('Meal-Time Mode API Integration', () => {
  beforeEach(() => {
    featureFlags.mealTimeMode = true;
  });

  it('POST /api/v1/meal-time/search returns ranked time-feasible candidates', async () => {
    const leaveAt = new Date('2026-10-10T13:00:00+06:00'); // 1:00 PM lunch

    const res = await request(app)
      .post('/api/v1/meal-time/search')
      .send({
        mode: 'lunch',
        availableMinutes: 45,
        leaveAt: leaveAt.toISOString(),
        origin: { lat: 23.7785, lng: 90.4178, name: 'Gulshan 1' },
        destination: 'same-as-origin',
        transport: 'car',
        diningStyle: 'dine_in',
        bufferPreference: 'Balanced'
      });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.feasibleCount).toBeGreaterThan(0);
    expect(res.body.results.length).toBeGreaterThan(0);

    const top = res.body.results[0];
    expect(top.timeBreakdown).toBeDefined();
    expect(top.timeBreakdown.total).toBeLessThanOrEqual(45);
    expect(top.status).toBe('SAFE');
    expect(top.backByTime).toBeDefined();
    expect(top.reasons).toBeInstanceOf(Array);
    expect(top.flags).toContain('Waiting time estimated');
  });

  it('POST /api/v1/meal-time/search rejects public transport with friendly message', async () => {
    const res = await request(app)
      .post('/api/v1/meal-time/search')
      .send({
        mode: 'lunch',
        availableMinutes: 45,
        origin: { lat: 23.7785, lng: 90.4178 },
        transport: 'public_transport'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Public transport times aren't available here");
    expect(res.body.suggestedTransport).toEqual(['rickshaw', 'cng']);
  });

  it('POST /api/v1/meal-time/search validates availableMinutes range', async () => {
    const res = await request(app)
      .post('/api/v1/meal-time/search')
      .send({
        mode: 'lunch',
        availableMinutes: 5 // Less than minimum 15 min
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('availableMinutes must be a number between 15 and 360');
  });

  it('POST /api/v1/meal-time/search respects feature flag mealTimeMode', async () => {
    featureFlags.mealTimeMode = false;
    const res = await request(app)
      .post('/api/v1/meal-time/search')
      .send({
        mode: 'lunch',
        availableMinutes: 45
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Meal-Time Mode feature is currently disabled');
    featureFlags.mealTimeMode = true;
  });

  it('POST /api/v1/meal-time/feedback records anonymous feedback record', async () => {
    const res = await request(app)
      .post('/api/v1/meal-time/feedback')
      .send({
        mode: 'lunch',
        venueType: 'quick-service',
        plannedMinutes: 45,
        actualMinutes: 42,
        wasLate: false,
        rating: 5
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const feedbackFile = dataFile('mealtime-feedback.jsonl');
    expect(fs.existsSync(feedbackFile)).toBe(true);
  });

  it('scripts/tune-mealtime.js processes feedback and writes suggested adjustments', () => {
    const feedbackFile = dataFile('mealtime-feedback.jsonl');
    // Ensure at least 5 sample records for tuning
    const samples = [
      { timestamp: new Date().toISOString(), mode: 'lunch', venueType: 'quick-service', plannedMinutes: 45, actualMinutes: 40, wasLate: false },
      { timestamp: new Date().toISOString(), mode: 'lunch', venueType: 'quick-service', plannedMinutes: 45, actualMinutes: 42, wasLate: false },
      { timestamp: new Date().toISOString(), mode: 'lunch', venueType: 'quick-service', plannedMinutes: 45, actualMinutes: 44, wasLate: false },
      { timestamp: new Date().toISOString(), mode: 'lunch', venueType: 'quick-service', plannedMinutes: 45, actualMinutes: 46, wasLate: true },
      { timestamp: new Date().toISOString(), mode: 'lunch', venueType: 'quick-service', plannedMinutes: 45, actualMinutes: 43, wasLate: false }
    ];
    fs.mkdirSync(path.dirname(feedbackFile), { recursive: true });
    fs.writeFileSync(feedbackFile, samples.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf8');

    const suggested = tuneMealTimeFromLogs();
    expect(suggested).toBeDefined();
    expect(suggested.suggestedAdjustments['lunch::quick-service']).toBeDefined();
    expect(suggested.suggestedAdjustments['lunch::quick-service'].sampleSize).toBe(5);
    expect(suggested.suggestedAdjustments['lunch::quick-service'].medianTotalMinutes).toBe(43);
  });
});
