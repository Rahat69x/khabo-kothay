import faresConfig from '../config/fares.json' with { type: 'json' };

/**
 * Transport Cost Estimator for Dhaka (Gulshan / Banani / Baridhara / Notun Bazar)
 * Editable model supporting Walk, Rickshaw, CNG, and Car/Ride-share
 */

/**
 * Estimate transport cost for a specific mode
 * @param {string} mode - 'walk' | 'rickshaw' | 'cng' | 'car'
 * @param {number} distanceMeters - Travel distance in meters
 * @param {number} durationSeconds - Travel duration in seconds (traffic aware)
 * @param {string} trafficLevel - 'Low' | 'Moderate' | 'Heavy'
 * @returns {object} { mode, modeName, estimatedCostBdt, isEstimate: true, breakdown, feasible }
 */
export function estimateCost(mode, distanceMeters, durationSeconds, trafficLevel = 'Moderate') {
  const model = faresConfig[mode];
  if (!model) {
    throw new Error(`Unknown transport mode: ${mode}`);
  }

  const distanceKm = Math.max(0, distanceMeters / 1000);
  const durationMinutes = Math.max(0, durationSeconds / 60);
  const tKey = String(trafficLevel).toLowerCase();
  const trafficMultiplier = model.trafficMultiplier[tKey] || 1.0;

  let baseCost = model.baseFare;
  let distanceCost = distanceKm * model.perKm;
  let timeCost = durationMinutes * (model.perMinute || 0);

  let rawTotal = (baseCost + distanceCost + timeCost) * trafficMultiplier;

  // Round to nearest 5 BDT (standard cash/payment in Dhaka)
  let roundedCost = Math.round(rawTotal / 5) * 5;
  if (mode === 'walk') {
    roundedCost = 0;
  }

  const isFeasible = distanceMeters <= (model.maxFeasibleDistanceMeters || 50000);

  return {
    mode,
    modeName: model.name,
    estimatedCostBdt: roundedCost,
    isEstimate: true,
    feasible: isFeasible,
    breakdown: {
      baseFare: model.baseFare,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Math.round(durationMinutes),
      trafficLevel,
      trafficMultiplier,
      calculation: `${model.baseFare} base + ${model.perKm}/km${model.perMinute ? ` + ${model.perMinute}/min` : ''} (x${trafficMultiplier} ${trafficLevel} traffic)`
    }
  };
}

/**
 * Compute transport cost breakdown for all modes and identify the cheapest feasible mode
 */
export function getTransportSummary(distanceMeters, durationSeconds, trafficLevel = 'Moderate') {
  const modes = ['walk', 'rickshaw', 'cng', 'car'];
  const breakdown = {};

  for (const m of modes) {
    breakdown[m] = estimateCost(m, distanceMeters, durationSeconds, trafficLevel);
  }

  // Find cheapest feasible mode
  let cheapestFeasible = null;
  for (const m of modes) {
    const item = breakdown[m];
    if (item.feasible) {
      if (!cheapestFeasible || item.estimatedCostBdt < cheapestFeasible.estimatedCostBdt) {
        cheapestFeasible = item;
      }
    }
  }

  // If no feasible mode, default to car or CNG
  if (!cheapestFeasible) {
    cheapestFeasible = breakdown.car;
  }

  return {
    breakdown,
    cheapestFeasibleMode: cheapestFeasible.mode,
    cheapestEstimatedCostBdt: cheapestFeasible.estimatedCostBdt,
    isEstimate: true
  };
}
