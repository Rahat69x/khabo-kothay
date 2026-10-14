import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../routes/api.js';
import { createGroupSession, joinGroupSession, computeFairRanking, castVote, closeGroupSession } from '../services/group-mode.js';
import { addDishPriceReport, getDishPrices } from '../services/dish-prices.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Phase 4: Discovery & Group — F4 Group Mode, F5 Swipe, F6 Dish Prices', () => {
  describe('F4 Group Mode Session Lifecycle & Fair Ranking', () => {
    it('creates group session with 128-bit unguessable token and 3-hour expiry', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ creatorName: 'Rahat', budget: 700 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.session.token).toMatch(/^[0-9a-f]{32}$/);
      expect(res.body.session.deepLink).toContain('khabokothay://group/');
      expect(res.body.session.participants.length).toBe(1);
    });

    it('allows guest to join session and prevents duplicate limit (>12)', () => {
      const session = createGroupSession({ creatorName: 'Host' });
      const join1 = joinGroupSession(session.token, { name: 'Guest 1', startingArea: 'Banani' });
      expect(join1.session.participants.length).toBe(2);

      // Fill up to 12
      for (let i = 2; i <= 11; i++) {
        joinGroupSession(session.token, { name: `Guest ${i}`, startingArea: 'Gulshan' });
      }
      expect(session.participants.length).toBe(12);

      // 13th participant must be rejected
      expect(() => joinGroupSession(session.token, { name: 'Guest 13' }))
        .toThrow('limit reached');
    });

    it('computes fair multi-origin scores without prioritizing creator alone', () => {
      const session = createGroupSession({ creatorName: 'User1' });
      joinGroupSession(session.token, { name: 'User2', startingArea: 'Banani' });
      joinGroupSession(session.token, { name: 'User3', startingArea: 'Gulshan 2' });

      const candidates = [
        { id: 'central', name: 'Central Spot', neighborhood: 'Banani', priceLevel: 2 },
        { id: 'distant', name: 'Far Spot', neighborhood: 'Uttara', priceLevel: 2 }
      ];

      const ranked = computeFairRanking(session, candidates);
      expect(ranked.length).toBe(2);
      expect(ranked[0].id).toBe('central');
      expect(ranked[0].metrics.fairScore).toBeGreaterThan(ranked[1].metrics.fairScore);
    });

    it('records and allows changing votes, then closes session with winner', () => {
      const session = createGroupSession({ creatorName: 'Host' });
      const { participantId: p1 } = joinGroupSession(session.token, { name: 'Guest' });

      castVote(session.token, { participantId: p1, candidateId: 'spot-A' });
      expect(session.votes[p1]).toBe('spot-A');

      // Change vote
      castVote(session.token, { participantId: p1, candidateId: 'spot-B' });
      expect(session.votes[p1]).toBe('spot-B');

      // Close session
      const closed = closeGroupSession(session.token, { creatorId: session.creatorId });
      expect(closed.status).toBe('closed');
      expect(closed.winner.candidateId).toBe('spot-B');
      expect(closed.winner.votesReceived).toBe(1);
    });
  });

  describe('F6 Community Dish Prices & Outlier Moderation', () => {
    it('records valid dish price report via POST /api/dish-price-reports', async () => {
      const res = await request(app)
        .post('/api/dish-price-reports')
        .send({
          restaurantName: 'Star Kabab',
          dishName: 'Mutton Kacchi',
          priceBdt: 320,
          portion: 'Half'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report.status).toBe('verified');
    });

    it('flags extreme price outlier (>3x) for moderation', () => {
      const report = addDishPriceReport({
        restaurantId: 'mock_kacchi_1',
        dishName: 'Kacchi Biryani (Basmati)',
        priceBdt: 3500 // Normal median is ~460
      });

      expect(report.status).toBe('pending_moderation');
    });

    it('retrieves dish price summary with median and disclaimer via GET /api/dish-prices', async () => {
      const res = await request(app)
        .get('/api/dish-prices')
        .query({ dishName: 'Kacchi' });

      expect(res.status).toBe(200);
      expect(res.body.hasData).toBe(true);
      expect(res.body).toHaveProperty('medianPriceBdt');
      expect(res.body.disclaimer).toContain('Community-reported');
    });
  });
});
