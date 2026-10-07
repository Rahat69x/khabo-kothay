import { describe, it, expect } from 'vitest';
import { normalizePriceLevel, getCuisineQuery } from '../services/places.js';
import { determineTrafficLevel, computeTravelTimes } from '../services/routes.js';

describe('Google Clients Response Parsing & Failure Resilience', () => {
  it('Normalizes Google Places priceLevel enums and raw numbers to 1-4 or null', () => {
    expect(normalizePriceLevel('PRICE_LEVEL_INEXPENSIVE')).toBe(1);
    expect(normalizePriceLevel('PRICE_LEVEL_MODERATE')).toBe(2);
    expect(normalizePriceLevel('PRICE_LEVEL_EXPENSIVE')).toBe(3);
    expect(normalizePriceLevel('PRICE_LEVEL_VERY_EXPENSIVE')).toBe(4);
    expect(normalizePriceLevel(1)).toBe(1);
    expect(normalizePriceLevel(4)).toBe(4);
    expect(normalizePriceLevel(null)).toBeNull();
    expect(normalizePriceLevel(undefined)).toBeNull();
    expect(normalizePriceLevel('PRICE_LEVEL_UNSPECIFIED')).toBeNull();
  });

  it('Maps cuisine chips to keyword queries', () => {
    const jap = getCuisineQuery('Japanese');
    expect(jap.keyword).toContain('japanese');

    const all = getCuisineQuery('All');
    expect(all.keyword).toBe('restaurant');
  });

  it('Calculates traffic levels accurately according to thresholds', () => {
    // Low: ratio < 1.15
    expect(determineTrafficLevel(1000, 1000)).toBe('Low');
    expect(determineTrafficLevel(1100, 1000)).toBe('Low');

    // Moderate: 1.15 to 1.50
    expect(determineTrafficLevel(1300, 1000)).toBe('Moderate');
    expect(determineTrafficLevel(1500, 1000)).toBe('Moderate');

    // Heavy: > 1.50
    expect(determineTrafficLevel(1700, 1000)).toBe('Heavy');
    expect(determineTrafficLevel(2500, 1000)).toBe('Heavy');
  });

  it('Handles partial destination errors or empty input in computeTravelTimes without crashing', async () => {
    const empty = await computeTravelTimes({ lat: 23.79, lng: 90.41 }, [], true);
    expect(empty).toEqual([]);

    const destinations = [
      { id: 'dest_1', location: { latitude: 23.792, longitude: 90.415 } },
      { id: 'dest_2', location: { latitude: 23.795, longitude: 90.418 } }
    ];

    const results = await computeTravelTimes({ lat: 23.79, lng: 90.41 }, destinations, true);
    expect(results).toHaveLength(2);
    expect(results[0].durationSeconds).toBeGreaterThan(0);
    expect(results[1].distanceMeters).toBeGreaterThan(0);
  });
});
