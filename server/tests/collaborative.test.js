import { describe, it, expect } from 'vitest';
import { getCollaborativePredictions, cosineSimilarity } from '../services/collaborative.js';

describe('Collaborative Filtering Engine (Stage 15)', () => {
  it('Cosine similarity correctly calculates agreement between users', () => {
    const userA = { rest_1: 3, rest_2: 2, rest_3: -2 };
    const userB = { rest_1: 3, rest_2: 2, rest_3: -2 };
    const userC = { rest_1: -2, rest_2: -2, rest_3: 3 };

    const simAB = cosineSimilarity(userA, userB);
    const simAC = cosineSimilarity(userA, userC);

    expect(simAB).toBeCloseTo(1.0, 2);
    expect(simAC).toBeLessThan(0);
  });

  it('Recommends restaurants liked by similar users', () => {
    // Current user likes mock_jap_1 and mock_jap_2 (similar to JapaneseLovers seed archetype)
    const activeUser = { mock_jap_1: 3, mock_jap_2: 3 };
    const candidates = ['trio_place_A', 'mock_ff_1'];

    const result = getCollaborativePredictions(activeUser, candidates);
    expect(result.hasEnoughData).toBe(true);
    // trio_place_A is also in JapaneseLovers archetype, so it should receive a high score
    expect(result.predictions.trio_place_A).toBeGreaterThan(60);
  });

  it('Clean fallback on cold start (empty user history)', () => {
    const emptyUser = {};
    const result = getCollaborativePredictions(emptyUser, ['trio_place_A']);
    expect(result.hasEnoughData).toBe(false);
    expect(result.predictions).toEqual({});
  });
});
