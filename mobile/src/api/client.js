// Safe config reader supporting both Expo runtime and Node/Jest/Vitest environments
let extraConfig = {};
try {
  // eslint-disable-next-line global-require
  const Constants = (await import('expo-constants')).default;
  extraConfig = Constants?.expoConfig?.extra || {};
} catch (e) {
  // In pure Node/test environments where native Expo modules aren't linked
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || extraConfig.apiBaseUrl || 'http://10.0.2.2:3000';
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_CLIENT_TOKEN || extraConfig.appClientToken || 'gulshan_app_secret_token_2026';

class MobileApiClient {
  constructor(baseUrl = API_BASE_URL, token = APP_TOKEN) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-App-Token': this.token,
      'X-Client-Platform': 'mobile',
      'X-Requested-With': 'com.khabokothay.app'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  }

  async getConfig() {
    return this.request('/api/config');
  }

  async getWeather(lat, lng) {
    return this.request(`/api/context/weather?lat=${lat}&lng=${lng}`);
  }

  async getRecommendations({
    lat,
    lng,
    cuisine = 'All',
    priority = 'Best Overall',
    budget = 2,
    mood = null,
    tasteProfile = null,
    weatherContext = null,
    surpriseMe = false,
    timeBudgetMinutes = null,
    companion = null,
    preferences = null
  }) {
    return this.request('/api/recommend', {
      method: 'POST',
      body: JSON.stringify({
        lat,
        lng,
        cuisine,
        priority,
        budget,
        mood,
        tasteProfile,
        weatherContext,
        surpriseMe,
        timeBudgetMinutes,
        companion,
        preferences
      })
    });
  }

  async getBanditWeights() {
    return this.request('/api/bandit/weights');
  }

  async resetBanditWeights() {
    return this.request('/api/bandit/reset', { method: 'POST' });
  }

  async toggleBandit(enabled) {
    return this.request('/api/bandit/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  async compareRoutes(origin, destination) {
    return this.request('/api/routes/compare', {
      method: 'POST',
      body: JSON.stringify({ origin, destination })
    });
  }

  async getPlaceDetails(placeId) {
    return this.request(`/api/places/${placeId}/details`);
  }

  async postTasteEvent(currentProfile, event, candidatePool = null) {
    return this.request('/api/taste/event', {
      method: 'POST',
      body: JSON.stringify({ currentProfile, event, candidatePool })
    });
  }

  async pingWarmUp(onStatusChange = null, maxWaitMs = 60000) {
    const startTime = Date.now();
    let delay = 1500;
    let attempt = 1;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        if (onStatusChange && attempt > 1) {
          onStatusChange({
            status: 'waking',
            message: 'Waking up the server... Please hold on while the free instance boots up.',
            attempt,
            elapsedSeconds: Math.round((Date.now() - startTime) / 1000)
          });
        }
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
        const res = await fetch(`${this.baseUrl}/api/health`, {
          signal: controller?.signal,
          headers: {
            'X-App-Token': this.token,
            'X-Client-Platform': 'mobile'
          }
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.ok) {
            if (onStatusChange) {
              onStatusChange({ status: 'ready', app: data.app, version: data.version });
            }
            return { ok: true, app: data.app, attempts: attempt };
          }
        }
      } catch (e) {
        // network error, timeout, or server asleep
      }

      attempt++;
      if (Date.now() - startTime + delay >= maxWaitMs) {
        break;
      }
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 8000);
    }

    if (onStatusChange) {
      onStatusChange({ status: 'timeout', message: 'Server wake up timed out. Operating in offline mode.' });
    }
    return { ok: false, error: 'Warmup timeout' };
  }

  getPhotoUrl(photoName, maxWidth = 600) {
    if (!photoName) {
      return `${this.baseUrl}/api/places/photo?name=mock_placeholder&maxWidth=${maxWidth}`;
    }
    return `${this.baseUrl}/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidth=${maxWidth}`;
  }
}

export const apiClient = new MobileApiClient();
export default apiClient;
