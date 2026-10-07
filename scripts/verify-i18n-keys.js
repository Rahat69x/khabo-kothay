import en from '../mobile/src/i18n/en.js';
import bn from '../mobile/src/i18n/bn.js';

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

export function compareI18nKeys() {
  const enKeys = getDeepKeys(en);
  const bnKeys = getDeepKeys(bn);

  const missingInBn = enKeys.filter(k => !bnKeys.includes(k));
  const missingInEn = bnKeys.filter(k => !enKeys.includes(k));

  return {
    enCount: enKeys.length,
    bnCount: bnKeys.length,
    missingInBn,
    missingInEn,
    isEqual: missingInBn.length === 0 && missingInEn.length === 0
  };
}

if (process.argv[1] && process.argv[1].endsWith('verify-i18n-keys.js')) {
  const res = compareI18nKeys();
  if (!res.isEqual) {
    console.error('❌ i18n keys mismatch between English and Bangla!');
    if (res.missingInBn.length) console.error('Missing in Bangla:', res.missingInBn);
    if (res.missingInEn.length) console.error('Missing in English:', res.missingInEn);
    process.exit(1);
  } else {
    console.log(`✅ i18n keys parity verified: exactly ${res.enCount} keys match between English and Bangla.`);
    process.exit(0);
  }
}
