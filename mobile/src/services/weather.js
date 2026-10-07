import { apiClient } from '../api/client.js';

export async function fetchCurrentWeather(lat = 23.7925, lng = 90.4150) {
  try {
    return await apiClient.getWeather(lat, lng);
  } catch (e) {
    return {
      isRaining: false,
      tempC: 28,
      condition: 'Clear'
    };
  }
}
