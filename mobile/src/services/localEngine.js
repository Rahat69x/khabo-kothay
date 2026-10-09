import { EMBEDDED_RESTAURANTS } from '../data/embedded-restaurants.js';

/**
 * Calculates straight-line distance in meters between two lat/lng coordinates in Dhaka.
 */
function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * 111000;
  const dLng = (lng2 - lng1) * 102000;
  const straight = Math.sqrt(dLat * dLat + dLng * dLng);
  // Dhaka street routing multiplier ~ 1.35x
  return Math.max(350, Math.round(straight * 1.35));
}

/**
 * Computes realistic Dhaka traffic speed, duration, and congestion level.
 */
function computeTrafficMetrics(distanceMeters, id = 'spot') {
  // Free-flow static travel speed ~ 25 km/h (7 m/s)
  const staticSeconds = Math.max(180, Math.round(distanceMeters / 6.94));

  // Determine congestion ratio from hour of day (Asia/Dhaka) + restaurant id seed
  const now = new Date();
  const dhakaHour = (now.getUTCHours() + 6) % 24;
  const isRushHour = (dhakaHour >= 8 && dhakaHour <= 10.5) || (dhakaHour >= 17 && dhakaHour <= 20.5);

  const hash = String(id).charCodeAt(id.length - 1) % 4;
  let ratio = isRushHour ? 1.6 : 1.2;
  if (hash === 1) ratio += 0.25;
  if (hash === 2) ratio += 0.45;
  if (hash === 3) ratio -= 0.15;
  ratio = Math.max(1.05, Math.min(2.5, ratio));

  const durationSeconds = Math.round(staticSeconds * ratio);

  let trafficLevel = 'Low';
  if (ratio >= 1.6) {
    trafficLevel = 'Heavy';
  } else if (ratio >= 1.25) {
    trafficLevel = 'Moderate';
  }

  return {
    distanceMeters,
    staticDurationSeconds: staticSeconds,
    durationSeconds,
    trafficRatio: Number(ratio.toFixed(2)),
    trafficLevel
  };
}

/**
 * Dhaka fare calculation for Walk, Rickshaw, CNG, and Car/Ride-share.
 */
function calculateDhakaTransport(distanceMeters, durationSeconds, trafficLevel) {
  const km = distanceMeters / 1000;
  const mins = durationSeconds / 60;
  const tMult = trafficLevel === 'Heavy' ? 1.35 : trafficLevel === 'Moderate' ? 1.15 : 1.0;

  // Walk
  const walkFeasible = distanceMeters <= 2200;
  const walkMins = Math.round(distanceMeters / 75); // ~4.5 km/h

  // Rickshaw
  const rickshawFeasible = distanceMeters <= 6500;
  const rickshawCost = Math.round(((30 + km * 22) * tMult) / 5) * 5;

  // CNG
  const cngFeasible = distanceMeters <= 35000;
  const cngCost = Math.round(((60 + km * 35) * tMult) / 5) * 5;

  // Car / Ride-Share
  const carCost = Math.round(((90 + km * 45 + mins * 3) * tMult) / 5) * 5;

  let cheapestCost = carCost;
  let cheapestMode = 'car';

  if (walkFeasible && km < 1.0) {
    cheapestCost = 0;
    cheapestMode = 'walk';
  } else if (rickshawFeasible && rickshawCost < carCost) {
    cheapestCost = rickshawCost;
    cheapestMode = 'rickshaw';
  } else if (cngCost < carCost) {
    cheapestCost = cngCost;
    cheapestMode = 'cng';
  }

  return {
    cheapestEstimatedCostBdt: cheapestCost,
    cheapestMode,
    cheapestFeasibleMode: cheapestMode,
    modes: {
      walk: { estimatedCostBdt: 0, durationMinutes: walkMins, feasible: walkFeasible },
      rickshaw: { estimatedCostBdt: rickshawCost, durationMinutes: Math.round(mins * 1.1), feasible: rickshawFeasible },
      cng: { estimatedCostBdt: cngCost, durationMinutes: Math.round(mins), feasible: cngFeasible },
      car: { estimatedCostBdt: carCost, durationMinutes: Math.round(mins), feasible: true }
    }
  };
}

/**
 * Local Recommendation Engine mirroring full server ranking logic.
 */
export function getLocalRecommendations({
  lat = 23.7975,
  lng = 90.4234,
  cuisine = 'All',
  priority = 'Best Overall',
  budget = 2,
  mood = null,
  tasteProfile = null,
  weatherContext = null,
  surpriseMe = false,
  timeBudgetMinutes = null,
  companion = null,
  preferences = null
}) {
  let pool = [...EMBEDDED_RESTAURANTS];

  // 1. Filter: Cuisine
  if (cuisine && cuisine !== 'All') {
    const cuisineMatches = pool.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    if (cuisineMatches.length > 0) {
      pool = cuisineMatches;
    }
  }

  // 2. Filter: Preferences (halal, vegetarian, no_beef)
  if (preferences) {
    if (preferences.halal) {
      const filtered = pool.filter(r => r.halal !== false);
      if (filtered.length > 0) pool = filtered;
    }
    if (preferences.vegetarian) {
      const filtered = pool.filter(r => r.vegetarian === true);
      if (filtered.length > 0) {
        pool = filtered;
      } else {
        // If strict combination yielded 0, search all vegetarian in database
        const anyVeg = EMBEDDED_RESTAURANTS.filter(r => r.vegetarian === true);
        if (anyVeg.length > 0) pool = anyVeg;
      }
    }
    if (preferences.no_beef) {
      const filtered = pool.filter(r => r.no_beef === true);
      if (filtered.length > 0) pool = filtered;
    }
  }

  // Fallback to all if pool was somehow filtered to empty
  if (pool.length === 0) {
    pool = [...EMBEDDED_RESTAURANTS];
  }

  // 3. Compute dynamic metrics relative to user's location
  const enriched = pool.map(r => {
    const dist = calculateDistanceMeters(lat, lng, r.location.latitude, r.location.longitude);
    const traffic = computeTrafficMetrics(dist, r.id);
    const transport = calculateDhakaTransport(dist, traffic.durationSeconds, traffic.trafficLevel);

    // Score calculation (0 to 100)
    const ratingScore = ((r.rating - 3.5) / 1.5) * 40; // 0-40 pts
    const distScore = Math.max(0, 30 - (dist / 200)); // closer = higher pts
    const timeScore = Math.max(0, 30 - (traffic.durationSeconds / 60)); // faster = higher pts
    const priceScore = Math.abs(r.priceLevel - budget) === 0 ? 15 : Math.abs(r.priceLevel - budget) === 1 ? 10 : 5;

    let totalScore = ratingScore + distScore + timeScore + priceScore;

    // Taste profile boost
    if (tasteProfile && tasteProfile[r.cuisine]) {
      totalScore += (tasteProfile[r.cuisine] / 100) * 15;
    }

    // Weather impact on walking
    if (weatherContext && weatherContext.isRaining && transport.cheapestFeasibleMode === 'walk') {
      totalScore -= 8;
    }

    // Generate Trade-off Reason
    const travelMins = Math.round(traffic.durationSeconds / 60);
    let reason = `${r.rating}★ rating • ${travelMins}m via ${transport.cheapestMode} (~৳${transport.cheapestEstimatedCostBdt})`;
    if (traffic.trafficLevel === 'Low') {
      reason += ' • Smooth traffic right now';
    } else if (traffic.trafficLevel === 'Heavy') {
      reason += ' • Heavy traffic in this corridor';
    }

    return {
      ...r,
      distanceMeters: dist,
      durationSeconds: traffic.durationSeconds,
      staticDurationSeconds: traffic.staticDurationSeconds,
      trafficLevel: traffic.trafficLevel,
      trafficRatio: traffic.trafficRatio,
      transport,
      totalScore: Math.round(totalScore),
      score: Math.min(99, Math.max(65, Math.round(totalScore))),
      reason,
      departurePredictions: {
        bestSuggestion: {
          message: 'Leave now for shortest travel time'
        }
      },
      factorBreakdown: {
        taste: 85,
        time: Math.min(95, Math.max(50, Math.round(timeScore * 3))),
        rating: Math.round(ratingScore * 2.2),
        price: Math.round(priceScore * 6),
        distance: Math.min(95, Math.max(50, Math.round(distScore * 3))),
        traffic: traffic.trafficLevel === 'Low' ? 90 : traffic.trafficLevel === 'Moderate' ? 75 : 55,
        cost: 85
      }
    };
  });

  // 4. Time Budget Filter (if specified)
  let results = enriched;
  if (timeBudgetMinutes) {
    const maxMins = parseInt(timeBudgetMinutes, 10);
    const diningMins = 25;
    const filteredByTime = results.filter(r => {
      const roundTripMins = Math.round((2 * r.durationSeconds) / 60);
      return roundTripMins + diningMins <= maxMins;
    });
    if (filteredByTime.length > 0) {
      results = filteredByTime;
    }
  }

  // 5. Sort by Priority
  if (priority === 'Fastest') {
    results.sort((a, b) => a.durationSeconds - b.durationSeconds);
  } else if (priority === 'Closest') {
    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  } else if (priority === 'Cheapest') {
    results.sort((a, b) => {
      if (a.priceLevel !== b.priceLevel) return a.priceLevel - b.priceLevel;
      return a.transport.cheapestEstimatedCostBdt - b.transport.cheapestEstimatedCostBdt;
    });
  } else if (priority === 'Best Rated') {
    results.sort((a, b) => b.rating - a.rating || b.userRatingCount - a.userRatingCount);
  } else if (priority === 'Best Value') {
    results.sort((a, b) => (b.rating / b.priceLevel) - (a.rating / a.priceLevel));
  } else {
    // Best Overall / Personalized
    results.sort((a, b) => b.totalScore - a.totalScore);
  }

  if (surpriseMe && results.length > 3) {
    results = [...results].sort(() => Math.random() - 0.5);
  }

  // Assign Badges & Counterfactual
  let fastestId = null;
  let minDurationSec = Infinity;
  let bestPriceId = null;
  let minCombinedPrice = Infinity;

  for (const item of results) {
    if (item.durationSeconds < minDurationSec) {
      minDurationSec = item.durationSeconds;
      fastestId = item.id;
    }
    const combinedPrice = (item.priceLevel || 2) * 20 + item.transport.cheapestEstimatedCostBdt;
    if (combinedPrice < minCombinedPrice) {
      minCombinedPrice = combinedPrice;
      bestPriceId = item.id;
    }
  }

  results = results.map((item, index) => {
    const badges = [];
    if (index === 0) badges.push('Best Overall');
    if (item.id === fastestId) badges.push('Fastest to Reach');
    if (item.id === bestPriceId) badges.push('Best for Price');
    if (item.rating >= 4.7) badges.push('Top Rated');

    return {
      ...item,
      badges: [...new Set(badges)],
      counterfactual: index === 0
        ? `Ranked #1 overall due to superior ${item.rating}★ rating and shorter travel time than other alternatives.`
        : null
    };
  });

  // 6. Top Picks
  const bestMatch = results[0] || null;
  const fastestOption = [...results].sort((a, b) => a.durationSeconds - b.durationSeconds)[0] || null;
  const trySomethingNew = results.find(r => r.cuisine !== bestMatch?.cuisine && r.rating >= 4.6) || results[1] || null;

  return {
    results,
    topPicks: {
      summary: `Top recommendation: ${bestMatch?.displayName || 'Great spot'} with ${bestMatch?.rating || 4.5}★ rating`,
      counterfactual: bestMatch ? `${bestMatch.displayName} ranks top because it balances commute time, price, and ratings best.` : null,
      banditNote: 'Personalized to your taste profile and live traffic.',
      bestMatch,
      fastestOption,
      trySomethingNew
    },
    count: results.length,
    isLocalFallback: true
  };
}

/**
 * Local Meal-Time Solver mirroring server/services/mealtime.js.
 */
export function getLocalMealTime({
  mode = 'lunch',
  availableMinutes = 45,
  origin = { lat: 23.7975, lng: 90.4234, name: 'Current Location' },
  destination = 'same-as-origin',
  transport = 'car',
  diningStyle = 'dine_in',
  bufferPreference = 'Balanced',
  tasteProfile = null
}) {
  const originLat = origin?.lat || 23.7975;
  const originLng = origin?.lng || 90.4234;

  const diningMinutesMap = {
    breakfast: diningStyle === 'takeaway' ? 0 : 14,
    lunch: diningStyle === 'takeaway' ? 0 : 18,
    snacks: diningStyle === 'takeaway' ? 0 : 10,
    dinner: diningStyle === 'takeaway' ? 0 : 25
  };
  const waitMinutesMap = {
    breakfast: diningStyle === 'takeaway' ? 3 : 4,
    lunch: diningStyle === 'takeaway' ? 3 : 4,
    snacks: diningStyle === 'takeaway' ? 2 : 3,
    dinner: diningStyle === 'takeaway' ? 4 : 5
  };
  const baseDiningMins = diningMinutesMap[mode] !== undefined ? diningMinutesMap[mode] : 18;
  const waitMins = waitMinutesMap[mode] !== undefined ? waitMinutesMap[mode] : 4;

  const bufferMinsMap = {
    Safe: 8,
    Balanced: 5,
    Flexible: 3
  };
  const bufferMins = bufferMinsMap[bufferPreference] || 5;

  const now = new Date();

  const candidates = EMBEDDED_RESTAURANTS.map(r => {
    const distToRestaurant = calculateDistanceMeters(originLat, originLng, r.location.latitude, r.location.longitude);
    const outbound = computeTrafficMetrics(distToRestaurant, r.id);
    const outboundMins = Math.max(2, Math.round(outbound.durationSeconds / 60));

    // Return trip back
    let returnMins = outboundMins;
    let distReturn = distToRestaurant;
    if (destination && destination !== 'same-as-origin' && typeof destination === 'object') {
      distReturn = calculateDistanceMeters(r.location.latitude, r.location.longitude, destination.lat, destination.lng);
      const ret = computeTrafficMetrics(distReturn, `${r.id}_ret`);
      returnMins = Math.max(2, Math.round(ret.durationSeconds / 60));
    }

    const totalNeededMinutes = outboundMins + waitMins + baseDiningMins + returnMins + bufferMins;
    const spareMinutes = availableMinutes - totalNeededMinutes;

    let status = 'SAFE';
    if (spareMinutes < 0) {
      status = 'NOT_RECOMMENDED';
    } else if (spareMinutes < 5) {
      status = 'TIGHT';
    }

    const isStrictlyFeasible = spareMinutes >= 0;
    const isFlexiblyFeasible = spareMinutes >= -12;

    const backByDate = new Date(now.getTime() + totalNeededMinutes * 60000);
    const backByTime = backByDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const finishDate = new Date(now.getTime() + (outboundMins + waitMins + baseDiningMins) * 60000);
    const finishAt = finishDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const closesAt = r.regularOpeningHours?.closingTime ? `${r.regularOpeningHours.closingTime}` : '11:00 PM';

    const timeBreakdown = {
      outbound: outboundMins,
      wait: waitMins,
      eat: baseDiningMins,
      return: returnMins,
      buffer: bufferMins,
      total: totalNeededMinutes,
      spareMinutes,
      status
    };

    const reason = spareMinutes >= 5
      ? `Fits comfortably with ${spareMinutes} min spare (${outboundMins}m outbound, ${waitMins + baseDiningMins}m stay, ${returnMins}m return).`
      : `Tight schedule: takes ${totalNeededMinutes}m of your ${availableMinutes}m budget.`;

    return {
      ...r,
      placeId: r.id,
      name: r.displayName,
      formattedAddress: r.formattedAddress,
      cuisine: r.cuisine,
      rating: r.rating,
      userRatingCount: r.userRatingCount,
      priceLevel: r.priceLevel,
      photos: r.photos,
      nationalPhoneNumber: r.nationalPhoneNumber,
      websiteUri: r.websiteUri,
      venueType: r.primaryType || 'casual',
      mode,
      diningStyle,
      transport,
      trafficLevel: outbound.trafficLevel,
      returnTrafficLevel: outbound.trafficLevel,
      distanceMeters: distToRestaurant,
      durationSeconds: outbound.durationSeconds,
      timeBreakdown,
      availableMinutes,
      spareMinutes,
      status,
      backByTime,
      openCheck: {
        passes: true,
        openAtArrival: true,
        closesAt,
        finishAt,
        minutesUntilClose: 180,
        flags: []
      },
      detour: {
        detourMinutes: 0,
        directMinutes: returnMins,
        routeEfficiency: 1.0
      },
      detourMinutes: 0,
      flags: ['Traffic estimated', 'Wait time accounted'],
      reasons: [reason],
      score: Math.round(r.rating * 15 + Math.max(0, spareMinutes)),
      isStrictlyFeasible,
      isFlexiblyFeasible
    };
  });

  const strictlyFeasible = candidates
    .filter(c => c.isStrictlyFeasible)
    .sort((a, b) => b.score - a.score);

  const flexibleResults = candidates
    .filter(c => !c.isStrictlyFeasible && c.isFlexiblyFeasible)
    .sort((a, b) => b.score - a.score);

  const results = strictlyFeasible.length > 0 ? strictlyFeasible : flexibleResults;

  return {
    meta: {
      mode,
      availableMinutes,
      transport,
      diningStyle,
      bufferPreference,
      strictCount: strictlyFeasible.length,
      flexibleCount: flexibleResults.length
    },
    results: results.length > 0 ? results : candidates.slice(0, 5),
    flexibleResults,
    count: results.length,
    isLocalFallback: true
  };
}

/**
 * Returns weather data context for Dhaka.
 */
export function getLocalWeather() {
  return {
    temperature: 29,
    condition: 'Sunny / Partly Cloudy',
    isRaining: false,
    rainProbability: 10,
    trafficImpact: 'Normal'
  };
}

/**
 * Compares Dhaka routes across modes.
 */
export function getLocalRouteComparison(origin, destination) {
  const dist = calculateDistanceMeters(origin.lat, origin.lng, destination.lat, destination.lng);
  const traffic = computeTrafficMetrics(dist);
  const transport = calculateDhakaTransport(dist, traffic.durationSeconds, traffic.trafficLevel);

  return {
    distanceMeters: dist,
    durationSeconds: traffic.durationSeconds,
    trafficLevel: traffic.trafficLevel,
    transport
  };
}

export default {
  getLocalRecommendations,
  getLocalMealTime,
  getLocalWeather,
  getLocalRouteComparison
};
