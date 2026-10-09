import { describe, it, expect } from 'vitest';
import {
  getLocalRecommendations,
  getLocalMealTime,
  getLocalWeather,
  getLocalRouteComparison
} from '../src/services/localEngine.js';
import { EMBEDDED_RESTAURANTS } from '../src/data/embedded-restaurants.js';

describe('Local Recommendation Engine & Offline Resilience', () => {
  it('has embedded Dhaka restaurants across all major cuisines', () => {
    expect(EMBEDDED_RESTAURANTS.length).toBeGreaterThanOrEqual(20);
    const cuisines = new Set(EMBEDDED_RESTAURANTS.map(r => r.cuisine));
    expect(cuisines.has('Japanese')).toBe(true);
    expect(cuisines.has('Bangladeshi')).toBe(true);
    expect(cuisines.has('Indian')).toBe(true);
    expect(cuisines.has('Chinese')).toBe(true);
    expect(cuisines.has('Cafe')).toBe(true);
  });

  it('generates ranked recommendations with complete UI contract fields', () => {
    const data = getLocalRecommendations({
      lat: 23.7975,
      lng: 90.4234,
      cuisine: 'All',
      priority: 'Best Overall',
      budget: 2
    });

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.topPicks).toBeDefined();
    expect(data.topPicks.bestMatch).toBeDefined();
    expect(data.isLocalFallback).toBe(true);

    const first = data.results[0];
    expect(first.displayName).toBeDefined();
    expect(first.score).toBeGreaterThan(0);
    expect(first.badges).toContain('Best Overall');
    expect(first.transport).toBeDefined();
    expect(first.transport.cheapestEstimatedCostBdt).toBeGreaterThanOrEqual(0);
    expect(first.transport.cheapestFeasibleMode).toBeDefined();
    expect(first.departurePredictions?.bestSuggestion?.message).toBeDefined();
  });

  it('correctly handles Vegetarian preference without returning 0 results', () => {
    const data = getLocalRecommendations({
      lat: 23.7975,
      lng: 90.4234,
      cuisine: 'All',
      priority: 'Best Overall',
      budget: 2,
      preferences: { vegetarian: true }
    });

    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.every(r => r.vegetarian === true)).toBe(true);
  });

  it('handles all priority sortings properly', () => {
    const priorities = ['Fastest', 'Closest', 'Cheapest', 'Best Rated', 'Best Value', 'Best Overall'];
    for (const p of priorities) {
      const res = getLocalRecommendations({
        lat: 23.7975,
        lng: 90.4234,
        cuisine: 'All',
        priority: p
      });
      expect(res.results.length).toBeGreaterThan(0);
    }
  });

  it('solves Meal-Time timeline with safe buffer and valid candidate structures', () => {
    const meal = getLocalMealTime({
      mode: 'lunch',
      availableMinutes: 45,
      origin: { lat: 23.7975, lng: 90.4234, name: 'Gulshan 2' },
      bufferPreference: 'Balanced'
    });

    expect(meal.results.length).toBeGreaterThan(0);
    const candidate = meal.results[0];

    expect(candidate.name).toBeDefined();
    expect(candidate.status).toMatch(/SAFE|TIGHT|NOT_RECOMMENDED/);
    expect(candidate.backByTime).toBeDefined();
    expect(candidate.openCheck).toBeDefined();
    expect(candidate.openCheck.closesAt).toBeDefined();

    expect(candidate.timeBreakdown).toBeDefined();
    expect(candidate.timeBreakdown.outbound).toBeGreaterThan(0);
    expect(candidate.timeBreakdown.wait).toBeGreaterThan(0);
    expect(candidate.timeBreakdown.eat).toBeGreaterThan(0);
    expect(candidate.timeBreakdown.return).toBeGreaterThan(0);
    expect(candidate.timeBreakdown.buffer).toBeGreaterThan(0);
    expect(candidate.timeBreakdown.total).toBeGreaterThan(0);
    expect(typeof candidate.timeBreakdown.spareMinutes).toBe('number');
  });

  it('provides route comparison and Dhaka weather', () => {
    const weather = getLocalWeather();
    expect(weather.temperature).toBeGreaterThan(20);
    expect(weather.condition).toBeDefined();

    const route = getLocalRouteComparison(
      { lat: 23.7975, lng: 90.4234 },
      { lat: 23.7785, lng: 90.4178 }
    );
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.transport.modes.rickshaw).toBeDefined();
  });
});
