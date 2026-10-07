import { describe, it, expect } from 'vitest';
import { selectExplorationCandidates } from '../services/discovery.js';

describe('Discovery Engine (Stage 13)', () => {
  const candidates = [
    { id: '1', cuisine: 'Korean', rating: 4.6, durationSeconds: 900 },
    { id: '2', cuisine: 'Chinese', rating: 4.5, durationSeconds: 850 },
    { id: '3', cuisine: 'Fast Food', rating: 4.2, durationSeconds: 700 },
    { id: '4', cuisine: 'Burger', rating: 3.8, durationSeconds: 600 }, // low rating
    { id: '5', cuisine: 'Kabab', rating: 4.7, durationSeconds: 2500 } // long duration
  ];

  it('Picks cuisines similar to liked ones (e.g. Japanese lover gets Korean)', () => {
    const tasteProfile = {
      Japanese: 85, // Highly liked
      Korean: 50,   // Neutral / unexplored
      Chinese: 50,
      'Fast Food': 20 // Disliked
    };

    const exploration = selectExplorationCandidates(candidates, tasteProfile);
    expect(exploration.length).toBeGreaterThan(0);
    const koreanPick = exploration.find(e => e.cuisine === 'Korean');
    expect(koreanPick).toBeDefined();
    expect(koreanPick.matchedLikedCuisine).toBe('Japanese');
  });

  it('Respects the exploration cap', () => {
    const tasteProfile = { Japanese: 90 };
    const exploration = selectExplorationCandidates(candidates, tasteProfile, { surpriseMe: false });
    // Default exploration rate is 20% of candidate length (5 * 0.2 = 1)
    expect(exploration.length).toBeLessThanOrEqual(2);
  });

  it('Never returns cuisines user has disliked', () => {
    const tasteProfile = {
      Japanese: 90,
      Korean: 20 // Explicitly disliked
    };

    const exploration = selectExplorationCandidates(candidates, tasteProfile);
    const dislikedPick = exploration.find(e => e.cuisine === 'Korean');
    expect(dislikedPick).toBeUndefined();
  });
});
