import { describe, it, expect } from 'vitest';
import { getDefaultTasteProfile, recordEvent, decayProfile, clampScore } from '../services/taste.js';

describe('Taste Profile Engine (Stage 11)', () => {
  it('Repeated choices of a cuisine raise its score', () => {
    let profile = getDefaultTasteProfile();
    expect(profile.Japanese).toBe(50);

    // User chooses Japanese multiple times
    profile = recordEvent(profile, { type: 'chose', cuisine: 'Japanese' });
    const score1 = profile.Japanese;
    expect(score1).toBeGreaterThan(50);

    profile = recordEvent(profile, { type: 'chose', cuisine: 'Japanese' });
    const score2 = profile.Japanese;
    expect(score2).toBeGreaterThan(score1);

    profile = recordEvent(profile, { type: 'directions', cuisine: 'Japanese' });
    expect(profile.Japanese).toBeGreaterThan(score2);
  });

  it('A dismissal lowers the cuisine score', () => {
    let profile = getDefaultTasteProfile();
    profile = recordEvent(profile, { type: 'dismissed', cuisine: 'Fast Food' });
    expect(profile['Fast Food']).toBeLessThan(50);
  });

  it('Scores are properly clamped between 0 and 100', () => {
    expect(clampScore(125)).toBe(100);
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(74.678)).toBe(74.7);
  });

  it('Decay moves old extreme scores toward 50 over time', () => {
    const highProfile = { ...getDefaultTasteProfile(), Japanese: 90, Burger: 20 };
    const decayed = decayProfile(highProfile, 5); // 5 decay steps

    // 90 should decay down towards 50
    expect(decayed.Japanese).toBeLessThan(90);
    expect(decayed.Japanese).toBeGreaterThan(50);

    // 20 should decay up towards 50
    expect(decayed.Burger).toBeGreaterThan(20);
    expect(decayed.Burger).toBeLessThan(50);
  });
});
