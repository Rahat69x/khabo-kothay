import { describe, it, expect } from 'vitest';
import { formatDurationMinutes, formatDistanceKm, formatBdt, formatPriceLevel } from '../src/utils/formatters.js';

describe('Mobile Formatters Utility', () => {
  it('formats duration in minutes accurately', () => {
    expect(formatDurationMinutes(840)).toBe('14 min');
    expect(formatDurationMinutes(0)).toBe('0 min');
  });

  it('formats distance in kilometers', () => {
    expect(formatDistanceKm(2400)).toBe('2.4 km');
    expect(formatDistanceKm(750)).toBe('0.8 km');
  });

  it('formats BDT currency with estimate indicator', () => {
    expect(formatBdt(120, true)).toBe('~৳120 (est)');
    expect(formatBdt(50, false)).toBe('~৳50');
  });

  it('formats price level symbols', () => {
    expect(formatPriceLevel(1)).toBe('৳');
    expect(formatPriceLevel(3)).toBe('৳৳৳');
  });
});
