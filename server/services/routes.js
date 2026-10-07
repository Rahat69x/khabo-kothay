import { globalCache, getCoarseGrid } from './cache.js';
import thresholdsConfig from '../config/thresholds.json' with { type: 'json' };
import { estimateCost } from './cost.js';

const ROUTES_MATRIX_URL = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
const ROUTES_COMPUTE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/**
 * Determine traffic level label based on duration / staticDuration ratio
 */
export function determineTrafficLevel(durationSeconds, staticDurationSeconds) {
  if (!durationSeconds || !staticDurationSeconds || staticDurationSeconds <= 0) {
    return 'Moderate';
  }
  const ratio = durationSeconds / staticDurationSeconds;
  if (ratio < thresholdsConfig.low.maxRatio) {
    return 'Low';
  } else if (ratio <= thresholdsConfig.moderate.maxRatio) {
    return 'Moderate';
  } else {
    return 'Heavy';
  }
}

/**
 * Compute route matrix from origin (lat, lng) to multiple candidate destinations
 * Uses ~300m coarse origin grid and 2-minute SWR caching
 */
export async function computeTravelTimes(origin, destinations, useMock = false) {
  const isMock = useMock || process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_SERVER_KEY;
  if (!destinations || destinations.length === 0) return [];

  // Key cache by coarse origin grid + destination IDs
  const { gridKey: originKey } = getCoarseGrid(origin.lat, origin.lng);
  const destKey = destinations.map(d => d.id).join('_');
  const cacheKey = `matrix_${originKey}_${destKey}`;

  const fetcher = async () => {
    if (isMock) {
    const results = destinations.map((dest) => {
      // If mock restaurant already specifies mock metrics, use them
      if (dest.mockDistanceMeters && dest.mockDurationSeconds) {
        const trafficLevel = determineTrafficLevel(dest.mockDurationSeconds, dest.mockStaticDurationSeconds || dest.mockDurationSeconds * 0.8);
        return {
          id: dest.id,
          distanceMeters: dest.mockDistanceMeters,
          durationSeconds: dest.mockDurationSeconds,
          staticDurationSeconds: dest.mockStaticDurationSeconds || Math.round(dest.mockDurationSeconds * 0.8),
          trafficLevel,
          trafficRatio: Number((dest.mockDurationSeconds / (dest.mockStaticDurationSeconds || dest.mockDurationSeconds * 0.8)).toFixed(2))
        };
      }

      // Calculate approximate straight-line distance in Dhaka
      const latDiff = (dest.location.latitude - origin.lat) * 111000;
      const lngDiff = (dest.location.longitude - origin.lng) * 102000;
      const approxDist = Math.max(500, Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 1.3));
      
      // Gulshan traffic: 12-25 km/h average
      const staticSec = Math.round((approxDist / 7.0)); // ~25 km/h
      // Introduce varied traffic based on distance & id hash
      const hash = String(dest.id).charCodeAt(dest.id.length - 1) % 3;
      let ratio = 1.1; // Low
      if (hash === 1) ratio = 1.35; // Moderate
      if (hash === 2) ratio = 1.75; // Heavy
      const durSec = Math.round(staticSec * ratio);

      return {
        id: dest.id,
        distanceMeters: approxDist,
        durationSeconds: durSec,
        staticDurationSeconds: staticSec,
        trafficLevel: determineTrafficLevel(durSec, staticSec),
        trafficRatio: Number(ratio.toFixed(2))
      };
    });

    globalCache.set(cacheKey, results, 120); // 2 minutes TTL
    return results;
  }

  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;
    const origins = [{
      waypoint: {
        location: {
          latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) }
        }
      }
    }];

    const destWaypoints = destinations.map(d => ({
      waypoint: {
        location: {
          latLng: {
            latitude: Number(d.location.latitude),
            longitude: Number(d.location.longitude)
          }
        }
      }
    }));

    const response = await fetch(ROUTES_MATRIX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,staticDuration,distanceMeters,status,condition'
      },
      body: JSON.stringify({
        origins,
        destinations: destWaypoints,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE'
      })
    });

    if (!response.ok) {
      console.warn(`Routes API matrix status ${response.status}. Falling back to mock estimates.`);
      return computeTravelTimes(origin, destinations, true);
    }

    const data = await response.json();
    const matrixResults = new Map();

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.status && item.status.code && item.status.code !== 0) {
          continue;
        }
        const destIdx = item.destinationIndex ?? 0;
        const durSec = parseGoogleDuration(item.duration) || 900;
        const staticDurSec = parseGoogleDuration(item.staticDuration) || Math.round(durSec * 0.85);
        const distM = item.distanceMeters || 2000;

        matrixResults.set(destIdx, {
          distanceMeters: distM,
          durationSeconds: durSec,
          staticDurationSeconds: staticDurSec,
          trafficLevel: determineTrafficLevel(durSec, staticDurSec),
          trafficRatio: Number((durSec / staticDurSec).toFixed(2))
        });
      }
    }

    const results = destinations.map((d, idx) => {
      const match = matrixResults.get(idx);
      if (match) {
        return { id: d.id, ...match };
      }
      // Individual fallback
      return {
        id: d.id,
        distanceMeters: 2000,
        durationSeconds: 900,
        staticDurationSeconds: 750,
        trafficLevel: 'Moderate',
        trafficRatio: 1.2
      };
    });

    return results;
  } catch (err) {
    console.error('Error in computeTravelTimes:', err);
    return computeTravelTimes(origin, destinations, true);
  }
};

  const cachedResult = await globalCache.getWithSWR(cacheKey, fetcher, 120);
  return cachedResult.data || cachedResult;
}

/**
 * Compare alternative routes between origin and destination
 */
export async function compareRoutes({ origin, destination, useMock = false }) {
  const isMock = useMock || process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_SERVER_KEY;
  const cacheKey = `compare_${origin.lat.toFixed(3)}_${origin.lng.toFixed(3)}_${destination.lat.toFixed(3)}_${destination.lng.toFixed(3)}`;

  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  if (isMock) {
    // Generate realistic Dhaka alternative routes
    // Route 1 (Main Avenue, direct but heavier traffic)
    // Route 2 (Inner Residential Road, slightly farther but faster / light traffic)
    const baseDist = Math.round(
      Math.sqrt(
        Math.pow((destination.lat - origin.lat) * 111000, 2) +
        Math.pow((destination.lng - origin.lng) * 102000, 2)
      ) * 1.35
    );

    const routes = [
      {
        routeIndex: 0,
        name: "Via Main Avenue (Gulshan Link)",
        distanceMeters: Math.max(800, baseDist),
        durationSeconds: 1320, // 22 min
        staticDurationSeconds: 780, // 13 min
        trafficLevel: "Heavy",
        trafficRatio: 1.69,
        summary: "Shorter distance but congested near major circles",
        encodedPolyline: "_}pnC{sbfPn@_@bBcB|AmBxAwBvAmBxAwB", // sample mock polyline
        color: "#EF4444" // red
      },
      {
        routeIndex: 1,
        name: "Via Lakeview Inner Bypass",
        distanceMeters: Math.max(1200, baseDist + 450), // 450m longer
        durationSeconds: 780, // 13 min (9 min faster!)
        staticDurationSeconds: 720,
        trafficLevel: "Low",
        trafficRatio: 1.08,
        summary: "Slightly longer path avoiding the signal bottleneck",
        encodedPolyline: "_}pnC{sbfP\\a@t@_B\\a@t@_BxAwBvAmB",
        color: "#10B981" // green
      }
    ];

    // Evaluate recommended route: lower-time / lower-traffic preferred over raw distance
    let recommended = routes[1]; // Route 2 is 9 min faster despite +450m
    if (routes[0].durationSeconds < routes[1].durationSeconds) {
      recommended = routes[0];
    }

    const diffMins = Math.round(Math.abs(routes[0].durationSeconds - routes[1].durationSeconds) / 60);
    const diffKm = (Math.abs(routes[0].distanceMeters - routes[1].distanceMeters) / 1000).toFixed(1);

    const recommendationReason = recommended === routes[1]
      ? `Takes the bypass: ${diffKm} km longer but saves ${diffMins} minutes due to light traffic.`
      : `Shortest and fastest route via main road.`;

    const transportModes = [
      estimateCost('walk', recommended.distanceMeters, recommended.durationSeconds, recommended.trafficLevel),
      estimateCost('rickshaw', recommended.distanceMeters, recommended.durationSeconds, recommended.trafficLevel),
      estimateCost('cng', recommended.distanceMeters, recommended.durationSeconds, recommended.trafficLevel),
      estimateCost('car', recommended.distanceMeters, recommended.durationSeconds, recommended.trafficLevel)
    ];

    const result = {
      routes,
      recommendedRouteIndex: recommended.routeIndex,
      recommendationReason,
      transportModes
    };

    globalCache.set(cacheKey, result, 120);
    return result;
  }

  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;
    const body = {
      origin: {
        location: { latLng: { latitude: Number(origin.lat), longitude: Number(origin.lng) } }
      },
      destination: {
        location: { latLng: { latitude: Number(destination.lat), longitude: Number(destination.lng) } }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true
    };

    const response = await fetch(ROUTES_COMPUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline.encodedPolyline,routes.description'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return compareRoutes({ origin, destination, useMock: true });
    }

    const data = await response.json();
    const rawRoutes = data.routes || [];

    const colors = ['#10B981', '#3B82F6', '#F59E0B'];
    const parsedRoutes = rawRoutes.map((r, idx) => {
      const durSec = parseGoogleDuration(r.duration) || 900;
      const staticSec = parseGoogleDuration(r.staticDuration) || Math.round(durSec * 0.85);
      const distM = r.distanceMeters || 2000;
      const tLevel = determineTrafficLevel(durSec, staticSec);

      return {
        routeIndex: idx,
        name: r.description || `Route ${idx + 1}`,
        distanceMeters: distM,
        durationSeconds: durSec,
        staticDurationSeconds: staticSec,
        trafficLevel: tLevel,
        trafficRatio: Number((durSec / staticSec).toFixed(2)),
        encodedPolyline: r.polyline?.encodedPolyline || '',
        color: colors[idx % colors.length]
      };
    });

    // Best route: minimal durationSeconds (traffic aware)
    let bestRoute = parsedRoutes[0];
    for (const r of parsedRoutes) {
      if (r.durationSeconds < bestRoute.durationSeconds) {
        bestRoute = r;
      }
    }

    let recommendationReason = 'Fastest route to your destination.';
    if (parsedRoutes.length > 1) {
      const other = parsedRoutes.find(r => r !== bestRoute);
      if (other) {
        const timeDiff = Math.round((other.durationSeconds - bestRoute.durationSeconds) / 60);
        const distDiff = ((bestRoute.distanceMeters - other.distanceMeters) / 1000).toFixed(1);
        if (bestRoute.distanceMeters > other.distanceMeters && timeDiff > 0) {
          recommendationReason = `${distDiff} km longer than the alternate, but saves ${timeDiff} minutes with lighter traffic.`;
        } else if (timeDiff > 0) {
          recommendationReason = `Saves ${timeDiff} minutes compared to alternative paths.`;
        }
      }
    }

    const transportModes = [
      estimateCost('walk', bestRoute.distanceMeters, bestRoute.durationSeconds, bestRoute.trafficLevel),
      estimateCost('rickshaw', bestRoute.distanceMeters, bestRoute.durationSeconds, bestRoute.trafficLevel),
      estimateCost('cng', bestRoute.distanceMeters, bestRoute.durationSeconds, bestRoute.trafficLevel),
      estimateCost('car', bestRoute.distanceMeters, bestRoute.durationSeconds, bestRoute.trafficLevel)
    ];

    const result = {
      routes: parsedRoutes,
      recommendedRouteIndex: bestRoute.routeIndex,
      recommendationReason,
      transportModes
    };

    globalCache.set(cacheKey, result, 120);
    return result;
  } catch (err) {
    console.error('Error in compareRoutes:', err);
    return compareRoutes({ origin, destination, useMock: true });
  }
}

/**
 * Parses Google duration string (e.g. "950s") into integer seconds
 */
export function parseGoogleDuration(val) {
  if (!val) return null;
  if (typeof val === 'number') return Math.round(val);
  const match = String(val).match(/([0-9.]+)s/);
  return match ? Math.round(parseFloat(match[1])) : null;
}
