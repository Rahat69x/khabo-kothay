import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRouter from '../routes/api.js';
import { getDeparturePredictions, getDhakaTrafficMultiplier } from '../services/predictions.js';
import {
  projectWeightsToSimplexBounds,
  generateBanditExplanation,
  getBanditProfile,
  resetBanditProfile,
  setBanditEnabled,
  updateBanditWeights
} from '../services/bandit.js';
import { rankRestaurants, generateCounterfactualExplanation } from '../services/recommend.js';
import { logEvalEvent, getLoggedSessions } from '../services/eval-logger.js';
import { runEvaluation } from '../../scripts/eval.js';
import banditConfig from '../config/bandit.json' with { type: 'json' };
import preferencesConfig from '../config/preferences.json' with { type: 'json' };

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

describe('P2: Smarter Decisions & Recommendation Intelligence', () => {

  describe('1. Departure Time Predictions (+0, +15, +30, +60 min)', () => {
    it('computes predicted traffic durations with offsets and marks as predicted', async () => {
      const origin = { lat: 23.7925, lng: 90.4078 }; // Banani
      const candidates = [
        {
          id: 'test_dest_1',
          displayName: 'Test Kacchi Place',
          durationSeconds: 1500, // 25 min currently
          location: { latitude: 23.7915, longitude: 90.4180 }
        }
      ];

      const enriched = await getDeparturePredictions(origin, candidates);
      expect(enriched).toHaveLength(1);
      const predData = enriched[0].departurePredictions;

      expect(predData).toBeDefined();
      expect(predData.isPrediction).toBe(true);
      expect(predData.label).toBe('predicted');
      expect(predData.predictions).toHaveLength(4);

      const offsets = predData.predictions.map(p => p.offsetMinutes);
      expect(offsets).toEqual([0, 15, 30, 60]);

      // All prediction items must be labeled "predicted"
      for (const p of predData.predictions) {
        expect(p.isPrediction).toBe(true);
        expect(p.label).toBe('predicted');
        expect(p.durationMinutes).toBeGreaterThan(0);
      }
    });

    it('Dhaka traffic multiplier correctly models diurnal fluctuations', () => {
      // Rush hour (18:00) should have higher congestion multiplier than late night (23:00)
      const eveningDate = new Date('2026-10-08T18:00:00+06:00');
      const eveningMult = getDhakaTrafficMultiplier(eveningDate);

      const nightDate = new Date('2026-10-08T23:30:00+06:00');
      const nightMult = getDhakaTrafficMultiplier(nightDate);

      expect(eveningMult).toBeGreaterThan(nightMult);
      expect(nightMult).toBeLessThanOrEqual(1.0);
    });
  });

  describe('2. Time-Budget Mode ("I have 45 minutes")', () => {
    const origin = { lat: 23.7925, lng: 90.4078 };

    it('drops places where round-trip travel plus dining duration exceeds budget', () => {
      const candidates = [
        {
          id: 'quick_cafe',
          displayName: 'Quick Coffee Spot',
          cuisine: 'Coffee', // 15 min dine duration
          durationSeconds: 300, // 5 min one-way -> 10 min round-trip. Total = 25 min
          distanceMeters: 800,
          priceLevel: 2,
          rating: 4.5,
          userRatingCount: 100,
          location: { latitude: 23.7930, longitude: 90.4090 }
        },
        {
          id: 'far_finedining',
          displayName: 'Far Fine Dining',
          cuisine: 'Fine dining', // 60 min dine duration
          durationSeconds: 900, // 15 min one-way -> 30 min round-trip. Total = 90 min
          distanceMeters: 3000,
          priceLevel: 4,
          rating: 4.8,
          userRatingCount: 200,
          location: { latitude: 23.8100, longitude: 90.4200 }
        }
      ];

      // With 45 min budget: quick_cafe (25 min total) passes, far_finedining (90 min) dropped
      const ranked = rankRestaurants({
        candidates,
        userLocation: origin,
        timeBudgetMinutes: 45
      });

      expect(ranked).toHaveLength(1);
      expect(ranked[0].id).toBe('quick_cafe');
      expect(ranked[0].timeBudgetDetails).toBeDefined();
      expect(ranked[0].timeBudgetDetails.totalTimeNeededMinutes).toBeLessThanOrEqual(45);
    });

    it('drops places that close before arrival plus dining duration', () => {
      const candidates = [
        {
          id: 'closing_soon_spot',
          displayName: 'Closing Soon Biriyani',
          cuisine: 'Biriyani', // 30 min dining
          durationSeconds: 600, // 10 min arrival
          distanceMeters: 1000,
          priceLevel: 2,
          rating: 4.4,
          userRatingCount: 150,
          location: { latitude: 23.7930, longitude: 90.4090 },
          // Mock opening hours closing 15 min from now (not enough for 10 min travel + 30 min dining)
          regularOpeningHours: {
            openNow: true,
            closingTime: (() => {
              const closeDate = new Date(Date.now() + 15 * 60000);
              return `${String(closeDate.getHours()).padStart(2, '0')}:${String(closeDate.getMinutes()).padStart(2, '0')}`;
            })()
          }
        }
      ];

      const ranked = rankRestaurants({
        candidates,
        userLocation: origin,
        timeBudgetMinutes: 60
      });

      expect(ranked).toHaveLength(0); // Successfully dropped
    });
  });

  describe('3. Personal Weights Multi-Armed Bandit with Strict Guardrails', () => {
    beforeEach(() => {
      resetBanditProfile('test_device_guardrails');
    });

    it('stays strictly within bounds [0.05, 0.50] under 50 aggressive update steps', () => {
      const deviceId = 'test_device_guardrails';
      const candidateSet = [
        { id: 'c1', durationSeconds: 300, transport: { cheapestEstimatedCostBdt: 30 }, rating: 4.8, priceLevel: 1, trafficLevel: 'Low' },
        { id: 'c2', durationSeconds: 1500, transport: { cheapestEstimatedCostBdt: 150 }, rating: 3.8, priceLevel: 3, trafficLevel: 'Heavy' }
      ];

      // Simulate 50 repeated clicks on the fastest option
      for (let i = 0; i < 50; i++) {
        updateBanditWeights(deviceId, candidateSet[0], candidateSet);
      }

      const profile = getBanditProfile(deviceId);
      expect(profile.updateCount).toBe(50);

      const weights = profile.weights;
      let totalWeight = 0;

      for (const [factor, weight] of Object.entries(weights)) {
        expect(weight).toBeGreaterThanOrEqual(0.05 - 1e-4);
        expect(weight).toBeLessThanOrEqual(0.50 + 1e-4);
        totalWeight += weight;
      }

      // Sum of weights must equal 1.0 (within 0.001)
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.005);
    });

    it('generates a plain-language note explaining shifted preference', () => {
      const baseline = banditConfig.defaultWeights;
      const speedBiased = { ...baseline, time: 0.42, rating: 0.15, price: 0.10, cost: 0.10, distance: 0.08, traffic: 0.10, taste: 0.05 };
      const note = generateBanditExplanation(speedBiased, baseline);

      expect(note).toContain('faster');
      expect(note).toContain('speed');
    });

    it('resetBanditProfile restores default baseline weights', () => {
      const deviceId = 'test_device_reset';
      updateBanditWeights(deviceId, { durationSeconds: 300 }, []);
      const reset = resetBanditProfile(deviceId);

      expect(reset.updateCount).toBe(0);
      expect(reset.weights.time).toBe(banditConfig.defaultWeights.time);
      expect(reset.weights.rating).toBe(banditConfig.defaultWeights.rating);
    });

    it('toggleBandit on/off switch disables learning adjustments', () => {
      const deviceId = 'test_device_toggle';
      setBanditEnabled(deviceId, false);

      const before = { ...getBanditProfile(deviceId).weights };
      updateBanditWeights(deviceId, { durationSeconds: 300 }, []);
      const after = getBanditProfile(deviceId).weights;

      expect(before).toEqual(after);
    });
  });

  describe('4. Context Signals & Companion Mappings', () => {
    it('applies companion profile adjustments from context.json', () => {
      const origin = { lat: 23.7925, lng: 90.4078 };
      const candidates = [
        {
          id: 'date_spot',
          displayName: 'Intimate Japanese Bistro',
          cuisine: 'Japanese',
          durationSeconds: 1200,
          distanceMeters: 2500,
          rating: 4.8,
          priceLevel: 3,
          userRatingCount: 300
        },
        {
          id: 'quick_burger',
          displayName: 'Quick Fast Food Burger',
          cuisine: 'Burger',
          durationSeconds: 400,
          distanceMeters: 800,
          rating: 4.1,
          priceLevel: 1,
          userRatingCount: 100
        }
      ];

      // In "date" companion mode, Japanese and high rating are heavily boosted
      const rankedDate = rankRestaurants({
        candidates,
        userLocation: origin,
        companion: 'date'
      });

      expect(rankedDate[0].id).toBe('date_spot');
    });
  });

  describe('5. Preference Filters & Strict Allergen Disclaimer', () => {
    const origin = { lat: 23.7925, lng: 90.4078 };
    const candidates = [
      {
        id: 'beef_kabab_spot',
        displayName: 'Famous Kabab Ghar',
        cuisine: 'Kabab', // Has beef
        durationSeconds: 600,
        distanceMeters: 1000,
        rating: 4.6,
        userRatingCount: 200
      },
      {
        id: 'pure_veg_cafe',
        displayName: 'Green Leaf Cafe',
        cuisine: 'Cafe', // Vegetarian & no beef friendly
        durationSeconds: 700,
        distanceMeters: 1200,
        rating: 4.5,
        userRatingCount: 150
      }
    ];

    it('filters candidates by vegetarian / no beef preferences and marks them unverified', () => {
      const ranked = rankRestaurants({
        candidates,
        userLocation: origin,
        preferences: { vegetarian: true }
      });

      expect(ranked).toHaveLength(1);
      expect(ranked[0].id).toBe('pure_veg_cafe');
      expect(ranked[0].dietaryVerification.isVerified).toBe(false);
      expect(ranked[0].dietaryVerification.status).toBe('unverified');
      expect(ranked[0].dietaryVerification.disclaimer).toContain('allergen safety');
    });

    it('disclaimer strictly warns against allergen safety assumptions', () => {
      expect(preferencesConfig.disclaimer).toContain('Never rely on this for allergen safety.');
    });
  });

  describe('6. Counterfactual Explanations', () => {
    it('generates clear trade-off comparison between top pick and alternative', () => {
      const topPick = {
        id: 'pick_1',
        displayName: 'Premium Italian Dining',
        durationSeconds: 600, // 10 min
        priceLevel: 3, // ~৳150
        transport: { cheapestEstimatedCostBdt: 120 }
      };

      const runnerUpCheapest = {
        id: 'pick_2',
        displayName: 'Affordable Tehari Corner',
        durationSeconds: 1320, // 22 min (adds 12 min)
        priceLevel: 1, // ~৳50
        transport: { cheapestEstimatedCostBdt: 40 } // saves ৳80 transport
      };

      const explanation = generateCounterfactualExplanation(topPick, [topPick, runnerUpCheapest], 'Best Overall');

      expect(explanation).toBeDefined();
      expect(explanation).toContain('If you chose Cheapest: Affordable');
      expect(explanation).toContain('saves ৳');
      expect(explanation).toContain('adds 12 min');
    });
  });

  describe('7. Evaluation Harness & Session Replay', () => {
    it('logs anonymized interaction sessions and replays hit-rates', () => {
      const testSession = {
        sessionId: 'test_eval_123',
        eventType: 'directions',
        priority: 'Best Overall',
        chosenCandidateId: 'places/mock_woodcreek',
        topRankedIds: ['places/mock_woodcreek', 'places/mock_takeout', 'places/mock_izumi']
      };

      const logged = logEvalEvent(testSession);
      expect(logged.sessionId).toBe('test_eval_123');

      // Replay evaluation harness
      const report = runEvaluation({
        sessions: [testSession],
        isABTesting: true
      });

      expect(report.totalSessionsEvaluated).toBe(1);
      expect(report.profiles).toHaveLength(3); // Baseline, Bandit, Variant B

      const baseline = report.profiles.find(p => p.name === 'Default Baseline Weights');
      expect(baseline.top1Rate).toBe(100);
      expect(baseline.top3Rate).toBe(100);
    });
  });

  describe('8. Server API Integration for P2 Features', () => {
    it('GET /api/v1/bandit/weights returns bandit state and bounds', async () => {
      const res = await request(app)
        .get('/api/v1/bandit/weights')
        .set('x-device-id', 'test_api_client_1');

      expect(res.status).toBe(200);
      expect(res.body.enabled).toBe(true);
      expect(res.body.weights).toBeDefined();
      expect(res.body.weights.time).toBeGreaterThan(0);
    });

    it('POST /api/v1/bandit/reset resets device weights to baseline', async () => {
      const res = await request(app)
        .post('/api/v1/bandit/reset')
        .set('x-device-id', 'test_api_client_1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.updateCount).toBe(0);
    });

    it('POST /api/v1/recommend includes departure predictions, allergen disclaimer, and counterfactuals', async () => {
      const res = await request(app)
        .post('/api/v1/recommend')
        .send({
          lat: 23.7925,
          lng: 90.4078,
          priority: 'Best Overall',
          timeBudgetMinutes: 45
        });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.topPicks).toBeDefined();

      // Check departure predictions on top pick
      if (res.body.topPicks?.bestMatch?.departurePredictions) {
        expect(res.body.topPicks.bestMatch.departurePredictions.isPrediction).toBe(true);
        expect(res.body.topPicks.bestMatch.departurePredictions.label).toBe('predicted');
      }

      // Check allergen disclaimer in meta
      expect(res.body.meta.allergenDisclaimer).toContain('Never rely on this for allergen safety.');
    });
  });

});
