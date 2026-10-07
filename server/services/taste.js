import tasteConfig from '../config/taste.json' with { type: 'json' };
import cuisinesConfig from '../config/cuisines.json' with { type: 'json' };

const ALL_CUISINES = cuisinesConfig.cuisines;

/**
 * Returns a default neutral taste profile (50 for all cuisines)
 */
export function getDefaultTasteProfile() {
  const profile = {};
  for (const c of ALL_CUISINES) {
    profile[c] = tasteConfig.defaultScore;
  }
  return profile;
}

/**
 * Clamps a score between minScore and maxScore (0 - 100)
 */
export function clampScore(score) {
  return Math.max(tasteConfig.minScore, Math.min(tasteConfig.maxScore, Math.round(score * 10) / 10));
}

/**
 * Update taste profile using Exponential Moving Average based on an interaction signal
 * @param {object} currentProfile - { Japanese: 50, ... }
 * @param {object} event - { type: 'chose'|'directions'|'favorited'|'viewed'|'searched'|'dismissed'|'rated_high'|'rated_low', cuisine: string }
 * @returns {object} updatedProfile
 */
export function recordEvent(currentProfile = {}, event = {}) {
  const profile = { ...getDefaultTasteProfile(), ...currentProfile };
  const cuisine = event.cuisine;
  if (!cuisine || !profile[cuisine]) {
    // If cuisine not directly in map, try case-insensitive lookup
    const match = ALL_CUISINES.find(c => c.toLowerCase() === (cuisine || '').toLowerCase());
    if (match) {
      return recordEvent(currentProfile, { ...event, cuisine: match });
    }
    return profile;
  }

  const signalWeight = tasteConfig.signalWeights[event.type] || 0;
  if (signalWeight === 0) return profile;

  const currentScore = profile[cuisine];
  // Target direction: positive signals pull towards 100, negative pull towards 0
  const target = signalWeight > 0 ? 100 : 0;
  const impact = Math.abs(signalWeight) / 100; // e.g. 0.20 for chose (+20)
  const alpha = tasteConfig.learningRate * impact; // scaled EMA step

  let updatedScore;
  if (signalWeight > 0) {
    updatedScore = currentScore + alpha * (100 - currentScore);
  } else {
    updatedScore = currentScore - alpha * currentScore;
  }

  profile[cuisine] = clampScore(updatedScore);
  return profile;
}

/**
 * Applies slow time decay toward neutral (50)
 * @param {object} profile
 * @param {number} steps - number of decay periods (default 1)
 */
export function decayProfile(profile = {}, steps = 1) {
  const base = { ...getDefaultTasteProfile(), ...profile };
  const target = tasteConfig.decayTarget;
  const factor = Math.pow(tasteConfig.decayFactor, steps);

  const decayed = {};
  for (const c of ALL_CUISINES) {
    const score = base[c] ?? target;
    decayed[c] = clampScore(target + (score - target) * factor);
  }
  return decayed;
}

/**
 * Resets a taste profile back to default
 */
export function resetProfile() {
  return getDefaultTasteProfile();
}
