import { state } from './state.js';
import { appStorage } from './storage.js';
import { fetchConfig, fetchWeather, fetchRecommendations, pingWarmUp } from './api.js';
import { mapController } from './map.js';
import { ui } from './ui.js';
import { initMoodUI } from './mood-ui.js';
import { initTasteUI } from './taste-ui.js';

async function initApp() {
  const wakeupBanner = document.getElementById('serverWakeupBanner');
  const wakeupMsg = document.getElementById('serverWakeupMsg');

  // Trigger non-blocking warm up check
  pingWarmUp((statusObj) => {
    if (statusObj.status === 'waking') {
      if (wakeupBanner) {
        wakeupBanner.classList.remove('hidden');
        if (wakeupMsg) wakeupMsg.textContent = statusObj.message;
      }
    } else {
      if (wakeupBanner) {
        wakeupBanner.classList.add('hidden');
      }
    }
  });

  try {
    // 1. Fetch Configuration
    const config = await fetchConfig();
    state.config = config;

    // 2. Fetch Weather
    const weather = await fetchWeather(state.currentLocation.lat, state.currentLocation.lng);
    if (weather) {
      state.weather = weather;
      updateWeatherPill(weather);
    }

    // 3. Initialize Map
    await mapController.init('mapContainer', config.googleBrowserKey);

    // 4. Initialize Modals & Features
    initMoodUI('moodChipsContainer', (selectedMood) => {
      // If mood selected, trigger fresh search
      executeSearch({ mood: selectedMood });
    });
    initTasteUI();
    initLocationControls(config.presetLocations);
    initFilterChips();
    initModals();
    ui.initDidYouGoPrompt();

    // 5. Run Initial Search
    await executeSearch();
  } catch (err) {
    console.error('App initialization error:', err);
    ui.showError(err.message, () => executeSearch());
  }
}

function updateWeatherPill(weather) {
  const pill = document.getElementById('weatherPill');
  if (!pill) return;
  const icon = weather.isRaining ? '🌧️' : (weather.tempC > 32 ? '☀️' : '🌤️');
  pill.innerHTML = `
    <span class="weather-icon">${icon}</span>
    <span class="weather-text">${weather.tempC}°C • ${weather.condition}</span>
  `;
  if (weather.isRaining) {
    pill.classList.add('weather-rain');
  }
}

function initLocationControls(presets = {}) {
  const select = document.getElementById('locationSelect');
  const gpsBtn = document.getElementById('useLocationBtn');
  const status = document.getElementById('locationStatus');

  if (select) {
    select.value = state.currentLocation.name;
    select.addEventListener('change', (e) => {
      const name = e.target.value;
      const spot = presets[name];
      if (spot) {
        state.setLocation(spot.lat, spot.lng, name);
        if (status) status.textContent = `Starting from: ${name}`;
        executeSearch();
      }
    });
  }

  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      gpsBtn.disabled = true;
      gpsBtn.innerHTML = '<span>⏳</span> Locating...';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = '<span>📡</span> Use Current GPS';
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          state.setLocation(lat, lng, 'Current GPS Spot');
          if (status) status.textContent = `Starting from: GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          executeSearch();
        },
        (err) => {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = '<span>📡</span> Use Current GPS';
          console.warn('Geolocation denied or failed, falling back to preset.', err);
          alert('GPS permission was denied or unavailable. Falling back to Notun Bazar.');
          state.setLocation(23.7975, 90.4234, 'Notun Bazar');
          if (select) select.value = 'Notun Bazar';
          if (status) status.textContent = 'Starting from: Notun Bazar';
          executeSearch();
        },
        { timeout: 8000 }
      );
    });
  }
}

function initFilterChips() {
  // Cuisine Chips
  const cuisineContainer = document.getElementById('cuisineChipsContainer');
  if (cuisineContainer) {
    cuisineContainer.querySelectorAll('.cuisine-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        cuisineContainer.querySelectorAll('.cuisine-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.setCuisine(btn.dataset.cuisine);
        // Clear mood active chips
        document.querySelectorAll('.mood-chip').forEach(b => b.classList.remove('active'));
        executeSearch();
      });
    });
  }

  // Priority Chips
  const priorityContainer = document.getElementById('priorityChipsContainer');
  if (priorityContainer) {
    priorityContainer.querySelectorAll('.priority-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        priorityContainer.querySelectorAll('.priority-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.setPriority(btn.dataset.priority);
        executeSearch();
      });
    });
  }

  // Budget Chips
  document.querySelectorAll('.budget-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.budget-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.setBudget(parseInt(btn.dataset.budget, 10));
      executeSearch();
    });
  });

  // Buttons
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => executeSearch());
  }

  const surpriseBtn = document.getElementById('surpriseBtn');
  if (surpriseBtn) {
    surpriseBtn.addEventListener('click', () => executeSearch({ surpriseMe: true }));
  }
}

function initModals() {
  // Favorites Modal
  const favBtn = document.getElementById('openFavoritesBtn');
  const favModal = document.getElementById('favoritesModal');
  const closeFav = document.getElementById('closeFavoritesModalBtn');
  const favList = document.getElementById('favoritesList');

  if (favBtn && favModal) {
    favBtn.addEventListener('click', () => {
      const items = appStorage.getFavorites();
      favList.innerHTML = items.length === 0
        ? '<div class="empty-msg">No saved restaurants yet. Tap the ❤️ icon on any card to save it.</div>'
        : items.map(item => `
          <div class="history-item">
            <div>
              <strong>${item.displayName}</strong>
              <div class="item-sub">${item.cuisine} • ⭐ ${item.rating} • ${'৳'.repeat(item.priceLevel || 2)}</div>
            </div>
          </div>
        `).join('');
      favModal.classList.add('open');
    });

    closeFav?.addEventListener('click', () => favModal.classList.remove('open'));
    favModal.addEventListener('click', (e) => {
      if (e.target === favModal) favModal.classList.remove('open');
    });
  }

  // History Modal
  const histBtn = document.getElementById('openHistoryBtn');
  const histModal = document.getElementById('historyModal');
  const closeHist = document.getElementById('closeHistoryModalBtn');
  const histList = document.getElementById('historyList');

  if (histBtn && histModal) {
    histBtn.addEventListener('click', () => {
      const history = appStorage.getHistory();
      histList.innerHTML = history.length === 0
        ? '<div class="empty-msg">No search history yet. Your recent queries will appear here.</div>'
        : history.map(item => `
          <div class="history-item clickable" data-cuisine="${item.cuisine}" data-priority="${item.priority}">
            <div>
              <strong>${item.cuisine || 'All'} (${item.priority})</strong>
              <div class="item-sub">Around ${item.locationName} • ${new Date(item.timestamp).toLocaleTimeString()}</div>
            </div>
            <button class="btn btn-outline btn-sm">Re-run</button>
          </div>
        `).join('');

      histList.querySelectorAll('.clickable').forEach(el => {
        el.onclick = () => {
          histModal.classList.remove('open');
          state.setCuisine(el.dataset.cuisine);
          state.setPriority(el.dataset.priority);
          executeSearch();
        };
      });

      histModal.classList.add('open');
    });

    closeHist?.addEventListener('click', () => histModal.classList.remove('open'));
    histModal.addEventListener('click', (e) => {
      if (e.target === histModal) histModal.classList.remove('open');
    });
  }
}

async function executeSearch(options = {}) {
  ui.showLoading();

  try {
    const payload = {
      lat: state.currentLocation.lat,
      lng: state.currentLocation.lng,
      cuisine: state.cuisine,
      priority: state.priority,
      budget: state.budget,
      mood: state.mood,
      surpriseMe: Boolean(options.surpriseMe)
    };

    const data = await fetchRecommendations(payload);

    state.setResults(data.results, data.topPicks);

    // Save to search history
    appStorage.addSearchHistory({
      locationName: state.currentLocation.name,
      cuisine: state.cuisine,
      priority: state.priority,
      budget: state.budget
    });

    // Render results & top picks
    ui.renderTopPicks(data.topPicks, (restaurant) => {
      mapController.highlightRestaurant(state.currentLocation, restaurant);
    });

    ui.renderResults(data.results, state.currentLocation, (restaurant) => {
      mapController.highlightRestaurant(state.currentLocation, restaurant);
    });

    // Update map with markers
    mapController.update(state.currentLocation, data.results, (restaurant) => {
      const card = document.getElementById(`card-${restaurant.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('flash-highlight');
        setTimeout(() => card.classList.remove('flash-highlight'), 1200);
      }
    });

    const countTag = document.getElementById('resultsCountTag');
    if (countTag) {
      countTag.textContent = `${data.results.length} places ranked`;
    }
  } catch (err) {
    console.error('Search failed:', err);
    ui.showError(err.message, () => executeSearch(options));
  }
}

document.addEventListener('DOMContentLoaded', initApp);
