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
    it('renders primary button with correct warm orange brand colors', () => {
      const btn = getButtonStyle('primary', lightTheme);
      expect(btn.container.backgroundColor).toBe('#F97316'); // primary orange
      expect(btn.text.color).toBe(lightTheme.colors.onPrimary); // onPrimary
    });

    it('renders chip active and inactive states correctly', () => {
      const activeChip = getChipStyle(true, lightTheme);
      expect(activeChip.container.backgroundColor).toBe('#F97316');
      expect(activeChip.text.color).toBe(lightTheme.colors.onPrimary);

      const inactiveChip = getChipStyle(false, lightTheme);
      expect(inactiveChip.container.backgroundColor).toBe('#FFFFFF'); // surface
      expect(inactiveChip.text.color).toBe('#1C1917'); // text / ink
      expect(inactiveChip.container.borderColor).toBe('#E7E5E4'); // line
    });

    it('renders Best overall badge with badgeBest color and text', () => {
      const badge = getBadgeStyle('Best overall', lightTheme);
      expect(badge.bg).toBe(lightTheme.colors.badgeBest);
      expect(badge.text).toBe(lightTheme.colors.badgeBestText);
    });

    it('renders Fastest to reach and Best for price badges in primaryTint with primary text', () => {
      const fastBadge = getBadgeStyle('Fastest to reach', lightTheme);
      expect(fastBadge.bg).toBe('#FFEDD5'); // primaryTint
      expect(fastBadge.text).toBe('#F97316'); // primary

      const priceBadge = getBadgeStyle('Best for price', lightTheme);
      expect(priceBadge.bg).toBe('#FFEDD5'); // primaryTint
      expect(priceBadge.text).toBe('#F97316'); // primary
    });

    it('renders Try something new badge with outline and accentStrong text', () => {
      const newBadge = getBadgeStyle('Try something new', lightTheme);
      expect(newBadge.bg).toBe('transparent');
      expect(newBadge.text).toBe(lightTheme.colors.badgeNewText);
      expect(newBadge.border).toBe(lightTheme.colors.badgeNewBorder);
    });

    it('renders Community-verified badge with successTint and success text', () => {
      const verifiedBadge = getBadgeStyle('Community-verified', lightTheme);
      expect(verifiedBadge.bg).toBe('#DCFCE7'); // successTint
      expect(verifiedBadge.text).toBe('#15803D'); // success
    });

    it('renders Traffic chips with correct status colors, icons, and text labels', () => {
      const low = getTrafficChipStyle('Low', lightTheme);
      expect(low.bg).toBe(lightTheme.colors.trafficLowTint);
      expect(low.text).toBe(lightTheme.colors.trafficLow);
      expect(low.icon).toBe('🟢');
      expect(low.label).toBe('Low Traffic');

      const mod = getTrafficChipStyle('Moderate', lightTheme);
      expect(mod.bg).toBe(lightTheme.colors.trafficModerateTint);
      expect(mod.text).toBe(lightTheme.colors.trafficModerate);
      expect(mod.icon).toBe('🟡');
      expect(mod.label).toBe('Moderate Traffic');

      const heavy = getTrafficChipStyle('Heavy', lightTheme);
      expect(heavy.bg).toBe(lightTheme.colors.trafficHeavyTint);
      expect(heavy.text).toBe(lightTheme.colors.trafficHeavy);
      expect(heavy.icon).toBe('🔴');
      expect(heavy.label).toBe('Heavy Traffic');
    });

    it('renders Result card surface, border, and ink colors', () => {
      const card = getResultCardStyle(lightTheme);
      expect(card.container.backgroundColor).toBe('#FFFFFF');
      expect(card.container.borderColor).toBe('#E7E5E4');
      expect(card.title.color).toBe('#1C1917');
      expect(card.rank.color).toBe('#F97316');
      expect(card.scoreBadge.backgroundColor).toBe('#FFEDD5');
      expect(card.scoreText.color).toBe('#F97316');
    });
  });

  describe('Dark Theme Component Colors', () => {
    it('renders primary button with correct warm orange brand colors in dark mode', () => {
      const btn = getButtonStyle('primary', darkTheme);
      expect(btn.container.backgroundColor).toBe('#F97316'); // primary orange
      expect(btn.text.color).toBe(darkTheme.colors.onPrimary); // onPrimary dark
    });

    it('renders chip active and inactive states correctly in dark mode', () => {
      const activeChip = getChipStyle(true, darkTheme);
      expect(activeChip.container.backgroundColor).toBe('#F97316');
      expect(activeChip.text.color).toBe(darkTheme.colors.onPrimary);

      const inactiveChip = getChipStyle(false, darkTheme);
      expect(inactiveChip.container.backgroundColor).toBe('#1E1815'); // surface dark
      expect(inactiveChip.text.color).toBe('#FAFAF9'); // ink dark
      expect(inactiveChip.container.borderColor).toBe('rgba(250, 250, 249, 0.12)'); // line dark
    });

    it('renders Best overall badge with dark badgeBest and text', () => {
      const badge = getBadgeStyle('Best overall', darkTheme);
      expect(badge.bg).toBe(darkTheme.colors.badgeBest);
      expect(badge.text).toBe(darkTheme.colors.badgeBestText);
    });

    it('renders Fastest to reach and Best for price badges in dark primaryTint with primary text', () => {
      const fastBadge = getBadgeStyle('Fastest to reach', darkTheme);
      expect(fastBadge.bg).toBe('#431407'); // primaryTint dark
      expect(fastBadge.text).toBe('#F97316'); // primary

      const priceBadge = getBadgeStyle('Best for price', darkTheme);
      expect(priceBadge.bg).toBe('#431407');
      expect(priceBadge.text).toBe('#F97316');
    });

    it('renders Try something new badge with outline and accentStrong in dark mode', () => {
      const newBadge = getBadgeStyle('Try something new', darkTheme);
      expect(newBadge.bg).toBe('transparent');
      expect(newBadge.text).toBe(darkTheme.colors.badgeNewText);
      expect(newBadge.border).toBe(darkTheme.colors.badgeNewBorder);
    });

    it('renders Community-verified badge with successTint and success text in dark mode', () => {
      const verifiedBadge = getBadgeStyle('Community-verified', darkTheme);
      expect(verifiedBadge.bg).toBe(darkTheme.colors.badgeVerified);
      expect(verifiedBadge.text).toBe(darkTheme.colors.badgeVerifiedText);
    });

    it('renders Traffic chips with correct dark status colors, icons, and text labels', () => {
      const low = getTrafficChipStyle('Low', darkTheme);
      expect(low.bg).toBe(darkTheme.colors.trafficLowTint);
      expect(low.text).toBe(darkTheme.colors.trafficLow);
      expect(low.icon).toBe('🟢');
      expect(low.label).toBe('Low Traffic');

      const mod = getTrafficChipStyle('Moderate', darkTheme);
      expect(mod.bg).toBe(darkTheme.colors.trafficModerateTint);
      expect(mod.text).toBe(darkTheme.colors.trafficModerate);
      expect(mod.icon).toBe('🟡');
      expect(mod.label).toBe('Moderate Traffic');

      const heavy = getTrafficChipStyle('Heavy', darkTheme);
      expect(heavy.bg).toBe(darkTheme.colors.trafficHeavyTint);
      expect(heavy.text).toBe(darkTheme.colors.trafficHeavy);
      expect(heavy.icon).toBe('🔴');
      expect(heavy.label).toBe('Heavy Traffic');
    });

    it('renders Result card surface, border, and ink colors in dark mode', () => {
      const card = getResultCardStyle(darkTheme);
      expect(card.container.backgroundColor).toBe('#1E1815'); // surface dark
      expect(card.container.borderColor).toBe('rgba(250, 250, 249, 0.12)');
      expect(card.title.color).toBe('#FAFAF9'); // ink dark
      expect(card.rank.color).toBe('#F97316');
      expect(card.scoreBadge.backgroundColor).toBe('#431407');
      expect(card.scoreText.color).toBe('#F97316');
    });
  });
});
