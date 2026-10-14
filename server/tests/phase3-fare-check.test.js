import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../routes/api.js';
import { getDistanceBand, estimateFareRange, compareFareQuote, addFareReport } from '../services/fare-check.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Phase 3: Fare — F2 Fare Check & Estimation Service', () => {
  describe('Distance Banding & Calculations', () => {
    it('classifies trips into distance bands correctly', () => {
      expect(getDistanceBand(1.0)).toBe('short');
      expect(getDistanceBand(2.5)).toBe('medium');
      expect(getDistanceBand(5.0)).toBe('medium_long');
      expect(getDistanceBand(12.0)).toBe('long');
    });

    it('estimates reference range for a 1.5 km rickshaw trip in Gulshan', () => {
      const estimate = estimateFareRange({
        origin: 'Gulshan 1',
        destination: 'Gulshan 2',
        transportType: 'rickshaw',
        distanceKm: 1.8
      });

      expect(estimate.hasEstimate).toBe(true);
      expect(estimate.transportType).toBe('rickshaw');
      expect(estimate.estimatedLowerBound).toBeGreaterThan(0);
      expect(estimate.estimatedUpperBound).toBeGreaterThanOrEqual(estimate.estimatedLowerBound);
      expect(estimate.disclaimer).toContain('estimate');
    });

    it('estimates reference range for a 8.5 km CNG trip', () => {
      const estimate = estimateFareRange({
        origin: 'Gulshan 2',
        destination: 'Dhanmondi',
        transportType: 'cng',
        distanceKm: 8.5
      });

      expect(estimate.hasEstimate).toBe(true);
      expect(estimate.transportType).toBe('cng');
      expect(estimate.estimatedLowerBound).toBeGreaterThanOrEqual(150);
      expect(estimate.estimatedUpperBound).toBeLessThanOrEqual(400);
    });
  });

  describe('Quote Comparison Logic', () => {
    const mockEstimate = {
      hasEstimate: true,
      estimatedLowerBound: 40,
      estimatedMedian: 50,
      estimatedUpperBound: 60
    };

    it('identifies quote below reference range', () => {
      const comp = compareFareQuote({ quoteBdt: 30, estimate: mockEstimate });
      expect(comp.comparison).toBe('BELOW_RANGE');
      expect(comp.message).toContain('below');
      expect(comp.difference).toBe(10);
    });

    it('identifies quote within reference range', () => {
      const comp = compareFareQuote({ quoteBdt: 50, estimate: mockEstimate });
      expect(comp.comparison).toBe('WITHIN_RANGE');
      expect(comp.message).toContain('falls within');
      expect(comp.difference).toBe(0);
    });

    it('identifies quote above reference range', () => {
      const comp = compareFareQuote({ quoteBdt: 80, estimate: mockEstimate });
      expect(comp.comparison).toBe('ABOVE_RANGE');
      expect(comp.message).toContain('above');
      expect(comp.difference).toBe(20);
    });
  });

  describe('Community Fare Report Submission & Validation', () => {
    it('accepts valid fare report via POST /api/fare-reports', async () => {
      const res = await request(app)
        .post('/api/fare-reports')
        .send({
          origin: `Banani-${Date.now()}`,
          destination: 'Baridhara',
          transportType: 'rickshaw',
          fareBdt: 55,
          distanceKm: 2.1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toHaveProperty('id');
    });

    it('rejects duplicate report submitted within 10 minutes', async () => {
      const payload = {
        origin: `UniqueOriginA-${Date.now()}`,
        destination: 'UniqueDestB',
        transportType: 'cng',
        fareBdt: 200,
        distanceKm: 5.0
      };

      const res1 = await request(app).post('/api/fare-reports').send(payload);
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/api/fare-reports').send(payload);
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('Duplicate report');
    });

    it('rejects invalid transport types and absurd fares', () => {
      expect(() => addFareReport({ transportType: 'helicopter', fareBdt: 50, origin: 'A', destination: 'B' }))
        .toThrow('Invalid transportType');

      expect(() => addFareReport({ transportType: 'rickshaw', fareBdt: 5, origin: 'A', destination: 'B' }))
        .toThrow('Fare must be between 10 and 2000 BDT');
    });
  });
});
