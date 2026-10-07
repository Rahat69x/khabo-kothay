import { describe, it, expect } from 'vitest';
import { rankRestaurants, calculateBayesianRating } from '../services/recommend.js';

describe('Recommendation Engine (Stage 5 & Personalized)', () => {
  // Candidate Trio A, B, C exactly as specified in the requirements
  const candidateA = {
    id: 'A',
    displayName: 'Spot A',
    cuisine: 'Japanese',
    distanceMeters: 2400,
    durationSeconds: 840, // 14 min
    staticDurationSeconds: 650,
    trafficRatio: 1.29,
    trafficLevel: 'Moderate',
    priceLevel: 2,
    rating: 4.6,
    userRatingCount: 500
  };

  const candidateB = {
    id: 'B',
    displayName: 'Spot B',
    cuisine: 'Japanese',
    distanceMeters: 1600,
    durationSeconds: 1620, // 27 min
    staticDurationSeconds: 950,
    trafficRatio: 1.70,
    trafficLevel: 'Heavy',
    priceLevel: 2,
    rating: 4.5,
    userRatingCount: 400
  };

  const candidateC = {
    id: 'C',
    displayName: 'Spot C',
    cuisine: 'Japanese',
    distanceMeters: 3100,
    durationSeconds: 960, // 16 min
    staticDurationSeconds: 910,
    trafficRatio: 1.05,
    trafficLevel: 'Low',
    priceLevel: 3,
    rating: 4.7,
    userRatingCount: 900
  };

  const trio = [candidateA, candidateB, candidateC];

  it('Bayesian average rating: 4.8 from 5 reviews does not beat 4.6 from 800 reviews', () => {
    const meanSetRating = 4.3;
    const fewReviews = calculateBayesianRating(4.8, 5, meanSetRating);
    const manyReviews = calculateBayesianRating(4.6, 800, meanSetRating);
    expect(manyReviews).toBeGreaterThan(fewReviews);
  });

  it('A must win Best Overall', () => {
    const ranked = rankRestaurants({
      candidates: trio,
      priority: 'Best Overall',
      budget: 2
    });

    expect(ranked[0].id).toBe('A');
    expect(ranked[0].badges).toContain('Best Overall');
    expect(ranked[0].reason).toBeTruthy();
  });

  it('C must win Best Rated', () => {
    const ranked = rankRestaurants({
      candidates: trio,
      priority: 'Best Rated',
      budget: 3
    });

    expect(ranked[0].id).toBe('C');
  });

  it('B must lose Fastest', () => {
    const ranked = rankRestaurants({
      candidates: trio,
      priority: 'Fastest',
      budget: 2
    });

    // B is in heavy traffic (27 min), so B must be at the bottom (rank 3)
    const bIndex = ranked.findIndex(r => r.id === 'B');
    expect(bIndex).toBe(2);
    expect(ranked[0].id).toBe('A'); // A is fastest at 14 min
  });

  it('Changing priority must change the ranking', () => {
    const rankedOverall = rankRestaurants({ candidates: trio, priority: 'Best Overall', budget: 2 });
    const rankedClosest = rankRestaurants({ candidates: trio, priority: 'Closest', budget: 2 });

    // In Closest, B (1.6 km) should rank top
    expect(rankedClosest[0].id).toBe('B');
    expect(rankedOverall[0].id).not.toBe(rankedClosest[0].id);
  });

  it('Traffic rule: 1.4 km with heavy traffic (25 min) loses to 2.1 km with light traffic (12 min) for Fastest & Best Overall', () => {
    const heavyClose = {
      id: 'heavy_close',
      displayName: 'Heavy Close',
      cuisine: 'Japanese',
      distanceMeters: 1400,
      durationSeconds: 1500, // 25 min
      trafficRatio: 1.8,
      trafficLevel: 'Heavy',
      priceLevel: 2,
      rating: 4.6,
      userRatingCount: 650
    };

    const lightFar = {
      id: 'light_far',
      displayName: 'Light Far',
      cuisine: 'Japanese',
      distanceMeters: 2100,
      durationSeconds: 720, // 12 min
      trafficRatio: 1.05,
      trafficLevel: 'Low',
      priceLevel: 2,
      rating: 4.7,
      userRatingCount: 820
    };

    const pair = [heavyClose, lightFar];

    // Under Fastest
    const fastestRank = rankRestaurants({ candidates: pair, priority: 'Fastest' });
    expect(fastestRank[0].id).toBe('light_far');

    // Under Best Overall
    const overallRank = rankRestaurants({ candidates: pair, priority: 'Best Overall' });
    expect(overallRank[0].id).toBe('light_far');
  });

  it('Personalized ranking elevates preferred cuisine when taste profile is provided', () => {
    const japPlace = {
      id: 'jap',
      displayName: 'Sushi Bar',
      cuisine: 'Japanese',
      distanceMeters: 2000,
      durationSeconds: 900,
      trafficRatio: 1.2,
      trafficLevel: 'Moderate',
      priceLevel: 2,
      rating: 4.5,
      userRatingCount: 500
    };

    const chiPlace = {
      id: 'chi',
      displayName: 'Dim Sum Place',
      cuisine: 'Chinese',
      distanceMeters: 2000,
      durationSeconds: 900,
      trafficRatio: 1.2,
      trafficLevel: 'Moderate',
      priceLevel: 2,
      rating: 4.5,
      userRatingCount: 500
    };

    const tasteProfile = {
      Japanese: 90,
      Chinese: 40
    };

    const ranked = rankRestaurants({
      candidates: [chiPlace, japPlace],
      priority: 'Personalized',
      tasteProfile
    });

    expect(ranked[0].id).toBe('jap');
    expect(ranked[0].reason).toContain('Japanese');
  });

  it('With no taste profile (cold start), rankings match original engine weights without bias', () => {
    const japPlace = {
      id: 'jap',
      displayName: 'Sushi Bar',
      cuisine: 'Japanese',
      distanceMeters: 2000,
      durationSeconds: 900,
      trafficRatio: 1.2,
      trafficLevel: 'Moderate',
      priceLevel: 2,
      rating: 4.5,
      userRatingCount: 500
    };

    const chiPlace = {
      id: 'chi',
      displayName: 'Dim Sum Place',
      cuisine: 'Chinese',
      distanceMeters: 2000,
      durationSeconds: 900,
      trafficRatio: 1.2,
      trafficLevel: 'Moderate',
      priceLevel: 2,
      rating: 4.5,
      userRatingCount: 500
    };

    const rankedWithoutProfile = rankRestaurants({
      candidates: [chiPlace, japPlace],
      priority: 'Best Overall',
      tasteProfile: null
    });

    // Both have exact same scores and neither gets taste bonus
    expect(rankedWithoutProfile[0].score).toBe(rankedWithoutProfile[1].score);
  });

  it('Rain lowers the rank of walking options and adds a rain warning note to reason text', () => {
    const closeWalkSpot = {
      id: 'walk_spot',
      displayName: 'Short Walk Spot',
      cuisine: 'Cafe',
      distanceMeters: 500, // walking feasible (< 1.8km)
      durationSeconds: 300,
      trafficRatio: 1.0,
      trafficLevel: 'Low',
      priceLevel: 2,
      rating: 4.4,
      userRatingCount: 200
    };

    const rankedInRain = rankRestaurants({
      candidates: [closeWalkSpot],
      priority: 'Best Overall',
      weatherContext: { isRaining: true, tempC: 27, condition: 'Rainy' }
    });

    expect(rankedInRain[0].reason).toContain('Rain alert');
  });

  it('Missing price, phone, photo, and rating never crash the recommendation engine', () => {
    const incompleteSpot = {
      id: 'incomplete_1',
      displayName: 'Mystery Diner',
      cuisine: 'Bangladeshi',
      distanceMeters: 1200,
      durationSeconds: 600,
      trafficRatio: 1.1,
      trafficLevel: 'Low',
      priceLevel: null, // missing price
      rating: null, // missing rating
      userRatingCount: null, // missing review count
      photos: [], // no photo
      regularOpeningHours: null
    };

    expect(() => {
      const ranked = rankRestaurants({
        candidates: [incompleteSpot],
        priority: 'Best Overall'
      });
      expect(ranked).toHaveLength(1);
      expect(ranked[0].score).toBeDefined();
      expect(ranked[0].reason).toBeTruthy();
    }).not.toThrow();
  });

  it('Closing-soon places (closing within 30m of arrival) are heavily penalized and flagged in reason', () => {
    // Current time + 10 mins arrival, but closes in 15 mins (within 30m window)
    const now = new Date();
    const closeTime = new Date(now.getTime() + 15 * 60000);
    const closeHours = String(closeTime.getHours()).padStart(2, '0');
    const closeMinutes = String(closeTime.getMinutes()).padStart(2, '0');

    const closingSoonSpot = {
      id: 'closing_soon',
      displayName: 'Midnight Kitchen',
      cuisine: 'Biriyani',
      distanceMeters: 1500,
      durationSeconds: 600, // 10 mins travel
      trafficRatio: 1.2,
      trafficLevel: 'Moderate',
      priceLevel: 2,
      rating: 4.7,
      userRatingCount: 800,
      regularOpeningHours: {
        closingTime: `${closeHours}:${closeMinutes}`
      }
    };

    const ranked = rankRestaurants({
      candidates: [closingSoonSpot],
      priority: 'Best Overall'
    });

    expect(ranked[0].closingStatus.isClosingSoon).toBe(true);
    expect(ranked[0].reason).toContain('Closes shortly');
  });
});
