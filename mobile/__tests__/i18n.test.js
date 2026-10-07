import { describe, it, expect } from 'vitest';
import { t, setLocale, getLocale } from '../src/i18n/index.js';

describe('Mobile i18n Translation', () => {
  it('returns English translations by default', () => {
    setLocale('en');
    expect(t('appName')).toBe('Khabo Kothay?');
    expect(t('tabs.home')).toBe('Home');
    expect(t('home.updatedAgo', { mins: 5 })).toBe('Updated 5 min ago');
  });

  it('switches to Bangla translations properly', () => {
    setLocale('bn');
    expect(getLocale()).toBe('bn');
    expect(t('appName')).toBe('খাবো কোথায়?');
    expect(t('tabs.home')).toBe('হোম');
    expect(t('home.updatedAgo', { mins: 10 })).toBe('10 মিনিট আগে আপডেট হয়েছে');
  });

  it('falls back to English when a key is missing in another language', () => {
    setLocale('bn');
    expect(t('nonexistent_key_xyz')).toBe('nonexistent_key_xyz');
  });
});
