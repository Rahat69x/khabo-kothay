import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PREFERENCES: 'gulshan_mobile_prefs',
  FAVORITES: 'gulshan_mobile_favorites',
  HISTORY: 'gulshan_mobile_history',
  TASTE_PROFILE: 'gulshan_mobile_taste_profile',
  TASTE_LEARNING_ENABLED: 'gulshan_mobile_learning_enabled',
  TASTE_LOG: 'gulshan_mobile_taste_log',
  ONBOARDING_COMPLETED: 'gulshan_mobile_onboarded',
  CACHED_RESULTS: 'gulshan_mobile_cached_results'
};

class MobileStorage {
  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.warn(`Error reading ${key} from AsyncStorage:`, e);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing ${key} to AsyncStorage:`, e);
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  }

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (e) {}
  }

  // --- Domain Methods (Matching Web Interface) ---

  async getPreferences() {
    const prefs = await this.getItem(STORAGE_KEYS.PREFERENCES);
    return prefs || {
      cuisine: 'All',
      priority: 'Best Overall',
      budget: 2,
      locationPreset: 'Notun Bazar',
      language: 'en',
      themeMode: 'system' // 'system' | 'light' | 'dark'
    };
  }

  async savePreferences(prefs) {
    const current = await this.getPreferences();
    await this.setItem(STORAGE_KEYS.PREFERENCES, { ...current, ...prefs });
  }

  async getFavorites() {
    return (await this.getItem(STORAGE_KEYS.FAVORITES)) || [];
  }

  async isFavorite(placeId) {
    const list = await this.getFavorites();
    return list.some(item => item.id === placeId);
  }

  async toggleFavorite(restaurant) {
    const list = await this.getFavorites();
    const idx = list.findIndex(r => r.id === restaurant.id);
    let isNowFavorite = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      isNowFavorite = false;
    } else {
      list.unshift({
        id: restaurant.id,
        displayName: restaurant.displayName,
        cuisine: restaurant.cuisine,
        priceLevel: restaurant.priceLevel,
        rating: restaurant.rating,
        formattedAddress: restaurant.formattedAddress,
        savedAt: new Date().toISOString()
      });
      isNowFavorite = true;
    }
    await this.setItem(STORAGE_KEYS.FAVORITES, list);
    return isNowFavorite;
  }

  async getHistory() {
    return (await this.getItem(STORAGE_KEYS.HISTORY)) || [];
  }

  async addSearchHistory(searchEntry) {
    const list = await this.getHistory();
    const entry = {
      ...searchEntry,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    const updated = [
      entry,
      ...list.filter(e => !(e.cuisine === searchEntry.cuisine && e.locationName === searchEntry.locationName && e.priority === searchEntry.priority))
    ].slice(0, 20);
    await this.setItem(STORAGE_KEYS.HISTORY, updated);
    return updated;
  }

  async getTasteProfile() {
    const profile = await this.getItem(STORAGE_KEYS.TASTE_PROFILE);
    return profile || {
      Japanese: 50,
      Bangladeshi: 50,
      Indian: 50,
      Chinese: 50,
      Korean: 50,
      'Fast Food': 50,
      Cafe: 50,
      Kabab: 50,
      Biriyani: 50,
      Dessert: 50,
      Coffee: 50,
      Burger: 50
    };
  }

  async saveTasteProfile(profile) {
    await this.setItem(STORAGE_KEYS.TASTE_PROFILE, profile);
  }

  async isLearningEnabled() {
    const val = await this.getItem(STORAGE_KEYS.TASTE_LEARNING_ENABLED);
    return val !== false;
  }

  async setLearningEnabled(enabled) {
    await this.setItem(STORAGE_KEYS.TASTE_LEARNING_ENABLED, Boolean(enabled));
  }

  async logTasteEvent(event) {
    const logs = (await this.getItem(STORAGE_KEYS.TASTE_LOG)) || [];
    logs.unshift({
      ...event,
      timestamp: new Date().toISOString()
    });
    await this.setItem(STORAGE_KEYS.TASTE_LOG, logs.slice(0, 100));
  }

  async isOnboarded() {
    const val = await this.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return Boolean(val);
  }

  async setOnboarded(val) {
    await this.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, Boolean(val));
  }

  async getCachedResults() {
    return await this.getItem(STORAGE_KEYS.CACHED_RESULTS);
  }

  async setCachedResults(data) {
    await this.setItem(STORAGE_KEYS.CACHED_RESULTS, {
      ...data,
      cachedAt: Date.now()
    });
  }

  async exportAllData() {
    return {
      preferences: await this.getPreferences(),
      favorites: await this.getFavorites(),
      history: await this.getHistory(),
      tasteProfile: await this.getTasteProfile(),
      learningEnabled: await this.isLearningEnabled(),
      exportedAt: new Date().toISOString()
    };
  }

  async deleteAllData() {
    await this.clear();
  }
}

export const mobileStorage = new MobileStorage();
export default mobileStorage;
