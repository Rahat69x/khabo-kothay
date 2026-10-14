import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bangla digits mapping
export const BANGLA_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

// Word numbers mapping in English and Banglish
export const WORD_NUMBERS = {
  'one': 1, 'ek': 1, 'ak': 1, 'এক': 1,
  'two': 2, 'dui': 2, 'duto': 2, 'দুই': 2,
  'three': 3, 'tin': 3, 'tinta': 3, 'তিন': 3,
  'four': 4, 'char': 4, 'charta': 4, 'চার': 4,
  'five': 5, 'pach': 5, 'pachta': 5, 'পাঁচ': 5,
  'six': 6, 'choy': 6, 'ছয়': 6,
  'seven': 7, 'shat': 7, 'sat': 7, 'সাত': 7,
  'eight': 8, 'aat': 8, 'আট': 8,
  'nine': 9, 'noy': 9, 'নয়': 9,
  'ten': 10, 'dosh': 10, 'দশ': 10
};

// Dhaka Areas Lexicon
export const DHAKA_AREAS = [
  { canonical: 'Banani', aliases: ['banani', 'বনানী', 'banani-11', 'road 11'] },
  { canonical: 'Gulshan', aliases: ['gulshan', 'গুলশান', 'gulshan-1', 'gulshan-2', 'gulshan 1', 'gulshan 2'] },
  { canonical: 'Baridhara', aliases: ['baridhara', 'বারিধারা', 'baridhara dohs'] },
  { canonical: 'Notun Bazar', aliases: ['notun bazar', 'নতুন বাজার', 'natun bazar', 'nutun bazar'] },
  { canonical: 'Mohakhali', aliases: ['mohakhali', 'মহাখালী', 'mohakhali dohs'] },
  { canonical: 'Badda', aliases: ['badda', 'বাড্ডা', 'middle badda', 'north badda'] },
  { canonical: 'Dhanmondi', aliases: ['dhanmondi', 'ধানমন্ডি'] },
  { canonical: 'Uttara', aliases: ['uttara', 'উত্তরা'] },
  { canonical: 'Mirpur', aliases: ['mirpur', 'মিরপুর'] },
  { canonical: 'Bashundhara', aliases: ['bashundhara', 'বসুন্ধরা', 'bashundhara r/a', 'bashundhara r\\a'] }
];

// Cuisines and Dishes Lexicon
export const FOOD_LEXICON = [
  { canonical: 'biryani', aliases: ['biryani', 'biriyani', 'বিরিয়ানি', 'kacchi', 'কাচ্চি', 'tehari', 'তেহারী'] },
  { canonical: 'kabab', aliases: ['kabab', 'kebab', 'কাবার', 'কাবাব', 'শিক কাবাব', 'sheekh', 'tikka', 'boti'] },
  { canonical: 'cafe', aliases: ['cafe', 'coffee', 'ক্যাফে', 'কফি', 'cappuccino', 'latte', 'espresso'] },
  { canonical: 'burger', aliases: ['burger', 'বার্গার', 'cheeseburger', 'patty', 'steak'] },
  { canonical: 'pizza', aliases: ['pizza', 'পিজ্জা', 'পিজা'] },
  { canonical: 'chinese', aliases: ['chinese', 'চাইনিজ', 'chowmein', 'manchurian', 'dumpling', 'wonton'] },
  { canonical: 'bangladeshi', aliases: ['bangladeshi', 'বাঙালি', 'bhat', 'dal', 'vorta', 'ilish', 'khichuri', 'deshi', 'ভাত', 'ভর্তা'] },
  { canonical: 'fast food', aliases: ['fast food', 'ফাস্ট ফুড', 'fries', 'fried chicken', 'wings'] },
  { canonical: 'seafood', aliases: ['seafood', 'সিফুড', 'fish', 'prawn', 'crab', 'squid'] },
  { canonical: 'bakery', aliases: ['bakery', 'বেকারি', 'pastry', 'cake', 'dessert', 'মিষ্টি', 'sweets'] },
  { canonical: 'tea', aliases: ['cha', 'tea', 'চা', 'tandoori cha', 'milk tea'] },
  { canonical: 'thai', aliases: ['thai', 'থাই', 'tom yum', 'pad thai'] }
];

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasKeyword(text, keyword) {
  if (!text || !keyword) return false;
  // If keyword contains non-ASCII (e.g. Bangla script)
  if (/[^\x00-\x7F]/.test(keyword)) {
    const escaped = escapeRegex(keyword);
    const pattern = new RegExp(`(?:^|[\\s,।!?;:"'])${escaped}(?:তে|এ|য়|র|এর|দের|কে)?(?:$|[\\s,।!?;:"'])`, 'u');
    return pattern.test(text);
  }
  // ASCII / Banglish matching with optional te/e/r suffixes
  const escaped = escapeRegex(keyword);
  const pattern = new RegExp(`\\b${escaped}(?:te|e|r|er)?\\b`, 'i');
  return pattern.test(text);
}

export function normalizeBanglaDigits(str) {
  if (!str) return '';
  return str.replace(/[০-৯]/g, d => BANGLA_DIGITS[d] || d);
}

export function parseNaturalQuery(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return {
      isValid: false,
      error: 'Empty search query'
    };
  }

  const rawQuery = query.trim();
  const normalizedText = normalizeBanglaDigits(rawQuery.toLowerCase());

  // 1. Ambiguity detection: check for "kal"
  if (hasKeyword(normalizedText, 'kal') || hasKeyword(normalizedText, 'kaal') || hasKeyword(normalizedText, 'কাল')) {
    return {
      isValid: true,
      rawQuery,
      isAmbiguous: true,
      clarificationQuestion: {
        text: 'Did you mean tomorrow (আগামীকাল) or another day?',
        options: ['Tomorrow (আগামীকাল)', 'Today (আজকে)', 'Specific date']
      },
      extracted: {}
    };
  }

  const extracted = {
    location: null,
    cuisine: null,
    specificDish: null,
    budget: null,
    partySize: null,
    mealTime: null,
    minRating: null,
    dineMode: 'dine_in'
  };

  // 2. Extract Location
  for (const area of DHAKA_AREAS) {
    for (const alias of area.aliases) {
      if (hasKeyword(normalizedText, alias)) {
        extracted.location = area.canonical;
        break;
      }
    }
    if (extracted.location) break;
  }

  // 3. Extract Food / Cuisine / Dish
  for (const food of FOOD_LEXICON) {
    for (const alias of food.aliases) {
      if (hasKeyword(normalizedText, alias)) {
        extracted.cuisine = food.canonical;
        extracted.specificDish = alias;
        break;
      }
    }
    if (extracted.cuisine) break;
  }

  // 4. Extract Party Size
  const partyMatch = normalizedText.match(/(?:^|[\s,।])(\d+)\s*(?:jon|people|person|persons|জন|er|jonner)(?:$|[\s,।])/iu);
  if (partyMatch) {
    const size = parseInt(partyMatch[1], 10);
    if (size > 0 && size <= 50) {
      extracted.partySize = size;
    }
  } else {
    for (const [word, val] of Object.entries(WORD_NUMBERS)) {
      const wordPattern = new RegExp(`\\b${word}\\s*(?:jon|people|person|জন)\\b`, 'i');
      if (wordPattern.test(normalizedText)) {
        extracted.partySize = val;
        break;
      }
    }
  }

  // 5. Extract Budget
  const budgetMatch = normalizedText.match(/(?:under|within|maximum|upto)?\s*(\d+)\s*(?:tk|taka|takar|টাকা)(?:\s*(?:moddhe|er moddhe|মধ্যে))?/i)
    || normalizedText.match(/(\d+)\s*(?:taka|tk|টাকা)/i);

  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1], 10);
    if (amount > 0 && amount <= 100000) {
      const isPerPerson = /(?:per person|each|jon proti|জন প্রতি)/i.test(normalizedText);
      extracted.budget = {
        amount,
        currency: 'BDT',
        isPerPerson
      };
    }
  } else if (/\b(?:sasta|cheap|budget|budget-friendly|kom daam|কম দামে|কম খরচে)\b/i.test(normalizedText)) {
    extracted.budget = {
      amount: 400,
      currency: 'BDT',
      isPerPerson: true,
      category: 'budget'
    };
  }

  // 6. Extract Meal Time
  if (/\b(?:dupur|dupure|lunch)\b|(?:^|[\s,।])(?:দুপুর|দুপুরে)(?:$|[\s,।])/iu.test(normalizedText)) {
    extracted.mealTime = 'lunch';
  } else if (/\b(?:raat|raatre|ratre|dinner|night|tonight)\b|(?:^|[\s,।])(?:রাত|রাতে|রাতের খাবার)(?:$|[\s,।])/iu.test(normalizedText)) {
    extracted.mealTime = 'dinner';
  } else if (/\b(?:shokal|shokale|breakfast|morning)\b|(?:^|[\s,।])(?:সকাল|সকালে|নাস্তা)(?:$|[\s,।])/iu.test(normalizedText)) {
    extracted.mealTime = 'breakfast';
  } else if (/\b(?:bikal|bikale|afternoon|adda|snack|evening)\b|(?:^|[\s,।])(?:বিকাল|বিকেলে|আড্ডা)(?:$|[\s,।])/iu.test(normalizedText)) {
    extracted.mealTime = 'afternoon';
  }

  // 7. Rating intention
  if (/\b(?:bhalo|best|top|top rated)\b|(?:^|[\s,।])(?:সেরা|ভালো)(?:$|[\s,।])/iu.test(normalizedText)) {
    extracted.minRating = 4.0;
  }

  // 8. Dine Mode
  if (/\b(?:takeaway|parcel|পার্সেল)\b/i.test(normalizedText)) {
    extracted.dineMode = 'takeaway';
  } else if (/\b(?:delivery|order in|হোম ডেলিভারি)\b/i.test(normalizedText)) {
    extracted.dineMode = 'delivery';
  }

  return {
    isValid: true,
    rawQuery,
    isAmbiguous: false,
    extracted,
    confidence: (extracted.location ? 0.4 : 0) + (extracted.cuisine ? 0.3 : 0) + (extracted.budget ? 0.2 : 0) + 0.1
  };
}

export default {
  BANGLA_DIGITS,
  WORD_NUMBERS,
  DHAKA_AREAS,
  FOOD_LEXICON,
  normalizeBanglaDigits,
  parseNaturalQuery
};
