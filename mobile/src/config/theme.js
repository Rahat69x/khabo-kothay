export { lightTheme, darkTheme, tokens } from './theme.generated.js';
import themeGenerated, { lightTheme, darkTheme, tokens } from './theme.generated.js';

export const lightColors = lightTheme.colors;
export const darkColors = darkTheme.colors;

/**
 * Core light and dark color tokens (STOA Editorial Palette):
 * - primary: #FF5722 (vibrant brand orange)
 * - pressed: #D83D10
 * - tint: #FBEAE4 (light) / #3E1A0F (dark)
 * - background: #F8F7F4 (light) / #141312 (dark)
 * - surface: #FFFFFF (light) / #1C1A18 (dark)
 * - text: #171717 (light) / #F8F7F4 (dark)
 * - mutedText: #706C66 (light) / #A39E96 (dark)
 * - border: #DEDAD4 (light) / rgba(222, 218, 212, 0.14) (dark)
 * - onPrimary: #171717 (high contrast on orange)
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

