import { REAL_DHAKA_RESTAURANTS } from '../data/dhaka-restaurants.js';

export const PRESET_LOCATIONS = {
  "Notun Bazar": { lat: 23.7975, lng: 90.4234, name: "Notun Bazar Bus Stand" },
  "Gulshan 1": { lat: 23.7785, lng: 90.4178, name: "Gulshan 1 Circle" },
  "Gulshan 2": { lat: 23.7925, lng: 90.4150, name: "Gulshan 2 Circle" },
  "Banani": { lat: 23.7937, lng: 90.4046, name: "Banani Road 11" },
  "Baridhara": { lat: 23.7998, lng: 90.4215, name: "Baridhara Diplomatic Zone" },
  "Dhanmondi": { lat: 23.7465, lng: 90.3760, name: "Dhanmondi Road 27" },
  "Uttara": { lat: 23.8728, lng: 90.3984, name: "Uttara Sector 3" },
  "Bashundhara R/A": { lat: 23.8164, lng: 90.4278, name: "Bashundhara R/A Gate" },
  "Mirpur": { lat: 23.8071, lng: 90.3686, name: "Mirpur 10 Circle" },
  "Bailey Road": { lat: 23.7410, lng: 90.4072, name: "Bailey Road" }
};

export const MOCK_RESTAURANTS = REAL_DHAKA_RESTAURANTS;

export function getMockCandidates(cuisine, budget = null, origin = null) {
  let list = [...MOCK_RESTAURANTS];
  if (cuisine && cuisine !== "All") {
    list = list.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  }
  if (budget) {
    const budgetNum = parseInt(budget, 10);
    if (!isNaN(budgetNum)) {
      const budgetFiltered = list.filter(r => r.priceLevel === null || r.priceLevel <= budgetNum + 1);
      if (budgetFiltered.length > 0) {
        list = budgetFiltered;
      }
    }
  }
  if (origin && origin.lat && origin.lng) {
    list.sort((a, b) => {
      const distA = Math.hypot(a.location.latitude - origin.lat, a.location.longitude - origin.lng);
      const distB = Math.hypot(b.location.latitude - origin.lat, b.location.longitude - origin.lng);
      return distA - distB;
    });
  }
  return list.slice(0, 25);
}
