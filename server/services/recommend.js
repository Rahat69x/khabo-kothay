import weightsConfig from '../config/weights.json' with { type: 'json' };
import tasteConfig from '../config/taste.json' with { type: 'json' };
import { selectExplorationCandidates } from './discovery.js';
import { getCollaborativePredictions } from './collaborative.js';
import { getTransportSummary } from './cost.js';

/**
 * Calculates Bayesian average rating
 * (v / (v + 50)) * R + (50 / (v + 50)) * C
 * @param {number} R - Raw rating (1.0 - 5.0)
 * @param {number} v - User rating count
 * @param {number} C - Mean rating across candidate set
 */
export function calculateBayesianRating(R, v, C) {
  const reviews = Math.max(0, v || 0);
  const rawR = typeof R === 'number' ? R : 4.0;
  const meanC = typeof C === 'number' ? C : 4.3;
  return ((reviews / (reviews + 50)) * rawR) + ((50 / (reviews + 50)) * meanC);
}

/**
 * Min-Max normalization helper (0.0 to 1.0)
 * Inverted when higher raw value is worse (e.g. time, distance, price, cost)
 */
export function normalize(val, min, max, invert = false) {
  if (min === max) return 1.0;
  const clamped = Math.max(min, Math.min(max, val));
  const ratio = (clamped - min) / (max - min);
  return invert ? (1.0 - ratio) : ratio;
}

/**
 * Check if restaurant is closing soon relative to estimated arrival time
 */
export function evaluateClosingSoon(regularOpeningHours, durationSeconds) {
  if (!regularOpeningHours || !regularOpeningHours.closingTime) {
    return { isClosingSoon: false, isClosedOnArrival: false, minutesUntilClose: null };
  }

  try {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + (durationSeconds * 1000));
    
    // closingTime format "HH:MM"
    const [closeH, closeM] = regularOpeningHours.closingTime.split(':').map(Number);
    const closeDate = new Date(now);
    closeDate.setHours(closeH, closeM, 0, 0);

    // If closing is in early morning (< 6) and current time is evening (>= 18)
    if (now.getHours() >= 18 && closeH < 6) {
      closeDate.setDate(closeDate.getDate() + 1);
    } else if (closeDate.getTime() < now.getTime() - 4 * 3600 * 1000) {
      // If closing time has already passed several hours ago today, consider next cycle
      closeDate.setDate(closeDate.getDate() + 1);
    }

    const diffArrivalToCloseMinutes = Math.round((closeDate.getTime() - arrivalTime.getTime()) / 60000);

    if (diffArrivalToCloseMinutes <= 0) {
      return { isClosingSoon: true, isClosedOnArrival: true, minutesUntilClose: 0 };
    }
    if (diffArrivalToCloseMinutes <= 30) {
      return { isClosingSoon: true, isClosedOnArrival: false, minutesUntilClose: diffArrivalToCloseMinutes };
    }

    return { isClosingSoon: false, isClosedOnArrival: false, minutesUntilClose: diffArrivalToCloseMinutes };
  } catch (e) {
    return { isClosingSoon: false, isClosedOnArrival: false, minutesUntilClose: null };
  }
}

/**
 * Generates plain-language trade-off explanation for why this restaurant was ranked
 */
export function generateRecommendationReason(restaurant, allRanked, userPriority, tasteMatch, weatherContext) {
  const name = restaurant.displayName;
  const mins = Math.max(1, Math.round(restaurant.durationSeconds / 60));
  const km = (restaurant.distanceMeters / 1000).toFixed(1);
  const traffic = restaurant.trafficLevel ? restaurant.trafficLevel.toLowerCase() : 'moderate';
  const priceLabel = restaurant.priceLevel ? '৳'.repeat(restaurant.priceLevel) : 'price unlisted';

  // Compare with a runner-up or reference place
  const other = allRanked.find(r => r.id !== restaurant.id);

  let tradeOffPart = '';
  if (other) {
    const otherMins = Math.max(1, Math.round(other.durationSeconds / 60));
    const otherKm = (other.distanceMeters / 1000).toFixed(1);

    if (restaurant.durationSeconds < other.durationSeconds && restaurant.distanceMeters > other.distanceMeters) {
      const savedMins = Math.round((other.durationSeconds - restaurant.durationSeconds) / 60);
      const extraKm = ((restaurant.distanceMeters - other.distanceMeters) / 1000).toFixed(1);
      tradeOffPart = `${extraKm} km farther than ${other.displayName.split(' ')[0]} but ${savedMins} minutes faster because traffic is ${traffic}.`;
    } else if (restaurant.durationSeconds < other.durationSeconds) {
      const savedMins = Math.round((other.durationSeconds - restaurant.durationSeconds) / 60);
      tradeOffPart = `${savedMins} mins faster to reach than alternatives with ${traffic} traffic.`;
    } else if (restaurant.rating > other.rating) {
      tradeOffPart = `Higher rating (${restaurant.rating}★) and great consistency with ${restaurant.userRatingCount}+ reviews.`;
    }
  }

  if (!tradeOffPart) {
    tradeOffPart = `${mins} min away (${km} km) with ${traffic} traffic at ${priceLabel}.`;
  }

  // Taste personalization mention
  let tastePart = '';
  if (tasteMatch && tasteMatch > 0.65) {
    tastePart = `Matches your preference for ${restaurant.cuisine || 'this cuisine'}. `;
  }

  // Weather note if raining
  let weatherPart = '';
  if (weatherContext && weatherContext.isRaining) {
    weatherPart = ' (Rain alert: rickshaw/ride-share recommended).';
  }

  // Closing soon warning
  let closingPart = '';
  if (restaurant.closingStatus && restaurant.closingStatus.isClosingSoon) {
    closingPart = ' ⚠️ Closes shortly after your estimated arrival.';
  }

  return `${tastePart}${tradeOffPart}${weatherPart}${closingPart}`.trim();
}

/**
 * Score and rank candidate restaurants
 */
export function rankRestaurants({
  candidates,
  userLocation,
  priority = 'Best Overall',
  budget = 2,
  cuisine = 'All',
  tasteProfile = null,
  weatherContext = null,
  collaborativeInteractions = null,
  surpriseMe = false
}) {
  if (!candidates || candidates.length === 0) return [];

  // Compute candidate-set mean rating for Bayesian calculation
  const totalRating = candidates.reduce((acc, c) => acc + (c.rating || 4.0), 0);
  const meanRating = totalRating / candidates.length;

  // Add transport costs and closing soon calculations to each candidate
  const enriched = candidates.map(c => {
    const transport = getTransportSummary(c.distanceMeters || 1500, c.durationSeconds || 900, c.trafficLevel || 'Moderate');
    const closingStatus = evaluateClosingSoon(c.regularOpeningHours, c.durationSeconds || 900);
    const bayesianRating = calculateBayesianRating(c.rating, c.userRatingCount, meanRating);

    return {
      ...c,
      transport,
      closingStatus,
      bayesianRating
    };
  });

  // Collect extrema for min-max normalization
  const ratings = enriched.map(c => c.bayesianRating);
  const durations = enriched.map(c => c.durationSeconds || 900);
  const distances = enriched.map(c => c.distanceMeters || 1500);
  const trafficRatios = enriched.map(c => c.trafficRatio || 1.2);
  const prices = enriched.map(c => c.priceLevel || 2);
  const transportCosts = enriched.map(c => c.transport.cheapestEstimatedCostBdt);

  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minTraffic = Math.min(...trafficRatios);
  const maxTraffic = Math.max(...trafficRatios);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minCost = Math.min(...transportCosts);
  const maxCost = Math.max(...transportCosts);

  // Weights configuration
  let activeWeights = weightsConfig[priority] || weightsConfig['Best Overall'];

  // Apply taste weight distribution if tasteProfile is provided
  const hasTasteProfile = tasteProfile && Object.keys(tasteProfile).length > 0;
  let weights = { ...activeWeights };

  if (hasTasteProfile && priority !== 'Personalized') {
    // Stage 12: give each preset a small taste share of 0.10, taken proportionally
    const tasteShare = 0.10;
    const factor = 1.0 - tasteShare;
    const adjusted = {};
    for (const [k, v] of Object.entries(weights)) {
      if (k !== 'taste' && k !== 'spareBonus') {
        adjusted[k] = v * factor;
      }
    }
    adjusted.taste = tasteShare;
    weights = adjusted;
  }

  // Collaborative filtering predictions if enabled & available
  let collaborativeData = null;
  if (tasteConfig.collaborative.enabled && collaborativeInteractions) {
    collaborativeData = getCollaborativePredictions(
      collaborativeInteractions,
      enriched.map(c => c.id)
    );
  }

  // Exploration / "Try something new" detection
  const explorationPicks = selectExplorationCandidates(enriched, tasteProfile || {}, { surpriseMe });
  const explorationIds = new Set(explorationPicks.map(p => p.candidateId));

  // Compute individual factors and composite score
  const scored = enriched.map(c => {
    // 0.0 to 1.0 factors
    const ratingFactor = normalize(c.bayesianRating, minRating, maxRating, false);
    const timeFactor = normalize(c.durationSeconds, minDuration, maxDuration, true);
    const distanceFactor = normalize(c.distanceMeters, minDistance, maxDistance, true);
    const trafficFactor = normalize(c.trafficRatio, minTraffic, maxTraffic, true);
    const priceFactor = normalize(c.priceLevel || 2, minPrice, maxPrice, true);
    const costFactor = normalize(c.transport.cheapestEstimatedCostBdt, minCost, maxCost, true);

    // Taste factor
    let tasteFactor = 0.5; // neutral cold start
    if (hasTasteProfile) {
      const cScore = tasteProfile[c.cuisine] ?? 50;
      tasteFactor = cScore / 100;
    }

    // Weather impact on walking
    let weatherPenalty = 0;
    if (weatherContext && weatherContext.isRaining && c.transport.cheapestFeasibleMode === 'walk') {
      weatherPenalty = 5; // Slight penalty for walking in rain
    }

    // Budget fit: subtract 10 points per price level above user's budget
    let budgetPenalty = 0;
    const userBudgetNum = parseInt(budget, 10) || 2;
    if (c.priceLevel && c.priceLevel > userBudgetNum) {
      budgetPenalty = (c.priceLevel - userBudgetNum) * 10;
    }

    // Cuisine match bonus: +5 bonus points
    let cuisineBonus = 0;
    if (cuisine && cuisine !== 'All' && c.cuisine && c.cuisine.toLowerCase() === cuisine.toLowerCase()) {
      cuisineBonus = 5;
    }

    // Closing soon penalty: -30 points if within 30 min of arrival
    let closingPenalty = 0;
    if (c.closingStatus && c.closingStatus.isClosingSoon) {
      closingPenalty = 30;
    }

    // Weighted base score (0 to 100)
    let baseScore =
      ((weights.rating || 0) * ratingFactor +
       (weights.time || 0) * timeFactor +
       (weights.distance || 0) * distanceFactor +
       (weights.traffic || 0) * trafficFactor +
       (weights.price || 0) * priceFactor +
       (weights.cost || 0) * costFactor +
       (weights.taste || 0) * tasteFactor) * 100;

    let finalScore = baseScore + cuisineBonus - budgetPenalty - weatherPenalty - closingPenalty;

    // Optional collaborative filtering blend (80% content, 20% collaborative)
    if (collaborativeData && collaborativeData.hasEnoughData && collaborativeData.predictions[c.id] !== undefined) {
      const collabScore = collaborativeData.predictions[c.id];
      finalScore = (finalScore * tasteConfig.collaborative.contentBlendWeight) +
                   (collabScore * tasteConfig.collaborative.blendWeight);
    }

    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    const isTrySomethingNew = explorationIds.has(c.id);
    const explorationInfo = explorationPicks.find(p => p.candidateId === c.id);

    return {
      ...c,
      score: finalScore,
      isTrySomethingNew,
      explorationReason: explorationInfo ? explorationInfo.reason : null,
      factorBreakdown: {
        taste: Math.round(tasteFactor * 100),
        time: Math.round(timeFactor * 100),
        rating: Math.round(ratingFactor * 100),
        price: Math.round(priceFactor * 100),
        distance: Math.round(distanceFactor * 100),
        traffic: Math.round(trafficFactor * 100),
        cost: Math.round(costFactor * 100)
      }
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Assign Badges:
  // Best Overall (rank 1), Fastest to Reach (min duration), Best for Price (min price & cost)
  let fastestId = null;
  let minDurationSec = Infinity;
  let bestPriceId = null;
  let minCombinedPrice = Infinity;

  for (const item of scored) {
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

  return scored.map((item, index) => {
    const badges = [];
    if (index === 0) {
      badges.push('Best Overall');
    }
    if (item.id === fastestId) {
      badges.push('Fastest to Reach');
    }
    if (item.id === bestPriceId) {
      badges.push('Best for Price');
    }
    if (item.isTrySomethingNew) {
      badges.push('Try something new');
    }
    if (collaborativeData && collaborativeData.predictions && collaborativeData.predictions[item.id] >= 75) {
      badges.push('Users like you also enjoyed');
    }

    const reason = item.isTrySomethingNew && item.explorationReason
      ? item.explorationReason
      : generateRecommendationReason(item, scored, priority, item.factorBreakdown.taste / 100, weatherContext);

    return {
      ...item,
      badges: [...new Set(badges)],
      reason
    };
  });
}
