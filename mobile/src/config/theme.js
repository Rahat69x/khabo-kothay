export { lightTheme, darkTheme, tokens } from './theme.generated.js';
import themeGenerated, { lightTheme, darkTheme, tokens } from './theme.generated.js';

export const lightColors = lightTheme.colors;
export const darkColors = darkTheme.colors;

/**
 * Core light and dark color tokens:
 * - primary: #F97316 (warm orange)
 * - pressed: #EA580C
 * - tint: #FFEDD5 (light) / #431407 (dark)
 * - background: #FFFBF7 (light) / #121212 (dark)
 * - surface: #FFFFFF (light) / #1E1815 (dark)
 * - text: #1C1917 (light) / #FAFAF9 (dark)
 * - mutedText: #78716C (light) / #A8A29E (dark)
 * - border: #E7E5E4 (light) / rgba(250, 250, 249, 0.12) (dark)
 * - onPrimary: #FFFFFF (high contrast on orange)
 */
export const colorTokens = {
  light: {
    primary: tokens.light.primary,
    pressed: tokens.light.primaryPressed,
    tint: tokens.light.primaryTint,
    background: tokens.light.bg,
    surface: tokens.light.surface,
    text: tokens.light.ink,
    mutedText: tokens.light.muted,
    border: tokens.light.line,
    onPrimary: tokens.light.onPrimary
  },
  dark: {
    primary: tokens.dark.primary,
    pressed: tokens.dark.primaryPressed,
    tint: tokens.dark.primaryTint,
    background: tokens.dark.bg,
    surface: tokens.dark.surface,
    text: tokens.dark.ink,
    mutedText: tokens.dark.muted,
    border: tokens.dark.line,
    onPrimary: tokens.dark.onPrimary
  }
};

/**
 * Returns the theme matching the given colorScheme ('dark' or 'light').
 * Defaults to lightTheme if undefined or 'light'.
 */
export function getTheme(scheme = 'light') {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export default {
  ...themeGenerated,
  lightTheme,
  darkTheme,
  lightColors,
  darkColors,
  colorTokens,
  getTheme
};

