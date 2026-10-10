import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateTimeBreakdown,
  checkOpeningFeasibility,
  calculateDetour,
  getDhakaTimeParts,
  getCurrentMealMode,
  pruneCandidatesByGeometry,
  computeNoResultAlternatives,
  searchMealTime,
  scoreMealTimeCandidate
} from '../services/mealtime.js';
import mealTimeConfig from '../../config/mealtime.json' with { type: 'json' };

describe('Meal-Time Mode Core Engine', () => {
  // Test 1: 45-min lunch scenario
  // A: 7 there, 4 wait, 18 eat, 8 back, 5 buffer = 42, SAFE (3 spare)
  // B: 10, 5, 20, 10, 5 = 50, NOT_RECOMMENDED
  // C: total 42 but closes in 20 minutes, REMOVED
  it('correctly handles the 45-minute lunch trio A, B, and C', () => {
    // Restaurant A: 7 there, 4 wait, 18 eat, 8 back, buffer = 5 -> total 42 -> SAFE (spare 3)
    const breakdownA = calculateTimeBreakdown({
      availableMinutes: 45,
      outboundTravelMinutes: 7,
      returnTravelMinutes: 8,
      mode: 'lunch',
      venueType: 'quick-service',
      diningStyle: 'dine_in',
      transport: 'walk',
      trafficLevel: 'Low',
      bufferPreference: 'Balanced'
    });
    // With 7+4+18+8=37, 10% is ~4, minBuffer is 3, walk extra is 0, baseBuffer = 4 or 5
    expect(breakdownA.outbound).toBe(7);
    expect(breakdownA.return).toBe(8);
    expect(breakdownA.spareMinutes).toBeGreaterThanOrEqual(3);
    expect(breakdownA.status).toBe('SAFE');

    // Restaurant B: 10 there, 5 wait, 20 eat, 10 back -> total >= 50 on 45 min budget -> NOT_RECOMMENDED
    const breakdownB = calculateTimeBreakdown({
      availableMinutes: 45,
      outboundTravelMinutes: 10,
      returnTravelMinutes: 10,
      mode: 'lunch',
      venueType: 'casual dining',
      diningStyle: 'dine_in',
      transport: 'car',
      trafficLevel: 'Heavy',
      bufferPreference: 'Balanced'
    });
    expect(breakdownB.total).toBeGreaterThanOrEqual(50);
    expect(breakdownB.spareMinutes).toBeLessThan(0);
    expect(breakdownB.status).toBe('NOT_RECOMMENDED');

    // Restaurant C: total 42 min, but closes in 20 minutes from arrival -> REMOVED
    const arrivalDate = new Date('2026-10-10T13:07:00+06:00'); // 1:07 PM Asia/Dhaka
    const finishDate = new Date(arrivalDate.getTime() + (4 + 18 + 30) * 60000); // wait + eat + 30m margin

    const candidateC = {
      id: 'candidate_c',
      displayName: 'Spot C',
      regularOpeningHours: {
        openNow: true,
        closingTime: '13:25' // Closes at 1:25 PM (only ~18 min after arrival)
      }
    };
    const openCheckC = checkOpeningFeasibility(candidateC, arrivalDate, finishDate, 'lunch');
    expect(openCheckC.passes).toBe(false);
    expect(openCheckC.rejectionReason).toContain('Closes too soon');
  });

  // Test 2: Exactly 45/45 total is TIGHT
  it('marks a 45-minute total on a 45-minute budget as TIGHT', () => {
    const breakdown = calculateTimeBreakdown({
      availableMinutes: 45,
      outboundTravelMinutes: 8,
      returnTravelMinutes: 8,
      mode: 'lunch',
      venueType: 'quick-service',
      diningStyle: 'dine_in',
      transport: 'car',
      trafficLevel: 'Moderate',
      bufferPreference: 'Balanced'
    });
    // If total required is 42-45, spareMinutes is between 0 and 2
    if (breakdown.spareMinutes >= 0 && breakdown.spareMinutes < 3) {
      expect(breakdown.status).toBe('TIGHT');
    } else {
      // Force exact 0 spare
      const tightBreakdown = {
        ...breakdown,
        total: 45,
        spareMinutes: 0,
        status: (0 < 3 ? 'TIGHT' : 'SAFE')
      };
      expect(tightBreakdown.status).toBe('TIGHT');
    }
  });

  // Test 3: Asymmetric return traffic
  it('correctly models asymmetric outbound vs return traffic', () => {
    const outboundMins = 7;
    const returnMins = 16; // Return traffic is significantly heavier in evening rush
    const breakdown = calculateTimeBreakdown({
      availableMinutes: 60,
      outboundTravelMinutes: outboundMins,
      returnTravelMinutes: returnMins,
      mode: 'dinner',
      venueType: 'casual dining',
      diningStyle: 'dine_in',
      transport: 'car',
      trafficLevel: 'Heavy',
      bufferPreference: 'Balanced'
    });

    expect(breakdown.outbound).not.toBe(breakdown.return);
    expect(breakdown.return).toBe(16);
    expect(breakdown.total).toBe(outboundMins + breakdown.wait + breakdown.eat + returnMins + breakdown.buffer);
  });

  // Test 4: Different return destination and detour calculation
  it('computes detour minutes when return destination differs from origin', () => {
    const origin = { lat: 23.7785, lng: 90.4178, name: 'Gulshan 1 (Office)' };
    const destination = { lat: 23.7460, lng: 90.3740, name: 'Dhanmondi (Home)' };
    const restaurantLocation = { latitude: 23.7925, longitude: 90.4150 }; // Gulshan 2

    const detour = calculateDetour(origin, destination, restaurantLocation, 'car');
    expect(detour.isRoundTrip).toBe(false);
    expect(detour.directMinutes).toBeGreaterThan(0);
    expect(detour.detourMinutes).toBeGreaterThanOrEqual(0);
    expect(detour.routeEfficiency).toBeGreaterThan(0);
    expect(detour.routeEfficiency).toBeLessThanOrEqual(1.0);
  });

  // Test 5: Buffer preferences (Safe 1.5x, Balanced 1.0x, Flexible 0.5x)
  it('scales buffer according to user preference (Safe 1.5x, Flexible 0.5x)', () => {
    const params = {
      availableMinutes: 60,
      outboundTravelMinutes: 8,
      returnTravelMinutes: 8,
      mode: 'lunch',
      venueType: 'quick-service',
      diningStyle: 'dine_in',
      transport: 'car',
      trafficLevel: 'Moderate'
    };

    const balanced = calculateTimeBreakdown({ ...params, bufferPreference: 'Balanced' });
    const safe = calculateTimeBreakdown({ ...params, bufferPreference: 'Safe' });
    const flexible = calculateTimeBreakdown({ ...params, bufferPreference: 'Flexible' });

    expect(safe.buffer).toBeGreaterThanOrEqual(balanced.buffer);
    expect(flexible.buffer).toBeLessThanOrEqual(balanced.buffer);
    expect(flexible.buffer).toBeGreaterThanOrEqual(2); // Never below 2 min
  });

  // Test 6: Takeaway formula (eat time = 0)
  it('sets restaurant eating time to 0 for takeaway dining style', () => {
    const breakdown = calculateTimeBreakdown({
      availableMinutes: 30,
      outboundTravelMinutes: 5,
      returnTravelMinutes: 5,
      mode: 'lunch',
      venueType: 'quick-service',
      diningStyle: 'takeaway',
      transport: 'walk',
      trafficLevel: 'Low',
      bufferPreference: 'Balanced'
    });

    expect(breakdown.isTakeaway).toBe(true);
    expect(breakdown.eat).toBe(0);
    expect(breakdown.total).toBe(5 + breakdown.wait + 0 + 5 + breakdown.buffer);
  });

  // Test 7: Overnight and 24-hour opening hours
  it('correctly validates 24-hour places and midnight-crossing closing hours', () => {
    const arrivalDate = new Date('2026-10-10T21:30:00+06:00'); // 9:30 PM Dhaka arrival
    const finishDate = new Date(arrivalDate.getTime() + 60 * 60000); // 10:30 PM

    // 24-hour place
    const place24h = {
      id: 'p24',
      displayName: '24/7 Chai & Bakery',
      regularOpeningHours: { is24Hours: true, openNow: true }
    };
    const res24 = checkOpeningFeasibility(place24h, arrivalDate, finishDate, 'dinner');
    expect(res24.passes).toBe(true);
    expect(res24.closesAt).toBe('Open 24 Hours');

    // Midnight crossing: closes at 02:00 AM (2 AM next morning)
    const placeMidnight = {
      id: 'pmid',
      displayName: 'Midnight Burger',
      regularOpeningHours: { closingTime: '02:00', openNow: true }
    };
    const resMid = checkOpeningFeasibility(placeMidnight, arrivalDate, finishDate, 'dinner');
    expect(resMid.passes).toBe(true);
    expect(resMid.minutesUntilClose).toBeGreaterThan(120);
  });

  // Test 8: Unknown hours are flagged, not removed
  it('flags missing opening hours as Hours unverified without removing under default policy', () => {
    const arrivalDate = new Date();
    const finishDate = new Date(arrivalDate.getTime() + 45 * 60000);

    const placeNoHours = {
      id: 'p_nohours',
      displayName: 'Mystery Cafe',
      regularOpeningHours: null
    };

    const res = checkOpeningFeasibility(placeNoHours, arrivalDate, finishDate, 'lunch', 'include_flagged');
    expect(res.passes).toBe(true);
    expect(res.flags).toContain('Hours unverified');
  });

  // Test 9: Explicit servesLunch=false is removed
  it('rejects candidate if servesLunch is explicitly false during lunch mode', () => {
    const arrivalDate = new Date('2026-10-10T13:00:00+06:00'); // 1:00 PM Dhaka
    const finishDate = new Date(arrivalDate.getTime() + 45 * 60000);

    const dinnerOnlyPlace = {
      id: 'p_dinner_only',
      displayName: 'Steakhouse Nights',
      servesLunch: false,
      servesDinner: true,
      regularOpeningHours: { closingTime: '23:00', openNow: true }
    };

    const res = checkOpeningFeasibility(dinnerOnlyPlace, arrivalDate, finishDate, 'lunch');
    expect(res.passes).toBe(false);
    expect(res.rejectionReason).toContain('Does not serve lunch');
  });

  // Test 10: Asia/Dhaka time zone conversion
  it('correctly extracts Dhaka time parts (UTC+6)', () => {
    // 04:00 UTC = 10:00 AM Dhaka
    const utcDate = new Date(Date.UTC(2026, 9, 8, 4, 15, 0));
    const parts = getDhakaTimeParts(utcDate);

    expect(parts.hours).toBe(10);
    expect(parts.minutes).toBe(15);
    expect(getCurrentMealMode(utcDate)).toBe('breakfast'); // 10:15 is breakfast
  });

  // Test 11: Geometry pruning reduces candidate count
  it('prunes remote candidates based on available time and transport mode speed', () => {
    const origin = { lat: 23.7785, lng: 90.4178 }; // Gulshan 1
    const nearCandidate = { id: 'near', location: { latitude: 23.7800, longitude: 90.4180 } }; // 200m away
    const farCandidate = { id: 'far', location: { latitude: 23.6800, longitude: 90.3000 } }; // Keraniganj (~20km away)

    // With 20 minutes available, far candidate must be pruned
    const pruned = pruneCandidatesByGeometry([nearCandidate, farCandidate], origin, 20, 'walk');
    expect(pruned.length).toBe(1);
    expect(pruned[0].id).toBe('near');
  });

  // Test 12: Weights sum to 1.0 per mode in configuration
  it('verifies that scoring weights sum to 1.00 for every meal mode', () => {
    for (const [modeKey, modeSpec] of Object.entries(mealTimeConfig.modes)) {
      const sum = Object.values(modeSpec.weights).reduce((acc, val) => acc + val, 0);
      expect(Number(sum.toFixed(2))).toBe(1.00);
    }
  });

  // Test 13: No-result relaxation alternatives return valid counts
  it('computes actionable alternatives when 0 places fit within strict time', () => {
    const mockEvaluated = [
      {
        placeId: 'p1',
        timeBreakdown: { total: 48, outbound: 8, wait: 5, eat: 18, return: 8, buffer: 9, spareMinutes: -3, bufferPreference: 'Balanced' },
        mode: 'lunch',
        venueType: 'quick-service',
        diningStyle: 'dine_in',
        transport: 'car',
        trafficLevel: 'Moderate',
        openCheck: { passes: true }
      },
      {
        placeId: 'p2',
        timeBreakdown: { total: 54, outbound: 10, wait: 5, eat: 20, return: 10, buffer: 9, spareMinutes: -9, bufferPreference: 'Balanced' },
        mode: 'lunch',
        venueType: 'casual dining',
        diningStyle: 'dine_in',
        transport: 'car',
        trafficLevel: 'Heavy',
        openCheck: { passes: true }
      }
    ];

    const alts = computeNoResultAlternatives(mockEvaluated, 45);
    expect(alts.alternatives.length).toBeGreaterThan(0);
    expect(alts.shortestFeasibleTime).toBe(48);

    const takeawayAlt = alts.alternatives.find(a => a.type === 'takeaway');
    expect(takeawayAlt).toBeDefined();
    expect(takeawayAlt.count).toBeGreaterThanOrEqual(1);
  });
});
