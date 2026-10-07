import express from 'express';
import { searchRestaurants, getPlaceDetails } from '../services/places.js';
import { computeTravelTimes, compareRoutes } from '../services/routes.js';
import { rankRestaurants } from '../services/recommend.js';
import { getDefaultTasteProfile, recordEvent, decayProfile } from '../services/taste.js';
import { getWeatherContext } from '../services/weather.js';
import { applyMoodCriteria, getMoodConfig } from '../services/mood.js';
import { PRESET_LOCATIONS } from '../services/mock.js';
import quotaManager from '../services/quota.js';
import globalCache from '../services/cache.js';
import logger from '../services/logger.js';
import { getDeparturePredictions } from '../services/predictions.js';
import { getBanditProfile, updateBanditWeights, resetBanditProfile, setBanditEnabled } from '../services/bandit.js';
import { logEvalEvent } from '../services/eval-logger.js';
import preferencesConfig from '../config/preferences.json' with { type: 'json' };
import featureFlags from '../config/featureFlags.js';

const router = express.Router();

// Middleware to record endpoint hits and response time metrics
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    quotaManager.recordEndpointHit(req.baseUrl + req.path, res.statusCode, durationMs);
  });
  next();
});

/**
 * GET /api/health (or /api/v1/health) - Liveness Probe
 */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    app: 'Khabo Kothay?',
    version: '1.1.0',
    commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '6e196bf',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/ready (or /api/v1/ready) - Readiness Probe
 */
router.get('/ready', (req, res) => {
  const memory = process.memoryUsage();
  const isHealthy = memory.heapUsed < 1.5 * 1024 * 1024 * 1024;
  const budget = quotaManager.checkGlobalMonthlyBudget();
  const ready = isHealthy && !budget.killSwitchActive;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    ok: ready,
    app: 'Khabo Kothay?',
    version: '1.1.0',
    checks: {
      cache: 'ok',
      engine: 'ok',
      budget: budget.isExceeded ? 'budget_exceeded' : 'ok'
    },
    uptime: process.uptime()
  });
});

/**
 * GET /api/admin/usage - Internal Endpoint Usage Counter
 */
router.get('/admin/usage', (req, res) => {
  res.json(quotaManager.getUsageReport());
});

/**
 * POST /api/admin/killswitch - Kill-switch toggle
 */
router.post('/admin/killswitch', (req, res) => {
  const { active } = req.body || {};
  const currentState = quotaManager.setKillSwitch(active);
  res.json({
    success: true,
    killSwitchActive: currentState,
    message: currentState
      ? 'Kill-switch activated. Global requests gated to cached/mock fallback.'
      : 'Kill-switch deactivated.'
  });
});

/**
 * GET /api/config
 * Returns ONLY browser-safe config. NEVER returns GOOGLE_SERVER_KEY!
 */
router.get('/config', (req, res) => {
  const isMock = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_SERVER_KEY;
  res.json({
    googleBrowserKey: process.env.GOOGLE_BROWSER_KEY || '',
    useMockData: isMock,
    presetLocations: PRESET_LOCATIONS
  });
});

/**
 * GET /api/context/weather
 */
router.get('/context/weather', async (req, res, next) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 23.7925;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 90.4150;
    const weather = await getWeatherContext(lat, lng);
    res.json(weather);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/restaurants/search
 * Simple candidate search
 */
router.post('/restaurants/search', async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
    const limitCheck = quotaManager.checkAndRecordDeviceSearch(deviceId);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: limitCheck.message,
        limit: limitCheck.limit,
        resetAt: limitCheck.resetAt
      });
    }

    const { lat, lng, cuisine = 'All', radiusMeters = 3000, budget } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required coordinates' });
    }

    const candidates = await searchRestaurants({
      lat: Number(lat),
      lng: Number(lng),
      cuisine,
      radiusMeters: Number(radiusMeters),
      budget
    });

    res.json({ candidates });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/recommend
 * Core ranking engine endpoint: search + traffic-aware routes + cost + mood + taste + scoring
 * Stateless - accepts tasteProfile, mood, priority, budget, weatherContext in request body
 */
router.post('/recommend', async (req, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
    const limitCheck = quotaManager.checkAndRecordDeviceSearch(deviceId);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: limitCheck.message,
        limit: limitCheck.limit,
        resetAt: limitCheck.resetAt
      });
    }

    const budgetStatus = quotaManager.checkGlobalMonthlyBudget();

    const {
      lat,
      lng,
      cuisine = 'All',
      priority = 'Best Overall',
      budget = 2,
      mood = null,
      tasteProfile = null,
      weatherContext = null,
      collaborativeInteractions = null,
      surpriseMe = false,
      timeBudgetMinutes = null,
      companion = null,
      preferences = null
    } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Coordinates lat and lng are required' });
    }

    const userLat = Number(lat);
    const userLng = Number(lng);
    const banditProfile = getBanditProfile(deviceId);

    // 1. Fetch Candidates (Multi-cuisine if mood dictates)
    let candidates = [];
    const moodConfig = mood ? getMoodConfig(mood) : null;

    if (moodConfig && (!cuisine || cuisine === 'All')) {
      if (moodConfig.cuisines && moodConfig.cuisines.length > 0) {
        // Fetch candidates for primary mood cuisines
        const promises = moodConfig.cuisines.slice(0, 3).map(c =>
          searchRestaurants({ lat: userLat, lng: userLng, cuisine: c, budget })
        );
        const nested = await Promise.all(promises);
        const seen = new Set();
        for (const list of nested) {
          for (const item of list) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              candidates.push(item);
            }
          }
        }
      } else {
        candidates = await searchRestaurants({ lat: userLat, lng: userLng, cuisine: 'All', budget });
      }
    } else {
      candidates = await searchRestaurants({ lat: userLat, lng: userLng, cuisine, budget });
    }

    if (candidates.length === 0) {
      return res.json({
        results: [],
        topPicks: null,
        meta: { count: 0, message: 'No open restaurants found matching your criteria.' }
      });
    }

    // 2. Compute Traffic-Aware Travel Times
    const travelMetrics = await computeTravelTimes(
      { lat: userLat, lng: userLng },
      candidates
    );

    const travelMap = new Map(travelMetrics.map(t => [t.id, t]));
    const mergedCandidates = candidates.map(c => {
      const metrics = travelMap.get(c.id) || {
        distanceMeters: 2000,
        durationSeconds: 900,
        staticDurationSeconds: 750,
        trafficLevel: 'Moderate',
        trafficRatio: 1.2
      };
      return {
        ...c,
        ...metrics
      };
    });

    // 3. Weather Context (if not supplied in body)
    const activeWeather = weatherContext || await getWeatherContext(userLat, userLng);

    // 4. Mood Filtering & Time-of-day Signals
    let moodEnriched = mergedCandidates;
    if (mood) {
      moodEnriched = applyMoodCriteria(mergedCandidates, mood);
    }

    // 5. Rank Candidates with Recommendation Engine
    const rankedResults = rankRestaurants({
      candidates: moodEnriched,
      userLocation: { lat: userLat, lng: userLng },
      priority,
      budget: Number(budget),
      cuisine,
      tasteProfile,
      weatherContext: activeWeather,
      collaborativeInteractions,
      surpriseMe: Boolean(surpriseMe),
      timeBudgetMinutes,
      companion,
      preferences,
      banditProfile
    });

    // 6. Assemble "For you right now" Top 3 picks
    let bestMatch = rankedResults[0] || null;

    let fastestOrNearest = [...rankedResults]
      .filter(r => r.id !== (bestMatch ? bestMatch.id : null))
      .sort((a, b) => a.durationSeconds - b.durationSeconds)[0] || null;

    let trySomethingNew = rankedResults.find(r => r.isTrySomethingNew && r.id !== (bestMatch ? bestMatch.id : null)) || null;

    // 7. Departure Predictions for Top 3 Picks (+0, +15, +30, +60 min)
    if (featureFlags.enableDeparturePredictions) {
      const picksToPredict = [bestMatch, fastestOrNearest, trySomethingNew].filter(Boolean);
      if (picksToPredict.length > 0) {
        const predictedPicks = await getDeparturePredictions(
          { lat: userLat, lng: userLng },
          picksToPredict
        );
        const predMap = new Map(predictedPicks.map(p => [p.id, p]));
        if (bestMatch && predMap.has(bestMatch.id)) bestMatch = predMap.get(bestMatch.id);
        if (fastestOrNearest && predMap.has(fastestOrNearest.id)) fastestOrNearest = predMap.get(fastestOrNearest.id);
        if (trySomethingNew && predMap.has(trySomethingNew.id)) trySomethingNew = predMap.get(trySomethingNew.id);
      }
    }

    // Summary line for "Why these?"
    const topPickSummary = bestMatch
      ? `Ranked for ${priority} around ${userLat.toFixed(3)}, ${userLng.toFixed(3)} taking into account real-time Dhaka traffic (${bestMatch.trafficLevel} congestion) and transport budget.`
      : 'No recommendations available.';

    // Log anonymized evaluation impression
    logEvalEvent({
      sessionId: req.headers['x-session-id'] || `sess_${deviceId}`,
      eventType: 'impression',
      priority,
      chosenCandidateId: null,
      topRankedIds: rankedResults.slice(0, 5).map(r => r.id),
      metadata: { budget, cuisine, companion, timeBudgetMinutes }
    });

    res.json({
      results: rankedResults,
      topPicks: {
        bestMatch,
        fastestOrNearest,
        trySomethingNew,
        summary: topPickSummary,
        counterfactual: bestMatch ? bestMatch.counterfactual : null,
        banditNote: bestMatch ? bestMatch.banditNote : null
      },
      meta: {
        totalFound: rankedResults.length,
        weather: activeWeather,
        priorityUsed: priority,
        timestamp: new Date().toISOString(),
        isBudgetFallback: budgetStatus.isExceeded,
        budgetMessage: budgetStatus.friendlyMessage,
        allergenDisclaimer: preferencesConfig.disclaimer,
        banditActive: Boolean(banditProfile && banditProfile.enabled)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/routes/compare
 * Compares alternative routes with traffic, polylines, and transport modes
 */
router.post('/routes/compare', async (req, res, next) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination || origin.lat === undefined || destination.lat === undefined) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    const comparison = await compareRoutes({
      origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
      destination: { lat: Number(destination.lat), lng: Number(destination.lng) }
    });

    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/places/:placeId/details
 * Fetch place details (phone, website, opening hours, photos)
 */
router.get('/places/:placeId/details', async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const details = await getPlaceDetails(placeId);
    res.json(details);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/places/photo
 * Photo proxy endpoint - Streams Google photo without exposing GOOGLE_SERVER_KEY
 */
router.get('/places/photo', async (req, res, next) => {
  try {
    const { name, maxWidth = 600 } = req.query;

    if (!name || name.startsWith('places/mock_') || name.startsWith('places/trio_') || !process.env.GOOGLE_SERVER_KEY) {
      // Return a clean, appetizing SVG illustration for mock / fallback
      const hash = (name || 'photo').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const bgColors = ['#1E293B', '#0F172A', '#134E4A', '#312E81', '#701A75', '#7C2D12'];
      const bg = bgColors[hash % bgColors.length];
      const emojis = ['🍜', '🍣', '🍛', '☕', '🍔', '🍢', '🍰', '🍱'];
      const emoji = emojis[hash % emojis.length];

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
              <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#grad)" rx="16"/>
          <circle cx="300" cy="180" r="80" fill="rgba(255,255,255,0.08)"/>
          <text x="300" y="210" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
          <text x="300" y="320" font-size="20" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="600" fill="#94A3B8" text-anchor="middle">Gulshan Dining Experience</text>
        </svg>
      `;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(svg);
    }

    const apiKey = process.env.GOOGLE_SERVER_KEY;
    const googlePhotoUrl = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;

    const googleRes = await fetch(googlePhotoUrl);
    if (!googleRes.ok) {
      return res.redirect('/api/places/photo?name=mock_fallback');
    }

    const contentType = googleRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await googleRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/taste/default
 */
router.get('/taste/default', (req, res) => {
  res.json(getDefaultTasteProfile());
});

/**
 * POST /api/taste/event
 * Stateless calculation of updated profile after an interaction signal
 */
router.post('/taste/event', (req, res) => {
  const { currentProfile, event, candidatePool } = req.body;
  const updated = recordEvent(currentProfile, event);

  // Link to bandit personal weights if event contains chosen restaurant
  const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
  if (event && (event.restaurant || event.chosenCandidate)) {
    const chosen = event.restaurant || event.chosenCandidate;
    updateBanditWeights(deviceId, chosen, candidatePool || []);

    logEvalEvent({
      sessionId: req.headers['x-session-id'] || `sess_${deviceId}`,
      eventType: event.type || 'open',
      priority: event.priority || 'Best Overall',
      chosenCandidateId: chosen.id,
      topRankedIds: candidatePool ? candidatePool.map(c => c.id) : [chosen.id]
    });
  }

  res.json({ updatedProfile: updated });
});

/**
 * GET /api/bandit/weights (or /api/v1/bandit/weights)
 * Get current learned personal weights, guardrail bounds, and plain language explanation
 */
router.get('/bandit/weights', (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
  const profile = getBanditProfile(deviceId);
  res.json(profile);
});

/**
 * POST /api/bandit/update (or /api/v1/bandit/update)
 * Directly update bandit weights with a chosen candidate
 */
router.post('/bandit/update', (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
  const { chosenRestaurant, candidatePool } = req.body;
  if (!chosenRestaurant) {
    return res.status(400).json({ error: 'chosenRestaurant is required' });
  }

  const updatedProfile = updateBanditWeights(deviceId, chosenRestaurant, candidatePool || []);
  res.json(updatedProfile);
});

/**
 * POST /api/bandit/reset (or /api/v1/bandit/reset)
 * Reset bandit weights to default baseline
 */
router.post('/bandit/reset', (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
  const resetProfile = resetBanditProfile(deviceId);
  res.json({
    success: true,
    message: 'Bandit personal weights reset to baseline.',
    profile: resetProfile
  });
});

/**
 * POST /api/bandit/toggle (or /api/v1/bandit/toggle)
 * Toggle personal weights on or off
 */
router.post('/bandit/toggle', (req, res) => {
  const deviceId = req.headers['x-device-id'] || req.ip || 'anonymous';
  const { enabled } = req.body;
  const profile = setBanditEnabled(deviceId, enabled);
  res.json({
    success: true,
    enabled: profile.enabled,
    profile
  });
});

export default router;
