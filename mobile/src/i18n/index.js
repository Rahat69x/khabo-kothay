import en from './en.js';
import bn from './bn.js';

const translations = { en, bn };

let currentLocale = 'en';
const listeners = new Set();

export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
    for (const l of listeners) l(currentLocale);
  }
}

export function getLocale() {
  return currentLocale;
}

export function subscribeLocale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Translate key path e.g. "home.locationPrompt"
 */
export function t(key, params = {}) {
  const parts = key.split('.');
  let current = translations[currentLocale] || translations.en;

  for (const part of parts) {
    if (current && current[part] !== undefined) {
      current = current[part];
    } else {
      // Fallback to English
      let fallback = translations.en;
      for (const fPart of parts) {
        if (fallback && fallback[fPart] !== undefined) {
          fallback = fallback[fPart];
        } else {
          return key;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') return key;

  // Replace %{var} templates
  return current.replace(/%\{(\w+)\}/g, (_, varName) => {
    return params[varName] !== undefined ? params[varName] : `%{${varName}}`;
  });
}
