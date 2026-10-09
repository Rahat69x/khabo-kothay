import { describe, it, expect } from 'vitest';
import { rankRestaurants } from '../services/recommend.js';
import { getLocalRecommendations } from '../../mobile/src/services/localEngine.js';

describe('Price Range & Faceted Filtering (Reference Layout)', () => {
  const sampleCandidates = [
    {
      id: 'biryani_spot',
      displayName: 'Kacchi House',
      cuisine: 'Biriyani',
      rating: 4.5,
      userRatingCount: 300,
      priceLevel: 2,
      halal: true,
      vegetarian: false,
      vegan: false,
      no_beef: false,
      restaurantType: ['Dine-in', 'Casual Dining'],
      features: ['Air Conditioned (AC)', 'Card / bKash Payment', 'Family Friendly'],
      menu: {
        items: [
          { name: 'Kacchi Biryani', price: 460 },
          { name: 'Chicken Roast', price: 160 },
          { name: 'Borhani', price: 80 }
        ],
        estimatedCostPerPerson: { amount: 540 }
      },
      openStatus: { isOpen: true, isClosingSoon: false },
      regularOpeningHours: { openTime: '11:00', closingTime: '23:30' }
    },
    {
      id: 'fine_dining_spot',
      displayName: 'Royal Fine Dine',
      cuisine: 'Continental',
      rating: 4.8,
      userRatingCount: 500,
      priceLevel: 4,
      halal: true,
      vegetarian: true,
      vegan: false,
      no_beef: false,
      restaurantType: ['Fine Dining', 'Dine-in'],
      features: ['Air Conditioned (AC)', 'Free WiFi', 'Parking Available', 'Outdoor / Rooftop Seating', 'Card / bKash Payment'],
      menu: {
        items: [
          { name: 'Imported Ribeye Steak', price: 3200 },
          { name: 'Truffle Risotto', price: 1800 },
          { name: 'Mocktail', price: 650 }
        ],
        estimatedCostPerPerson: { amount: 2800 }
      },
      openStatus: { isOpen: true, isClosingSoon: false },
      regularOpeningHours: { openTime: '12:00', closingTime: '00:00' }
    },
    {
      id: 'budget_cafe',
      displayName: 'Corner Coffee & Tea',
      cuisine: 'Coffee',
      rating: 4.2,
      userRatingCount: 150,
      priceLevel: 1,
      halal: true,
      vegetarian: true,
      vegan: true,
      no_beef: true,
      restaurantType: ['Cafe / Bakery', 'Fast Food / Takeaway'],
      features: ['Free WiFi', 'Card / bKash Payment'],
      menu: {
        items: [
          { name: 'Espresso', price: 120 },
          { name: 'Cappuccino', price: 220 },
          { name: 'Croissant', price: 180 }
        ],
        estimatedCostPerPerson: { amount: 250 }
      },
      openStatus: { isOpen: false, isClosingSoon: false },
      regularOpeningHours: { openTime: '08:00', closingTime: '22:00' }
    }
  ];

  it('filters by actual menu item prices: budget range (≤ ৳500) matches cafe and biryani place with 160 BDT item, excludes fine dining', () => {
    const results = rankRestaurants({
      candidates: sampleCandidates,
      filters: {
        priceMin: 50,
        priceMax: 300
      }
    });

    const ids = results.map(r => r.id);
    expect(ids).toContain('budget_cafe');
    expect(ids).toContain('biryani_spot'); // Has Borhani (80 BDT) and Chicken Roast (160 BDT)
    expect(ids).not.toContain('fine_dining_spot'); // Lowest item is 650 BDT
  });

  it('filters by high price range (৳1500–৳4000) matches only fine dining spot', () => {
    const results = rankRestaurants({
      candidates: sampleCandidates,
      filters: {
        priceMin: 1500,
        priceMax: 4000
      }
    });

    const ids = results.map(r => r.id);
    expect(ids).toContain('fine_dining_spot');
    expect(ids).not.toContain('budget_cafe');
  });

  it('filters by restaurantType: Fine Dining matches only fine_dining_spot', () => {
    const results = rankRestaurants({
      candidates: sampleCandidates,
      filters: {
        restaurantTypes: ['Fine Dining']
      }
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('fine_dining_spot');
  });

  it('filters by multiple features: Free WiFi + Parking Available', () => {
    const results = rankRestaurants({
      candidates: sampleCandidates,
      filters: {
        features: ['Free WiFi', 'Parking Available']
      }
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('fine_dining_spot');
  });

  it('filters by Dietary preferences: vegan & no_beef', () => {
    const results = rankRestaurants({
      candidates: sampleCandidates,
      filters: {
        dietary: ['vegan', 'no_beef']
      }
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('budget_cafe');
  });

  it('offline mobile engine getLocalRecommendations executes identical facet filtering on embedded Dhaka data', async () => {
    const recs = await getLocalRecommendations({
      lat: 23.7975,
      lng: 90.4234,
      filters: {
        priceMin: 0,
        priceMax: 700,
        restaurantTypes: ['Casual Dining']
      }
    });

    expect(recs.results.length).toBeGreaterThan(0);
    recs.results.forEach(r => {
      expect(r.restaurantType).toContain('Casual Dining');
      // Verify price range constraint
      const minItem = r.menu?.items ? Math.min(...r.menu.items.map(i => i.price)) : 0;
      expect(minItem).toBeLessThanOrEqual(700);
    });
  });
});
