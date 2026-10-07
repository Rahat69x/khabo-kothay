import { describe, it, expect } from 'vitest';
import { applyMoodCriteria, getMoodConfig } from '../services/mood.js';

describe('Mood Engine (Stage 14)', () => {
  const candidatePool = [
    { id: '1', cuisine: 'Biriyani', priceLevel: 1, rating: 4.5 },
    { id: '2', cuisine: 'Fast Food', priceLevel: 1, rating: 4.1 },
    { id: '3', cuisine: 'Japanese', priceLevel: 4, rating: 4.8 },
    { id: '4', cuisine: 'Dessert', priceLevel: 2, rating: 4.7 },
    { id: '5', cuisine: 'Coffee', priceLevel: 2, rating: 4.6 },
    { id: '6', cuisine: 'Indian', priceLevel: 2, rating: 4.0 }
  ];

  it('Sweet mood maps to Dessert and Cafe cuisines', () => {
    const config = getMoodConfig('Sweet');
    expect(config.cuisines).toContain('Dessert');
    const results = applyMoodCriteria(candidatePool, 'Sweet');
    const dessertItem = results.find(r => r.cuisine === 'Dessert');
    expect(dessertItem.isDirectMoodMatch).toBe(true);
  });

  it('Budget friendly never returns price level 4', () => {
    const results = applyMoodCriteria(candidatePool, 'Budget friendly');
    const expensive = results.find(r => r.priceLevel === 4);
    expect(expensive).toBeUndefined();
  });

  it('Fine dining requires price level 3-4 and rating >= 4.3', () => {
    const results = applyMoodCriteria(candidatePool, 'Fine dining');
    for (const r of results) {
      expect(r.priceLevel).toBeGreaterThanOrEqual(3);
      expect(r.rating).toBeGreaterThanOrEqual(4.3);
    }
  });
});
