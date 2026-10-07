import { appStorage } from './storage.js';

class AppState {
  constructor() {
    const prefs = appStorage.getPreferences();
    this.currentLocation = {
      lat: 23.7975,
      lng: 90.4234,
      name: prefs.locationPreset || 'Notun Bazar'
    };
    this.cuisine = prefs.cuisine || 'All';
    this.mood = null;
    this.priority = prefs.priority || 'Best Overall';
    this.budget = prefs.budget || 2;
    this.results = [];
    this.topPicks = null;
    this.activeRestaurant = null;
    this.isLoading = false;
    this.weather = null;
    this.config = {
      googleBrowserKey: '',
      useMockData: true,
      presetLocations: {}
    };
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changeType) {
    for (const listener of this.listeners) {
      listener(this, changeType);
    }
  }

  setState(updates, changeType = 'update') {
    Object.assign(this, updates);
    this.notify(changeType);
  }

  setLocation(lat, lng, name) {
    this.currentLocation = { lat, lng, name };
    appStorage.savePreferences({ locationPreset: name });
    this.notify('location');
  }

  setCuisine(cuisine) {
    this.cuisine = cuisine;
    this.mood = null; // selecting explicit cuisine resets mood
    appStorage.savePreferences({ cuisine });
    this.notify('filter');
  }

  setMood(mood) {
    this.mood = mood;
    this.notify('mood');
  }

  setPriority(priority) {
    this.priority = priority;
    appStorage.savePreferences({ priority });
    this.notify('priority');
  }

  setBudget(budget) {
    this.budget = budget;
    appStorage.savePreferences({ budget });
    this.notify('budget');
  }

  setResults(results, topPicks) {
    this.results = results;
    this.topPicks = topPicks;
    this.activeRestaurant = results.length > 0 ? results[0] : null;
    this.notify('results');
  }

  setActiveRestaurant(restaurant) {
    this.activeRestaurant = restaurant;
    this.notify('activeRestaurant');
  }
}

export const state = new AppState();
export default state;
