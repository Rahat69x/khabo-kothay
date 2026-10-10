import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import quotaManager from '../services/quota.js';
import globalCache from '../services/cache.js';

describe('P1 Operations, Contract & Cost Control Integration', () => {
  beforeEach(() => {
    quotaManager.resetDailyUsage();
    quotaManager.setKillSwitch(false);
  });

  describe('API Versioning (/api/v1) and Probes', () => {
    it('GET /api/v1/health returns liveness probe and X-Request-Id header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe('ok');
      expect(res.body.app).toBe('Khabo Kothay?');
      expect(res.body.version).toBe('1.1.0');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('GET /health (root level) returns 200 liveness', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.app).toBe('Khabo Kothay?');
    });

    it('GET /api/v1/ready returns readiness probe with cache, engine and budget checks', async () => {
      const res = await request(app).get('/api/v1/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.checks.cache).toBe('ok');
      expect(res.body.checks.engine).toBe('ok');
    });

    it('GET /ready (root level) returns 200 readiness', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });

    it('Preserves custom incoming X-Request-Id header in response', async () => {
      const customId = 'client-req-uuid-12345';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', customId);
      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Internal Admin Usage Counter', () => {
    it('GET /api/v1/admin/usage returns breakdown by endpoint, cache statistics, and budget', async () => {
      // Trigger a request first to increment counters
      await request(app).get('/api/v1/health');

      const res = await request(app).get('/api/v1/admin/usage');
      expect(res.status).toBe(200);
      expect(typeof res.body.totalRequests).toBe('number');
      expect(res.body.currentMonth).toBeDefined();
      expect(res.body.currentMonth.budget).toBeGreaterThan(0);
      expect(res.body.cache).toBeDefined();
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('Per-Device Daily Search Limit & Cost Control', () => {
    it('enforces 429 when a client exceeds its daily search limit', async () => {
      // Quota is keyed by client IP; supertest connects over loopback
      for (const ip of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
        for (let i = 0; i < 50; i++) {
          quotaManager.checkAndRecordDeviceSearch(ip);
        }
      }

      try {
        // A fresh X-Device-Id must not reset the quota
        const res = await request(app)
          .post('/api/v1/recommend')
          .set('X-Device-Id', 'fresh-device-id-to-bypass-quota')
          .send({
            lat: 23.7925,
            lng: 90.4150,
            cuisine: 'All',
            priority: 'Best Overall'
          });

        expect(res.status).toBe(429);
        expect(res.body.error).toContain('Daily search limit reached');
        expect(res.body.limit).toBe(50);
        expect(res.body.resetAt).toBeDefined();
      } finally {
        quotaManager.resetDailyUsage();
      }
    });
  });

  describe('Global Monthly Budget & Kill-Switch Fallback', () => {
    it('falls back to cached/mock data with a friendly message when kill-switch is active', async () => {
      // Activate kill switch
      const switchRes = await request(app)
        .post('/api/v1/admin/killswitch')
        .send({ active: true });
      expect(switchRes.status).toBe(200);
      expect(switchRes.body.killSwitchActive).toBe(true);

      // Perform recommendation request
      const res = await request(app)
        .post('/api/v1/recommend')
        .send({
          lat: 23.7925,
          lng: 90.4150,
          cuisine: 'All',
          priority: 'Best Overall'
        });

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      expect(res.body.meta.isBudgetFallback).toBe(true);
      expect(res.body.meta.budgetMessage).toContain('Global search capacity limit reached');
    });
  });

  describe('Lazy Place Details Cost Optimization', () => {
    it('GET /api/v1/places/:id/details returns complete phone and hours only when opened', async () => {
      const res = await request(app).get('/api/v1/places/mock_jap_1/details');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('mock_jap_1');
      expect(res.body.nationalPhoneNumber).toBeDefined();
      expect(res.body.regularOpeningHours).toBeDefined();
    });
  });

  describe('P2 Smart Decisions & Bandit OpenAPI Contracts', () => {
    it('GET /api/v1/bandit/weights returns compliant schema', async () => {
      const res = await request(app).get('/api/v1/bandit/weights').set('X-Device-Id', 'device_contract_test');
      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
      expect(res.body.weights).toBeDefined();
      expect(typeof res.body.weights.time).toBe('number');
    });

    it('POST /api/v1/recommend returns allergen disclaimer and departure predictions', async () => {
      const res = await request(app)
        .post('/api/v1/recommend')
        .send({
          lat: 23.7925,
          lng: 90.4150,
          priority: 'Best Overall',
          timeBudgetMinutes: 45
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.allergenDisclaimer).toContain('Never rely on this for allergen safety.');
      expect(res.body.topPicks).toBeDefined();
      if (res.body.topPicks?.bestMatch?.departurePredictions) {
        expect(res.body.topPicks.bestMatch.departurePredictions.isPrediction).toBe(true);
      }
    });
  });
});
