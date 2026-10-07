import tasteConfig from '../config/taste.json' with { type: 'json' };

/**
 * In-memory interaction matrix for collaborative filtering
 * Maps userId -> { [restaurantId]: interactionScore }
 * Positive interactions: favorited (+3), directions (+2), viewed (+1)
 * Negative interactions: dismissed (-2)
 */
export const userInteractionMatrix = new Map();

/**
 * Generate 50 realistic synthetic users with preferences for testing collaborative filtering
 */
export function seedSyntheticUsers() {
  userInteractionMatrix.clear();

  const archetypes = [
    { name: 'JapaneseLovers', likes: ['mock_jap_1', 'mock_jap_2', 'trio_place_A'], dislikes: ['mock_ff_1', 'mock_bir_1'] },
    { name: 'BiriyaniKababFans', likes: ['mock_bir_1', 'mock_bir_2', 'mock_kab_1', 'mock_bd_1'], dislikes: ['mock_des_1', 'mock_jap_3'] },
    { name: 'CafeCoffeeChic', likes: ['mock_caf_1', 'mock_cof_1', 'mock_des_1'], dislikes: ['mock_bir_1', 'mock_kab_1'] },
    { name: 'QuickBudgetBites', likes: ['mock_ff_1', 'mock_bur_1', 'mock_bd_1'], dislikes: ['mock_jap_3', 'trio_place_C'] },
    { name: 'FineDiners', likes: ['mock_jap_3', 'mock_kor_1', 'trio_place_C'], dislikes: ['mock_ff_1', 'mock_bir_2'] }
  ];

  for (let i = 1; i <= 50; i++) {
    const userId = `seed_user_${i}`;
    const archetype = archetypes[i % archetypes.length];
    const interactions = {};

    for (const rId of archetype.likes) {
      interactions[rId] = 2.0 + (Math.random() > 0.4 ? 1.0 : 0.0); // 2 or 3
    }
    for (const rId of archetype.dislikes) {
      if (Math.random() > 0.5) {
        interactions[rId] = -2.0;
      }
    }
    userInteractionMatrix.set(userId, interactions);
  }
}

// Automatically seed on initialization
seedSyntheticUsers();

/**
 * Computes cosine similarity between two interaction vectors
 */
export function cosineSimilarity(vecA = {}, vecB = {}) {
  const keysA = Object.keys(vecA);
  const keysB = Object.keys(vecB);
  if (keysA.length === 0 || keysB.length === 0) return 0;

  // Find common items (overlap)
  const common = keysA.filter(k => vecB[k] !== undefined);
  if (common.length < (tasteConfig.collaborative.minUserOverlap || 2)) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const k of keysA) {
    normA += vecA[k] * vecA[k];
  }
  for (const k of keysB) {
    normB += vecB[k] * vecB[k];
  }
  for (const k of common) {
    dotProduct += vecA[k] * vecB[k];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Predicts collaborative score (0-100) for candidate restaurants given user's recent interactions
 */
export function getCollaborativePredictions(userInteractions = {}, candidateIds = []) {
  if (!userInteractions || Object.keys(userInteractions).length === 0) {
    return { predictions: {}, hasEnoughData: false };
  }

  // Find most similar users in the interaction matrix
  const similarities = [];
  for (const [otherId, otherInteractions] of userInteractionMatrix.entries()) {
    const sim = cosineSimilarity(userInteractions, otherInteractions);
    if (sim > 0.2) {
      similarities.push({ otherId, sim, interactions: otherInteractions });
    }
  }

  if (similarities.length === 0) {
    return { predictions: {}, hasEnoughData: false };
  }

  // Aggregate weighted ratings for candidate restaurants
  const predictions = {};
  for (const rId of candidateIds) {
    let weightedSum = 0;
    let simSum = 0;

    for (const { sim, interactions } of similarities) {
      if (interactions[rId] !== undefined) {
        weightedSum += sim * interactions[rId];
        simSum += Math.abs(sim);
      }
    }

    if (simSum > 0) {
      // Map interaction score (-2 to +3) into 0-100
      const predictedVal = weightedSum / simSum;
      const normalizedScore = Math.max(0, Math.min(100, Math.round(((predictedVal + 2) / 5) * 100)));
      predictions[rId] = normalizedScore;
    }
  }

  return {
    predictions,
    hasEnoughData: Object.keys(predictions).length > 0
  };
}
