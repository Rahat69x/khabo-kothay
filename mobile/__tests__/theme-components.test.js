import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from '../src/config/theme.generated.js';
import {
  getBadgeStyle,
  getTrafficChipStyle,
  getChipStyle,
  getButtonStyle,
  getResultCardStyle
} from '../src/components/ThemeStyles.js';

describe('Mobile Brand Theme Components & Style Rules', () => {
  describe('Light Theme Component Colors', () => {
    it('renders primary button with correct brand indigo colors', () => {
      const btn = getButtonStyle('primary', lightTheme);
      expect(btn.container.backgroundColor).toBe('#3B3FA8'); // primary
      expect(btn.text.color).toBe('#FFFFFF'); // onPrimary
    });

    it('renders chip active and inactive states correctly', () => {
      const activeChip = getChipStyle(true, lightTheme);
      expect(activeChip.container.backgroundColor).toBe('#3B3FA8');
      expect(activeChip.text.color).toBe('#FFFFFF');

      const inactiveChip = getChipStyle(false, lightTheme);
      expect(inactiveChip.container.backgroundColor).toBe('#FFFFFF'); // surface
      expect(inactiveChip.text.color).toBe('#16183A'); // ink
      expect(inactiveChip.container.borderColor).toBe('rgba(22, 24, 58, 0.12)'); // line
    });

    it('renders Best overall badge in saffron with onAccent text', () => {
      const badge = getBadgeStyle('Best overall', lightTheme);
      expect(badge.bg).toBe('#FFB020'); // accent
      expect(badge.text).toBe('#3D2800'); // onAccent
    });

    it('renders Fastest to reach and Best for price badges in primaryTint with primary text', () => {
      const fastBadge = getBadgeStyle('Fastest to reach', lightTheme);
      expect(fastBadge.bg).toBe('#E6E7F7'); // primaryTint
      expect(fastBadge.text).toBe('#3B3FA8'); // primary

      const priceBadge = getBadgeStyle('Best for price', lightTheme);
      expect(priceBadge.bg).toBe('#E6E7F7'); // primaryTint
      expect(priceBadge.text).toBe('#3B3FA8'); // primary
    });

    it('renders Try something new badge with outline and accentStrong text', () => {
      const newBadge = getBadgeStyle('Try something new', lightTheme);
      expect(newBadge.bg).toBe('transparent');
      expect(newBadge.text).toBe('#8A5200'); // accentStrong
      expect(newBadge.border).toBe('#8A5200'); // accentStrong
    });

    it('renders Community-verified badge with successTint and success text', () => {
      const verifiedBadge = getBadgeStyle('Community-verified', lightTheme);
      expect(verifiedBadge.bg).toBe('#E3F4EA'); // successTint
      expect(verifiedBadge.text).toBe('#197847'); // success
    });

    it('renders Traffic chips with correct status colors, icons, and text labels', () => {
      const low = getTrafficChipStyle('Low', lightTheme);
      expect(low.bg).toBe('#E3F4EA');
      expect(low.text).toBe('#197847');
      expect(low.icon).toBe('🟢');
      expect(low.label).toBe('Low Traffic');

      const mod = getTrafficChipStyle('Moderate', lightTheme);
      expect(mod.bg).toBe('#FFF1D6');
      expect(mod.text).toBe('#8A5200');
      expect(mod.icon).toBe('🟡');
      expect(mod.label).toBe('Moderate Traffic');

      const heavy = getTrafficChipStyle('Heavy', lightTheme);
      expect(heavy.bg).toBe('#FCE4E1');
      expect(heavy.text).toBe('#BE382A');
      expect(heavy.icon).toBe('🔴');
      expect(heavy.label).toBe('Heavy Traffic');
    });

    it('renders Result card surface, border, and ink colors', () => {
      const card = getResultCardStyle(lightTheme);
      expect(card.container.backgroundColor).toBe('#FFFFFF');
      expect(card.container.borderColor).toBe('rgba(22, 24, 58, 0.12)');
      expect(card.title.color).toBe('#16183A');
      expect(card.rank.color).toBe('#3B3FA8');
      expect(card.scoreBadge.backgroundColor).toBe('#E6E7F7');
      expect(card.scoreText.color).toBe('#3B3FA8');
    });
  });

  describe('Dark Theme Component Colors', () => {
    it('renders primary button with correct brand indigo colors in dark mode', () => {
      const btn = getButtonStyle('primary', darkTheme);
      expect(btn.container.backgroundColor).toBe('#8B90F0'); // primary dark
      expect(btn.text.color).toBe('#0F1038'); // onPrimary dark
    });

    it('renders chip active and inactive states correctly in dark mode', () => {
      const activeChip = getChipStyle(true, darkTheme);
      expect(activeChip.container.backgroundColor).toBe('#8B90F0');
      expect(activeChip.text.color).toBe('#0F1038');

      const inactiveChip = getChipStyle(false, darkTheme);
      expect(inactiveChip.container.backgroundColor).toBe('#1B1D45'); // surface dark
      expect(inactiveChip.text.color).toBe('#ECECFA'); // ink dark
      expect(inactiveChip.container.borderColor).toBe('rgba(236, 236, 250, 0.14)'); // line dark
    });

    it('renders Best overall badge in saffron with onAccent text in dark mode', () => {
      const badge = getBadgeStyle('Best overall', darkTheme);
      expect(badge.bg).toBe('#FFB020'); // accent
      expect(badge.text).toBe('#3D2800'); // onAccent
    });

    it('renders Fastest to reach and Best for price badges in dark primaryTint with primary text', () => {
      const fastBadge = getBadgeStyle('Fastest to reach', darkTheme);
      expect(fastBadge.bg).toBe('#25285A'); // primaryTint dark
      expect(fastBadge.text).toBe('#8B90F0'); // primary dark

      const priceBadge = getBadgeStyle('Best for price', darkTheme);
      expect(priceBadge.bg).toBe('#25285A');
      expect(priceBadge.text).toBe('#8B90F0');
    });

    it('renders Try something new badge with outline and accentStrong in dark mode', () => {
      const newBadge = getBadgeStyle('Try something new', darkTheme);
      expect(newBadge.bg).toBe('transparent');
      expect(newBadge.text).toBe('#FFB020'); // accentStrong dark
      expect(newBadge.border).toBe('#FFB020');
    });

    it('renders Community-verified badge with successTint and success text in dark mode', () => {
      const verifiedBadge = getBadgeStyle('Community-verified', darkTheme);
      expect(verifiedBadge.bg).toBe('#12372A'); // successTint dark
      expect(verifiedBadge.text).toBe('#5FD08D'); // success dark
    });

    it('renders Traffic chips with correct dark status colors, icons, and text labels', () => {
      const low = getTrafficChipStyle('Low', darkTheme);
      expect(low.bg).toBe('#12372A');
      expect(low.text).toBe('#5FD08D');
      expect(low.icon).toBe('🟢');
      expect(low.label).toBe('Low Traffic');

      const mod = getTrafficChipStyle('Moderate', darkTheme);
      expect(mod.bg).toBe('#3A2D10');
      expect(mod.text).toBe('#FFCB6B');
      expect(mod.icon).toBe('🟡');
      expect(mod.label).toBe('Moderate Traffic');

      const heavy = getTrafficChipStyle('Heavy', darkTheme);
      expect(heavy.bg).toBe('#3F1A1D');
      expect(heavy.text).toBe('#FF8A80');
      expect(heavy.icon).toBe('🔴');
      expect(heavy.label).toBe('Heavy Traffic');
    });

    it('renders Result card surface, border, and ink colors in dark mode', () => {
      const card = getResultCardStyle(darkTheme);
      expect(card.container.backgroundColor).toBe('#1B1D45'); // surface dark
      expect(card.container.borderColor).toBe('rgba(236, 236, 250, 0.14)');
      expect(card.title.color).toBe('#ECECFA'); // ink dark
      expect(card.rank.color).toBe('#8B90F0');
      expect(card.scoreBadge.backgroundColor).toBe('#25285A');
      expect(card.scoreText.color).toBe('#8B90F0');
    });
  });
});
