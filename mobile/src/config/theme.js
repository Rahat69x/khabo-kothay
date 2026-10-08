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
    primary: '#F97316',
    pressed: '#EA580C',
    tint: '#FFEDD5',
    background: '#FFFBF7',
    surface: '#FFFFFF',
    text: '#1C1917',
    mutedText: '#78716C',
    border: '#E7E5E4',
    onPrimary: '#FFFFFF'
  },
  dark: {
    primary: '#F97316',
    pressed: '#EA580C',
    tint: '#431407',
    background: '#121212',
    surface: '#1E1815',
    text: '#FAFAF9',
    mutedText: '#A8A29E',
    border: 'rgba(250, 250, 249, 0.12)',
    onPrimary: '#FFFFFF'
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

