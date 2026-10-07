import { parseGoogleDuration } from './routes.js';
import featureFlags from '../config/featureFlags.js';
import globalCache from './cache.js';
import logger from './logger.js';

const ROUTES_COMPUTE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/**
 * Dhaka Diurnal Traffic Multiplier:
 * Models realistic traffic fluctuations in Dhaka across hours and minutes
 */
export function getDhakaTrafficMultiplier(targetDate = new Date()) {
  const hour = targetDate.getHours() + (targetDate.getMinutes() / 60);

  // Peak 1: Morning commute (8:30 - 10:30)
  if (hour >= 8.5 && hour <= 10.5) {
    return 1.45;
  }
  // Post-morning moderate: 11:00 - 15:30
  if (hour > 10.5 && hour < 15.5) {
    return 1.15;
  }
  // Peak 2: Evening rush hour (16:30 - 20:30)
  if (hour >= 16.5 && hour <= 20.5) {
    return 1.65;
  }
  // Post-peak evening easing: 20:30 - 22:00
  if (hour > 20.5 && hour <= 22.0) {
    return 1.20;
  }
  // Late night / early morning: 22:00 - 07:00
  if (hour > 22.0 || hour < 7.0) {
    return 0.90;
  }
  return 1.10;
}

/**
 * Predict travel duration for a single origin-destination at a specific future departure time
 */
async function predictLegDuration(origin, destination, offsetMinutes, baseDurationSeconds) {
  const now = new Date();
  const departureDate = new Date(now.getTime() + offsetMinutes * 60000);
  const departureTimeIso = departureDate.toISOString();

  const cacheKey = `pred_${origin.lat.toFixed(3)}_${origin.lng.toFixed(3)}_${destination.location.latitude.toFixed(3)}_${destination.location.longitude.toFixed(3)}_${offsetMinutes}_${departureDate.getHours()}`;
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const isMock = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_SERVER_KEY;

  if (isMock) {
    const currentMult = getDhakaTrafficMultiplier(now);
    const futureMult = getDhakaTrafficMultiplier(departureDate);
    // Dynamic ratio of future traffic vs current traffic
    const ratio = futureMult / currentMult;
    const predictedDurationSeconds = Math.max(300, Math.round(baseDurationSeconds * ratio));
    
    let trafficLevel = 'Moderate';
    if (futureMult >= 1.4) trafficLevel = 'Heavy';
    else if (futureMult <= 1.0) trafficLevel = 'Low';

    const result = {
      offsetMinutes,
      departureTime: departureTimeIso,
      durationSeconds: predictedDurationSeconds,
      durationMinutes: Math.max(1, Math.round(predictedDurationSeconds / 60)),
      trafficLevel,
      isPrediction: true,
      label: 'predicted'
    };
    globalCache.set(cacheKey, result, 120); // 2 min cache
    return result;
  }

  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;
    const response = await fetch(ROUTES_COMPUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration'
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) } } },
        destination: { location: { latLng: { latitude: Number(destination.location.latitude), longitude: Number(destination.location.longitude) } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        departureTime: departureTimeIso
      })
    });

    if (!response.ok) {
      logger.warn({ status: response.status, offsetMinutes }, 'Routes prediction call failed, using diurnal fallback');
      // Graceful fallback to diurnal calculation
      const currentMult = getDhakaTrafficMultiplier(now);
      const futureMult = getDhakaTrafficMultiplier(departureDate);
      const ratio = futureMult / currentMult;
      const predictedDurationSeconds = Math.max(300, Math.round(baseDurationSeconds * ratio));
      return {
        offsetMinutes,
        departureTime: departureTimeIso,
        durationSeconds: predictedDurationSeconds,
        durationMinutes: Math.max(1, Math.round(predictedDurationSeconds / 60)),
        trafficLevel: futureMult >= 1.4 ? 'Heavy' : futureMult <= 1.0 ? 'Low' : 'Moderate',
        isPrediction: true,
        label: 'predicted'
      };
    }

    const data = await response.json();
    const route = data.routes?.[0];
    const durSec = route?.duration ? parseGoogleDuration(route.duration) : baseDurationSeconds;
    const staticSec = route?.staticDuration ? parseGoogleDuration(route.staticDuration) : Math.round(durSec * 0.85);

    let trafficLevel = 'Moderate';
    const ratio = durSec / staticSec;
    if (ratio < 1.15) trafficLevel = 'Low';
    else if (ratio > 1.45) trafficLevel = 'Heavy';

    const result = {
      offsetMinutes,
      departureTime: departureTimeIso,
      durationSeconds: durSec,
      durationMinutes: Math.max(1, Math.round(durSec / 60)),
      trafficLevel,
      isPrediction: true,
      label: 'predicted'
    };
    globalCache.set(cacheKey, result, 120);
    return result;
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed predicting leg duration, falling back');
    return {
      offsetMinutes,
      departureTime: departureTimeIso,
      durationSeconds: baseDurationSeconds,
      durationMinutes: Math.max(1, Math.round(baseDurationSeconds / 60)),
      trafficLevel: 'Moderate',
      isPrediction: true,
      label: 'predicted'
    };
  }
}

/**
 * Predict traffic durations at +0, +15, +30, and +60 minutes for candidate restaurants
 * @param {Object} origin - { lat, lng }
 * @param {Array} candidates - Array of restaurant objects (top picks)
 * @returns {Promise<Array>} Candidates enriched with departurePredictions and leaveSuggestions
 */
export async function getDeparturePredictions(origin, candidates) {
  if (!featureFlags.enableDeparturePredictions || !candidates || candidates.length === 0) {
    return candidates;
  }

  const offsets = [0, 15, 30, 60];

  const enriched = await Promise.all(
    candidates.map(async (candidate) => {
      const baseDurationSeconds = candidate.durationSeconds || 900;

      // Compute prediction for each departure time offset
      const predictions = await Promise.all(
        offsets.map(offset =>
          predictLegDuration(origin, candidate, offset, baseDurationSeconds)
        )
      );

      const basePrediction = predictions.find(p => p.offsetMinutes === 0) || predictions[0];
      const nowDurationMinutes = basePrediction.durationMinutes;

      // Find if departing later saves noticeable time (>= 3 minutes)
      let bestSuggestion = null;
      let maxSavedMinutes = 0;

      for (const pred of predictions) {
        if (pred.offsetMinutes > 0) {
          const savedMinutes = nowDurationMinutes - pred.durationMinutes;
          if (savedMinutes > maxSavedMinutes) {
            maxSavedMinutes = savedMinutes;
            bestSuggestion = {
              offsetMinutes: pred.offsetMinutes,
              savedMinutes,
              predictedDurationMinutes: pred.durationMinutes,
              message: `Leave in ${pred.offsetMinutes} min to save ${savedMinutes} min (predicted)`,
              label: 'predicted'
            };
          }
        }
      }

      return {
        ...candidate,
        departurePredictions: {
          nowDurationMinutes,
          predictions,
          bestSuggestion: maxSavedMinutes >= 3 ? bestSuggestion : null,
          isPrediction: true,
          label: 'predicted'
        }
      };
    })
  );

  return enriched;
}

export default {
  getDhakaTrafficMultiplier,
  getDeparturePredictions
};
