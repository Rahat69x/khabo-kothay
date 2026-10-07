import cuisinesConfig from '../config/cuisines.json' with { type: 'json' };
import tasteConfig from '../config/taste.json' with { type: 'json' };

const SIMILARITY_MAP = cuisinesConfig.similarity;

/**
 * Calculates similarity between two cuisines (0.0 to 1.0)
 */
export function getCuisineSimilarity(c1, c2) {
  if (!c1 || !c2) return 0;
  if (c1.toLowerCase() === c2.toLowerCase()) return 1.0;
  
  const map1 = SIMILARITY_MAP[c1];
  if (map1 && map1[c2] !== undefined) return map1[c2];

  const map2 = SIMILARITY_MAP[c2];
  if (map2 && map2[c1] !== undefined) return map2[c1];

  return 0.1; // Baseline fallback
}

/**
 * Identify top liked cuisines from a taste profile (score >= 60)
 */
export function getLikedCuisines(tasteProfile = {}) {
  return Object.entries(tasteProfile)
    .filter(([_, score]) => score >= 60)
    .sort((a, b) => b[1] - a[1])
    .map(([cuisine]) => cuisine);
}

/**
 * Identify candidate exploration spots that are similar to user's liked cuisines,
 * but not already over-consumed, well-rated (>= 4.0), and reasonable travel time (< 2100s)
 */
export function selectExplorationCandidates(candidates, tasteProfile = {}, options = {}) {
  const explorationRate = options.surpriseMe ? 0.40 : tasteConfig.explorationRate;
  const maxExplorationCount = Math.max(1, Math.round(candidates.length * explorationRate));

  const likedCuisines = getLikedCuisines(tasteProfile);
  if (likedCuisines.length === 0) {
    // If no strong preferences yet, any highly rated unique spot can be an exploration pick
    return [];
  }

  const explorationPicks = [];

  for (const item of candidates) {
    const cuisine = item.cuisine;
    const score = tasteProfile[cuisine] ?? 50;

    // Disliked cuisines (< 35) are NEVER recommended for discovery
    if (score < 35) continue;

    // Must be rated >= 4.0 and duration <= 2100s (35 min)
    if (item.rating < 4.0 || (item.durationSeconds && item.durationSeconds > 2100)) continue;

    // If cuisine is not already one of user's dominant high scores (e.g. score < 65)
    // but has high similarity with at least one liked cuisine
    if (score < 65) {
      let maxSim = 0;
      let matchedLikedCuisine = null;

      for (const liked of likedCuisines) {
        const sim = getCuisineSimilarity(cuisine, liked);
        if (sim > maxSim) {
          maxSim = sim;
          matchedLikedCuisine = liked;
        }
      }

      if (maxSim >= 0.5) {
        explorationPicks.push({
          candidateId: item.id,
          cuisine,
          matchedLikedCuisine,
          similarity: maxSim,
          reason: `You usually like ${matchedLikedCuisine} food, so you may enjoy this ${cuisine} option.`
        });
      }
    }

    if (explorationPicks.length >= maxExplorationCount) break;
  }

  return explorationPicks;
}
