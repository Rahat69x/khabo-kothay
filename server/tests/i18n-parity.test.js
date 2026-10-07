import { describe, it, expect } from 'vitest';
import { compareI18nKeys } from '../../scripts/verify-i18n-keys.js';

describe('i18n Translation Key Parity', () => {
  it('English and Bangla translation files have exactly the same keys', () => {
    const res = compareI18nKeys();
    expect(res.missingInBn).toEqual([]);
    expect(res.missingInEn).toEqual([]);
    expect(res.isEqual).toBe(true);
    expect(res.enCount).toBeGreaterThan(50);
  });
});
