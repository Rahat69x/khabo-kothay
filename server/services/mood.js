import cuisinesConfig from '../config/cuisines.json' with { type: 'json' };

const MOODS_MAP = cuisinesConfig.moods;

/**
 * Get mood configuration
 */
export function getMoodConfig(moodName) {
  if (!moodName) return null;
  return MOODS_MAP[moodName] || null;
}

/**
 * Filter and boost candidates based on selected mood
 */
export function applyMoodCriteria(candidates, moodName, currentHour = new Date().getHours()) {
  const config = getMoodConfig(moodName);
  if (!config) return candidates;

  let filtered = [...candidates];

  // Apply hard filters if defined (e.g. Fine dining, Budget friendly)
  if (config.filters) {
    if (config.filters.maxPriceLevel !== undefined) {
      filtered = filtered.filter(c => c.priceLevel === null || c.priceLevel <= config.filters.maxPriceLevel);
    }
    if (config.filters.minPriceLevel !== undefined) {
      filtered = filtered.filter(c => c.priceLevel === null || c.priceLevel >= config.filters.minPriceLevel);
    }
    if (config.filters.minRating !== undefined) {
      filtered = filtered.filter(c => c.rating >= config.filters.minRating);
    }
  }

  // Time of day signal & label
  let timeOfDaySignal = null;
  if (currentHour >= 6 && currentHour < 11 && (moodName === 'Coffee' || moodName === 'Something light')) {
    timeOfDaySignal = 'Morning pick: great for an early start';
  } else if (currentHour >= 12 && currentHour < 15 && (moodName === 'Comfort food' || moodName === 'Fast food')) {
    timeOfDaySignal = 'Lunch rush: fast preparation';
  } else if (currentHour >= 19 && currentHour < 23 && (moodName === 'Fine dining' || moodName === 'Something spicy')) {
    timeOfDaySignal = 'Dinner hours: full menu available';
  }

  // Attach mood relevance flags to candidates
  return filtered.map(c => {
    let isDirectMoodMatch = false;
    if (config.cuisines && config.cuisines.length > 0) {
      isDirectMoodMatch = config.cuisines.some(target => 
        (c.cuisine && c.cuisine.toLowerCase() === target.toLowerCase()) ||
        (c.primaryType && c.primaryType.toLowerCase().includes(target.toLowerCase()))
      );
    }

    return {
      ...c,
      moodName,
      isDirectMoodMatch,
      timeOfDaySignal: isDirectMoodMatch ? timeOfDaySignal : null
    };
  });
}
