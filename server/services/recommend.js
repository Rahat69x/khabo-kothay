import weightsConfig from '../config/weights.json' with { type: 'json' };
import tasteConfig from '../config/taste.json' with { type: 'json' };
import contextConfig from '../config/context.json' with { type: 'json' };
import preferencesConfig from '../config/preferences.json' with { type: 'json' };
import featureFlags from '../config/featureFlags.js';
import { selectExplorationCandidates } from './discovery.js';
import { getCollaborativePredictions } from './collaborative.js';
import { getTransportSummary } from './cost.js';
import { projectWeightsToSimplexBounds, generateBanditExplanation } from './bandit.js';
import { matchesCuisine } from './mock.js';

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
 * Accurately determines restaurant opening status in Asia/Dhaka time.
 * Handles:
 * - "Open now"
 * - "Closing soon (within 60 minutes)"
 * - "Closed"
 * - "Hours unknown"
 * Handles midnight rollover (e.g. 12:00 PM to 01:00 AM).
 */
export function getDhakaOpeningStatus(regularOpeningHours) {
  if (!regularOpeningHours || (!regularOpeningHours.openTime && !regularOpeningHours.closingTime)) {
    return {
      status: 'Hours unknown',
      label: 'Hours unknown',
      isOpen: null,
      isClosingSoon: false,
      minutesUntilClose: null
    };
  }

  try {
    const dhakaParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(new Date());

    const curHour = parseInt(dhakaParts.find(p => p.type === 'hour')?.value || '0', 10);
    const curMin = parseInt(dhakaParts.find(p => p.type === 'minute')?.value || '0', 10);
    const curTotalMin = curHour * 60 + curMin;

    const [openH, openM] = (regularOpeningHours.openTime || '11:00').split(':').map(Number);
    const [closeH, closeM] = (regularOpeningHours.closingTime || '23:00').split(':').map(Number);

    const openTotalMin = openH * 60 + openM;
    let closeTotalMin = closeH * 60 + closeM;

    const closesAfterMidnight = closeTotalMin < openTotalMin;
    let isOpen = false;
    let minutesUntilClose = null;

    if (closesAfterMidnight) {
      if (curTotalMin >= openTotalMin) {
        isOpen = true;
        minutesUntilClose = (closeTotalMin + 1440) - curTotalMin;
      } else if (curTotalMin < closeTotalMin) {
        isOpen = true;
        minutesUntilClose = closeTotalMin - curTotalMin;
      } else {
        isOpen = false;
      }
    } else {
      if (curTotalMin >= openTotalMin && curTotalMin < closeTotalMin) {
        isOpen = true;
        minutesUntilClose = closeTotalMin - curTotalMin;
      } else {
        isOpen = false;
      }
    }

    if (!isOpen) {
      return {
        status: 'Closed',
        label: 'Closed',
        isOpen: false,
        isClosingSoon: false,
        minutesUntilClose: 0
      };
    }

    if (minutesUntilClose !== null && minutesUntilClose <= 60) {
      return {
        status: 'Closing soon',
        label: `Closing soon (${minutesUntilClose} min)`,
        isOpen: true,
        isClosingSoon: true,
        minutesUntilClose
      };
    }

    return {
      status: 'Open now',
      label: 'Open now',
      isOpen: true,
      isClosingSoon: false,
      minutesUntilClose
    };
  } catch (err) {
    return {
      status: 'Hours unknown',
      label: 'Hours unknown',
      isOpen: null,
      isClosingSoon: false,
      minutesUntilClose: null
    };
  }
}

/**
 * Generates plain-language trade-off explanation for why this restaurant was ranked
 */
export function generateRecommendationReason(restaurant, allRanked, userPriority, tasteMatch, weatherContext, foodProfile = null) {
  const hasTime = Number.isFinite(restaurant.durationSeconds);
  const mins = hasTime ? Math.max(1, Math.round(restaurant.durationSeconds / 60)) : null;
  const km = (restaurant.distanceMeters / 1000).toFixed(1);
  const traffic = restaurant.trafficLevel ? restaurant.trafficLevel.toLowerCase() : 'moderate';
  const priceLabel = restaurant.priceLevel ? '৳'.repeat(restaurant.priceLevel) : 'price unlisted';

  // Compare with a runner-up or reference place
  const other = allRanked.find(r => r.id !== restaurant.id);

  let tradeOffPart = '';
  // Time comparisons only make sense when both travel times are known.
  if (other && hasTime && Number.isFinite(other.durationSeconds)) {
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
  } else if (other && restaurant.rating > other.rating) {
    tradeOffPart = `Higher rating (${restaurant.rating}★) and great consistency with ${restaurant.userRatingCount}+ reviews.`;
  }

  if (!tradeOffPart) {
    tradeOffPart = hasTime
      ? `${mins} min away (${km} km) with ${traffic} traffic at ${priceLabel}.`
      : `About ${km} km away (straight-line; travel time unavailable) at ${priceLabel}.`;
  }

  // Food Profile match honest reason (Phase 3)
  let profilePart = '';
  if (foodProfile) {
    const isPrefCuisine = foodProfile.preferredCuisines?.some(c => c.toLowerCase() === restaurant.cuisine?.toLowerCase());
    const cost = restaurant.estimatedCostPerPersonBdt;
    const isUnderBudget = cost && foodProfile.budgetMax && cost <= foodProfile.budgetMax;
    
    // Check dietary requirement transparency
    let dietaryNote = '';
    const hasDietReq = foodProfile.dietary?.halal || foodProfile.dietary?.vegetarian || foodProfile.dietary?.vegan || foodProfile.dietary?.no_beef;
    if (hasDietReq && (!restaurant.halal && !restaurant.vegetarian && !restaurant.no_beef)) {
      dietaryNote = ' (Dietary certification: unverified)';
    }

    if (isPrefCuisine && isUnderBudget) {
      profilePart = `Matches your ${restaurant.cuisine} + under ${foodProfile.budgetMax} BDT preference${dietaryNote}. `;
    } else if (isPrefCuisine) {
      profilePart = `Matches your ${restaurant.cuisine} preference${dietaryNote}. `;
    } else if (isUnderBudget) {
      profilePart = `Under your ${foodProfile.budgetMax} BDT budget (~৳${cost}/person)${dietaryNote}. `;
    }
  }

  // Taste personalization mention
  let tastePart = '';
  if (!profilePart && tasteMatch && tasteMatch > 0.65) {
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

  return `${profilePart}${tastePart}${tradeOffPart}${weatherPart}${closingPart}`.trim();
}

/**
 * Generates counterfactual explanation for top recommendation
 * e.g., "If you chose Cheapest: B saves ৳40 but adds 12 min."
 */
export function generateCounterfactualExplanation(topPick, allRanked, activePriority = 'Best Overall') {
  if (!featureFlags.enableCounterfactualExplanations || !topPick || allRanked.length <= 1) {
    return null;
  }

  const altPriority = activePriority === 'Cheapest' ? 'Fastest' : 'Cheapest';
  let altPick = null;

  if (altPriority === 'Cheapest') {
    altPick = [...allRanked].sort((a, b) => {
      const costA = (a.priceLevel || 2) * 50 + (a.transport?.cheapestEstimatedCostBdt || 50);
      const costB = (b.priceLevel || 2) * 50 + (b.transport?.cheapestEstimatedCostBdt || 50);
      return costA - costB;
    })[0];
  } else {
    altPick = [...allRanked].sort((a, b) => (a.durationSeconds || 900) - (b.durationSeconds || 900))[0];
  }

  if (!altPick || altPick.id === topPick.id) {
    return null;
  }

  const altName = altPick.displayName.split(' ')[0];

  if (altPriority === 'Cheapest') {
    const costTop = (topPick.priceLevel || 2) * 50 + (topPick.transport?.cheapestEstimatedCostBdt || 50);
    const costAlt = (altPick.priceLevel || 2) * 50 + (altPick.transport?.cheapestEstimatedCostBdt || 50);
    const saveBdt = Math.round(costTop - costAlt);
    const addMin = Math.round(((altPick.durationSeconds || 900) - (topPick.durationSeconds || 900)) / 60);

    if (saveBdt > 0 && addMin > 0) {
      return `If you chose Cheapest: ${altName} saves ৳${saveBdt} but adds ${addMin} min.`;
    } else if (saveBdt > 0) {
      return `If you chose Cheapest: ${altName} saves ৳${saveBdt}.`;
    } else {
      return `If you chose Cheapest: ${altName} is the most economical alternative.`;
    }
  } else if (altPriority === 'Fastest') {
    const saveMin = Math.round(((topPick.durationSeconds || 900) - (altPick.durationSeconds || 900)) / 60);
    const costDiff = Math.round((altPick.transport?.cheapestEstimatedCostBdt || 50) - (topPick.transport?.cheapestEstimatedCostBdt || 50));

    if (saveMin > 0 && costDiff > 0) {
      return `If you chose Fastest: ${altName} saves ${saveMin} min but adds ৳${costDiff}.`;
    } else if (saveMin > 0) {
      return `If you chose Fastest: ${altName} saves ${saveMin} min.`;
    } else {
      return `If you chose Fastest: ${altName} has the shortest route.`;
    }
  }

  return null;
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
  surpriseMe = false,
  timeBudgetMinutes = null,
  companion = null,
  preferences = null,
  banditProfile = null,
  openNowOnly = false,
  distanceRadiusMeters = null,
  foodProfile = null,
  filters = null,
  now = new Date()
}) {
  if (!candidates || candidates.length === 0) return [];

  // 1. Time-budget filter ("I have 45 minutes"):
  // Accounts for round-trip travel plus dining duration, and drops places that close too soon.
  let pool = candidates;
  if (timeBudgetMinutes && featureFlags.enableTimeBudgetMode) {
    const budgetMinutesNum = Number(timeBudgetMinutes);
    pool = pool.filter(c => {
      const oneWaySeconds = c.durationSeconds || 900;
      const roundTripMinutes = Math.round((2 * oneWaySeconds) / 60);
      const diningMinutes = contextConfig.diningDurationsMinutes[c.cuisine] || contextConfig.diningDurationsMinutes.Default || 30;
      const totalTimeNeeded = roundTripMinutes + diningMinutes;

      // Drop if total travel + dining exceeds time budget
      if (totalTimeNeeded > budgetMinutesNum) {
        return false;
      }

      // Check if closes too soon
      const closing = evaluateClosingSoon(c.regularOpeningHours, oneWaySeconds);
      if (closing.isClosedOnArrival) {
        return false;
      }
      if (closing.minutesUntilClose !== null && closing.minutesUntilClose < diningMinutes) {
        return false;
      }

      c.timeBudgetDetails = {
        timeBudgetMinutes: budgetMinutesNum,
        roundTripMinutes,
        diningMinutes,
        totalTimeNeededMinutes: totalTimeNeeded,
        marginMinutes: budgetMinutesNum - totalTimeNeeded
      };
      return true;
    });
  }

  // 2. Preference Filters: halal, vegetarian, no beef, and spice level (unverified)
  if (preferences && featureFlags.enablePreferenceFilters) {
    pool = pool.filter(c => {
      const def = preferencesConfig.cuisineDefaults[c.cuisine];
      if (!def) return true;
      if (preferences.halal && def.halal === false) return false;
      if (preferences.vegetarian && def.vegetarian === false) return false;
      if (preferences.no_beef && def.no_beef === false) return false;
      return true;
    });
  }

  // 3. Open Now Only filter
  if (openNowOnly) {
    pool = pool.filter(c => {
      const op = getDhakaOpeningStatus(c.regularOpeningHours);
      return op.isOpen === true;
    });
  }

  // 4. Distance Radius filter
  if (distanceRadiusMeters) {
    const maxRadius = Number(distanceRadiusMeters);
    if (!isNaN(maxRadius) && maxRadius > 0) {
      pool = pool.filter(c => (c.distanceMeters || 0) <= maxRadius);
    }
  }

  // 5. Price Range & Custom Facet Filters (Availability, Cuisine, Restaurant Type, Dietary, Features)
  if (filters) {
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const minP = Number.isFinite(Number(filters.priceMin)) ? Number(filters.priceMin) : 0;
      const maxP = Number.isFinite(Number(filters.priceMax)) ? Number(filters.priceMax) : Infinity;

      pool = pool.filter(c => {
        const cost = c.estimatedCostPerPersonBdt || c.estimatedCostPerPerson?.amount || c.menu?.estimatedCostPerPerson?.amount;
        if (cost !== null && cost !== undefined && Number.isFinite(cost)) {
          if (cost >= minP && cost <= maxP) {
            return true;
          }
          if (c.menu?.items && c.menu.items.length > 0) {
            const prices = c.menu.items.map(i => i.price !== undefined ? i.price : i.priceBdt).filter(Number.isFinite);
            if (prices.length > 0) {
              const minItemPrice = Math.min(...prices);
              const maxItemPrice = Math.max(...prices);
              if (minItemPrice <= maxP && maxItemPrice >= minP) {
                if (minP >= 1500 && cost < 1000) return false;
                if (maxP <= 400 && cost > 550) return false;
                return true;
              }
            }
          }
          return false;
        }

        if (c.menu?.items && c.menu.items.length > 0) {
          const prices = c.menu.items.map(i => i.price !== undefined ? i.price : i.priceBdt).filter(Number.isFinite);
          if (prices.length > 0) {
            const minItemPrice = Math.min(...prices);
            const maxItemPrice = Math.max(...prices);
            return minItemPrice <= maxP && maxItemPrice >= minP;
          }
        }

        // Fallback to price level tier
        const tierMap = {
          1: { min: 50, max: 400 },
          2: { min: 250, max: 950 },
          3: { min: 700, max: 2000 },
          4: { min: 1500, max: 6000 }
        };
        const tier = tierMap[c.priceLevel || 2] || { min: 0, max: 5000 };
        return tier.min <= maxP && tier.max >= minP;
      });
    }

    if (Array.isArray(filters.availability) && filters.availability.length > 0) {
      pool = pool.filter(c => {
        const op = getDhakaOpeningStatus(c.regularOpeningHours);
        return filters.availability.some(av => {
          if (av === 'open_now') return op.isOpen === true;
          if (av === 'closing_soon') return op.isClosingSoon === true;
          if (av === 'open_late') {
            const closeTime = c.regularOpeningHours?.closingTime || '23:00';
            const [cH] = closeTime.split(':').map(Number);
            return cH >= 23 || (cH >= 0 && cH <= 4);
          }
          return false;
        });
      });
    }

    if (Array.isArray(filters.cuisines) && filters.cuisines.length > 0) {
      pool = pool.filter(c => filters.cuisines.some(cuisine => cuisine.toLowerCase() === (c.cuisine || '').toLowerCase()));
    }

    if (Array.isArray(filters.restaurantTypes) && filters.restaurantTypes.length > 0) {
      pool = pool.filter(c => {
        const types = c.restaurantType || ['Dine-in', 'Casual Dining'];
        return filters.restaurantTypes.some(t => types.includes(t));
      });
    }

    if (Array.isArray(filters.dietary) && filters.dietary.length > 0) {
      pool = pool.filter(c => {
        if (filters.dietary.includes('halal') && c.halal === false) return false;
        if (filters.dietary.includes('vegetarian') && !c.vegetarian) return false;
        if (filters.dietary.includes('vegan') && !c.vegan) return false;
        if (filters.dietary.includes('no_beef') && !c.no_beef) return false;
        return true;
      });
    }

    if (Array.isArray(filters.features) && filters.features.length > 0) {
      pool = pool.filter(c => {
        const feat = c.features || [];
        return filters.features.every(f => feat.includes(f));
      });
    }
  }

  if (pool.length === 0) return [];

  // Compute candidate-set mean rating for Bayesian calculation
  const totalRating = pool.reduce((acc, c) => acc + (c.rating || 4.0), 0);
  const meanRating = totalRating / pool.length;

  // Add transport costs, closing soon, and preference verification status to each candidate
  const enriched = pool.map(c => {
    const transport = getTransportSummary(c.distanceMeters || 1500, c.durationSeconds || 900, c.trafficLevel || 'Moderate');
    const closingStatus = evaluateClosingSoon(c.regularOpeningHours, c.durationSeconds || 900);
    const openStatus = getDhakaOpeningStatus(c.regularOpeningHours);
    const bayesianRating = calculateBayesianRating(c.rating, c.userRatingCount, meanRating);

    // Preference metadata (marked unverified with allergen disclaimer)
    const dietaryVerification = {
      isVerified: false,
      status: preferencesConfig.verificationStatus || 'unverified',
      label: 'unverified',
      disclaimer: preferencesConfig.disclaimer
    };

    return {
      ...c,
      estimatedCostPerPerson: c.estimatedCostPerPerson || c.menu?.estimatedCostPerPerson || null,
      estimatedCostPerPersonBdt: c.estimatedCostPerPersonBdt || c.menu?.estimatedCostPerPerson?.amount || null,
      transport,
      closingStatus,
      openStatus,
      bayesianRating,
      dietaryVerification
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

  // Active weights selection
  let activeWeights = weightsConfig[priority] || weightsConfig['Best Overall'];
  let weights = { ...activeWeights };

  // Personal weights bandit integration (with strict guardrails)
  let banditNote = null;
  if (banditProfile && banditProfile.enabled && featureFlags.enableBanditPersonalWeights) {
    if (priority === 'Personalized') {
      weights = projectWeightsToSimplexBounds(banditProfile.weights, 0.05, 0.50);
    } else {
      // Gentle blend: 85% preset weights, 15% bandit learned weights
      const banditProjected = projectWeightsToSimplexBounds(banditProfile.weights, 0.05, 0.50);
      for (const k of Object.keys(weights)) {
        if (banditProjected[k] !== undefined) {
          weights[k] = (weights[k] * 0.85) + (banditProjected[k] * 0.15);
        }
      }
    }
    banditNote = generateBanditExplanation(banditProfile.weights);
  }

  // Apply companion profile adjustments from context.json
  const companionProfile = companion ? contextConfig.companionProfiles[companion] : null;
  if (companionProfile && companionProfile.weightAdjustments) {
    for (const [k, mult] of Object.entries(companionProfile.weightAdjustments)) {
      if (weights[k] !== undefined) {
        weights[k] = weights[k] * mult;
      }
    }
  }

  // Apply taste weight distribution if tasteProfile is provided
  const hasTasteProfile = tasteProfile && Object.keys(tasteProfile).length > 0;
  if (hasTasteProfile && priority !== 'Personalized' && (!banditProfile || !banditProfile.enabled)) {
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

  // Context Signals: Time-of-day & weekend detection (UTC+6 for Dhaka)
  const dhakaHour = (now.getUTCHours() + 6) % 24;
  const dhakaDay = (now.getUTCDay() + (now.getUTCHours() + 6 >= 24 ? 1 : 0)) % 7;
  const isWeekend = contextConfig.weekendDays.includes(dhakaDay);

  let activeTimeSlot = null;
  for (const [slotKey, slotData] of Object.entries(contextConfig.timeOfDay)) {
    if (slotData.startHour <= slotData.endHour) {
      if (dhakaHour >= slotData.startHour && dhakaHour <= slotData.endHour) {
        activeTimeSlot = slotData;
        break;
      }
    } else {
      if (dhakaHour >= slotData.startHour || dhakaHour <= slotData.endHour) {
        activeTimeSlot = slotData;
        break;
      }
    }
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
    // Same fallbacks as the extrema above: a missing (null) travel time must not
    // coerce to 0 and score as the fastest option.
    const ratingFactor = normalize(c.bayesianRating, minRating, maxRating, false);
    const timeFactor = normalize(c.durationSeconds || 900, minDuration, maxDuration, true);
    const distanceFactor = normalize(c.distanceMeters || 1500, minDistance, maxDistance, true);
    const trafficFactor = normalize(c.trafficRatio || 1.2, minTraffic, maxTraffic, true);
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
      weatherPenalty = 5;
    }

    // Budget fit
    let budgetPenalty = 0;
    const userBudgetNum = parseInt(budget, 10) || 2;
    if (c.priceLevel && c.priceLevel > userBudgetNum) {
      budgetPenalty = (c.priceLevel - userBudgetNum) * 10;
    }

    // Cuisine match bonus
    let cuisineBonus = 0;
    if (cuisine && cuisine !== 'All' && c.cuisine && matchesCuisine(c.cuisine, cuisine)) {
      cuisineBonus = 5;
    }

    // Context signal bonus: Time-of-day match (+5 points)
    let contextBonus = 0;
    if (activeTimeSlot && activeTimeSlot.recommendedCuisines && c.cuisine) {
      if (activeTimeSlot.recommendedCuisines.some(rc => rc.toLowerCase() === c.cuisine.toLowerCase())) {
        contextBonus += 5;
      }
    }

    // Context signal bonus: Companion match (+15 points)
    if (companionProfile && companionProfile.preferredCuisines && c.cuisine) {
      if (companionProfile.preferredCuisines.some(pc => pc.toLowerCase() === c.cuisine.toLowerCase())) {
        contextBonus += 15;
      }
    }

    // Context signal bonus: Dhaka weekend leisure dining (+3 points)
    if (isWeekend && ['Kabab', 'Biriyani', 'Cafe', 'Indian', 'Japanese'].includes(c.cuisine)) {
      contextBonus += 3;
    }

    // Food profile preferred cuisine match bonus (+12 points)
    let foodProfileBonus = 0;
    if (foodProfile && Array.isArray(foodProfile.preferredCuisines) && c.cuisine) {
      if (foodProfile.preferredCuisines.some(pc => pc.toLowerCase() === c.cuisine.toLowerCase())) {
        foodProfileBonus = 12;
      }
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

    let finalScore = baseScore + cuisineBonus + contextBonus + foodProfileBonus - budgetPenalty - weatherPenalty - closingPenalty;

    // Optional collaborative filtering blend
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

  // Sort descending by score, or ascending by distance if priority is Closest
  if (priority === 'Closest') {
    scored.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  // Assign Badges
  let fastestId = null;
  let minDurationSec = Infinity;
  let bestPriceId = null;
  let minCombinedPrice = Infinity;

  for (const item of scored) {
    if (Number.isFinite(item.durationSeconds) && item.durationSeconds < minDurationSec) {
      minDurationSec = item.durationSeconds;
      fastestId = item.id;
    }
    const combinedPrice = (item.priceLevel || 2) * 20 + item.transport.cheapestEstimatedCostBdt;
    if (combinedPrice < minCombinedPrice) {
      minCombinedPrice = combinedPrice;
      bestPriceId = item.id;
    }
  }

  const topPickCandidate = scored[0];
  const counterfactualExplanation = topPickCandidate
    ? generateCounterfactualExplanation(topPickCandidate, scored, priority)
    : null;

  return scored.map((item, index) => {
    const badges = [];
    if (index === 0) {
      badges.push(priority === 'Closest' ? 'Closest' : 'Best Overall');
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
      : generateRecommendationReason(item, scored, priority, item.factorBreakdown.taste / 100, weatherContext, foodProfile);

    return {
      ...item,
      badges: [...new Set(badges)],
      reason,
      banditNote: index === 0 ? banditNote : null,
      counterfactual: index === 0 ? counterfactualExplanation : null
    };
  });
}

export default {
  calculateBayesianRating,
  normalize,
  evaluateClosingSoon,
  getDhakaOpeningStatus,
  generateRecommendationReason,
  generateCounterfactualExplanation,
  rankRestaurants
};
