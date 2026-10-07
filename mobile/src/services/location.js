import * as Location from 'expo-location';

export const PRESET_LOCATIONS = {
  'Notun Bazar': { lat: 23.7975, lng: 90.4234, name: 'Notun Bazar Bus Stand' },
  'Gulshan 1': { lat: 23.7785, lng: 90.4178, name: 'Gulshan 1 Circle' },
  'Gulshan 2': { lat: 23.7925, lng: 90.4150, name: 'Gulshan 2 Circle' },
  'Banani': { lat: 23.7937, lng: 90.4046, name: 'Banani Road 11' },
  'Baridhara': { lat: 23.7998, lng: 90.4215, name: 'Baridhara Diplomatic Zone' }
};

export const DEFAULT_LOCATION = PRESET_LOCATIONS['Notun Bazar'];

/**
 * Requests device GPS location with fallback to Notun Bazar
 */
export async function getCurrentOrFallbackLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        ...DEFAULT_LOCATION,
        isGps: false,
        permissionDenied: true
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      name: 'Current Location',
      isGps: true,
      permissionDenied: false
    };
  } catch (err) {
    console.warn('GPS location retrieval failed or timed out:', err);
    return {
      ...DEFAULT_LOCATION,
      isGps: false,
      permissionDenied: false
    };
  }
}
