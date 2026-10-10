import { esc } from './escape.js';
import { state } from './state.js';
import { appStorage } from './storage.js';
import { fetchConfig, fetchWeather, fetchRecommendations, pingWarmUp } from './api.js';
import { mapController } from './map.js';
import { ui } from './ui.js';
import { initMoodUI } from './mood-ui.js';
import { initTasteUI } from './taste-ui.js';
import { initMealTimeUI } from './mealtime-ui.js';
import { initFilterUI } from './filter-ui.js';
import { initI18n, toggleLanguage, applyTranslations } from './i18n.js';
import { groupFoodPlanner } from './group-planner.js';
import { mealCostEstimator } from './meal-estimator.js';

async function initApp() {
  const wakeupBanner = document.getElementById('serverWakeupBanner');
  const wakeupMsg = document.getElementById('serverWakeupMsg');
  const offlineBanner = document.getElementById('offlineBanner');
  const offlineRetryBtn = document.getElementById('offlineRetryBtn');

  // Initialize bilingual translations
  initI18n();

  // Offline / Online network state handling
  function handleNetworkStatus() {
    if (!navigator.onLine) {
      if (offlineBanner) offlineBanner.classList.remove('hidden');
    } else {
      if (offlineBanner) offlineBanner.classList.add('hidden');
    }
  }
  window.addEventListener('online', handleNetworkStatus);
  window.addEventListener('offline', handleNetworkStatus);
  handleNetworkStatus();

  offlineRetryBtn?.addEventListener('click', () => {
    executeSearch();
  });

  // Language toggle button listener
  const langToggleBtn = document.getElementById('langToggleBtn');
  langToggleBtn?.addEventListener('click', () => {
    toggleLanguage();
    // Re-render recommendations with translated labels
    if (state.topPicks) {
      ui.renderTopPicks(state.topPicks, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
    }
    if (state.results) {
      ui.renderResults(state.results, state.currentLocation, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
    }
  });

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
    try {
      await mapController.init('mapContainer', config.googleBrowserKey);
    } catch (mapErr) {
      console.warn('Map initialization deferred or fallback mode:', mapErr.message);
    }

    // 4. Initialize Modals & Features
    initTheme();
    initMoodUI('moodChipsContainer', (selectedMood) => {
      // If mood selected, trigger fresh search
      executeSearch({ mood: selectedMood });
    });
    initTasteUI();
    initLocationControls(config.presetLocations);
    initFilterChips();
    initFilterUI();
    initModals();
    groupFoodPlanner.init();
    mealCostEstimator.init();
    ui.initDidYouGoPrompt();
    initFeedbackCard();
    initPwaInstall();
    initModeTabs();
    initMealTimeUI({
      containerId: 'mealTimeControlPanel',
      resultsContainerId: 'resultsContainer',
      resultsHeadingId: 'resultsHeading',
      resultsCountTagId: 'resultsCountTag',
      originGetter: () => state.currentLocation,
      presetsGetter: () => config.presetLocations || {},
      onCandidateSelected: (candidate) => {
        mapController.highlightMarker(candidate.placeId);
      }
    });

    // 5. Run Initial Search
    await executeSearch();
  } catch (err) {
    console.error('App initialization error:', err);
    // If initial fetch failed, try offline cache
    const cached = appStorage.getItem('khabo_cached_results');
    if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
      if (offlineBanner) offlineBanner.classList.remove('hidden');
      state.setResults(cached.results, cached.topPicks);
      ui.renderTopPicks(cached.topPicks, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
      ui.renderResults(state.results, state.currentLocation, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
      mapController.update(state.currentLocation, state.results, (restaurant) => {
        const card = document.getElementById(`card-${restaurant.id}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } else {
      ui.showError(err.message, () => executeSearch());
    }
  }
}

function updateWeatherPill(weather) {
  const pill = document.getElementById('weatherPill');
  if (!pill) return;
  const icon = weather.isRaining ? '🌧️' : (weather.tempC > 32 ? '☀️' : '🌤️');
  pill.innerHTML = `
    <span class="weather-icon">${icon}</span>
    <span class="weather-text">${esc(weather.tempC)}°C • ${esc(weather.condition)}</span>
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
        if (status) status.innerHTML = '⚠️ Geolocation not supported by your browser. Please choose an area from the dropdown.';
        return;
      }
      gpsBtn.disabled = true;
      gpsBtn.innerHTML = '<span>⏳</span> Locating...';
      if (status) status.textContent = 'Acquiring GPS fix in Dhaka...';

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = '<span>📡</span> Use Current GPS';
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          state.setLocation(lat, lng, 'Current GPS Spot');
          if (status) status.textContent = `📍 Starting from: GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          executeSearch();
        },
        (err) => {
          gpsBtn.disabled = false;
          gpsBtn.innerHTML = '<span>📡</span> Use Current GPS';
          console.warn('Geolocation denied or failed, using Dhaka preset location.', err);
          let reasonMsg = 'GPS unavailable. Selected default Dhaka area: Notun Bazar';
          if (err.code === 1) reasonMsg = 'GPS permission denied. Using selected area from dropdown.';
          else if (err.code === 2) reasonMsg = 'Position unavailable. Using selected area from dropdown.';
          else if (err.code === 3) reasonMsg = 'GPS timed out. Using selected area from dropdown.';

          if (status) status.textContent = `ℹ️ ${reasonMsg}`;
          if (select) {
            select.focus();
          }
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 30000 }
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

  // Distance Radius Chips (Phase 1)
  const radiusContainer = document.getElementById('radiusChipsContainer');
  if (radiusContainer) {
    radiusContainer.querySelectorAll('.radius-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        radiusContainer.querySelectorAll('.radius-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const radiusVal = btn.dataset.radius === 'all' ? null : parseInt(btn.dataset.radius, 10);
        state.setDistanceRadius(radiusVal);
        executeSearch();
      });
    });
  }

  // Open Now Only Toggle (Phase 1)
  const openNowToggle = document.getElementById('openNowFilterToggle');
  if (openNowToggle) {
    openNowToggle.addEventListener('change', (e) => {
      state.setOpenNowOnly(e.target.checked);
      executeSearch();
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
              <strong>${esc(item.displayName)}</strong>
              <div class="item-sub">${esc(item.cuisine)} • ⭐ ${esc(item.rating)} • ${'৳'.repeat(item.priceLevel || 2)}</div>
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

  // Side-by-Side Comparison Modal (Phase 2)
  const comparePlacesBtn = document.getElementById('openSideBySideBtn');
  if (comparePlacesBtn) {
    comparePlacesBtn.addEventListener('click', () => {
      ui.openSideBySideModal(state.results, state.currentLocation);
    });
  }

  // Food Profile Modal (Phase 3)
  const profileBtn = document.getElementById('openProfileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      ui.openProfileModal(() => {
        executeSearch();
      });
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
          <div class="history-item clickable" data-cuisine="${esc(item.cuisine)}" data-priority="${esc(item.priority)}">
            <div>
              <strong>${esc(item.cuisine || 'All')} (${esc(item.priority)})</strong>
              <div class="item-sub">Around ${esc(item.locationName)} • ${new Date(item.timestamp).toLocaleTimeString()}</div>
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

function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const iconSpan = document.getElementById('themeToggleIcon');
  const labelSpan = document.getElementById('themeToggleLabel');
  const logoImg = document.getElementById('brandLogoImg');

  function getStoredTheme() {
    try {
      return localStorage.getItem('khabo_theme') || 'system';
    } catch (e) {
      return 'system';
    }
  }

  function setStoredTheme(theme) {
    try {
      if (theme === 'system') {
        localStorage.removeItem('khabo_theme');
      } else {
        localStorage.setItem('khabo_theme', theme);
      }
    } catch (e) {}
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    if (iconSpan && labelSpan) {
      if (theme === 'dark') {
        iconSpan.textContent = '🌙';
        labelSpan.textContent = 'Dark';
      } else if (theme === 'light') {
        iconSpan.textContent = '☀️';
        labelSpan.textContent = 'Light';
      } else {
        iconSpan.textContent = '🌓';
        labelSpan.textContent = 'Auto';
      }
    }

    if (logoImg) {
      logoImg.src = '/img/icon.svg';
    }

    if (mapController?.applyTheme) {
      mapController.applyTheme();
    }
  }

  let currentTheme = getStoredTheme();
  applyTheme(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (currentTheme === 'system') {
        currentTheme = 'dark';
      } else if (currentTheme === 'dark') {
        currentTheme = 'light';
      } else {
        currentTheme = 'system';
      }
      setStoredTheme(currentTheme);
      applyTheme(currentTheme);
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    });
  }
}

async function executeSearch(options = {}) {
  ui.showLoading();

  try {
    const foodProfile = appStorage.getFoodProfile();
    const payload = {
      lat: state.currentLocation.lat,
      lng: state.currentLocation.lng,
      cuisine: state.cuisine,
      priority: state.priority,
      budget: state.budget,
      mood: state.mood,
      openNowOnly: state.openNowOnly,
      distanceRadiusMeters: state.distanceRadius,
      surpriseMe: Boolean(options.surpriseMe),
      foodProfile,
      filters: state.facetFilters
    };

    const data = await fetchRecommendations(payload);

    // Save to offline cache
    appStorage.setItem('khabo_cached_results', {
      results: data.results,
      topPicks: data.topPicks,
      timestamp: Date.now()
    });

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

    ui.renderResults(state.results, state.currentLocation, (restaurant) => {
      mapController.highlightRestaurant(state.currentLocation, restaurant);
    });

    // Update map with markers
    mapController.update(state.currentLocation, state.results, (restaurant) => {
      const card = document.getElementById(`card-${restaurant.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('flash-highlight');
        setTimeout(() => card.classList.remove('flash-highlight'), 1200);
      }
    });

    const countTag = document.getElementById('resultsCountTag');
    if (countTag) {
      countTag.textContent = `${state.results.length} places ranked`;
    }

    // Show feedback card
    const feedbackCard = document.getElementById('feedbackCard');
    if (feedbackCard) {
      feedbackCard.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Search failed:', err);
    const cached = appStorage.getItem('khabo_cached_results');
    if (cached && Array.isArray(cached.results) && cached.results.length > 0) {
      const offlineBanner = document.getElementById('offlineBanner');
      if (offlineBanner) offlineBanner.classList.remove('hidden');
      state.setResults(cached.results, cached.topPicks);
      ui.renderTopPicks(cached.topPicks, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
      ui.renderResults(state.results, state.currentLocation, (restaurant) => {
        mapController.highlightRestaurant(state.currentLocation, restaurant);
      });
      mapController.update(state.currentLocation, state.results, (restaurant) => {
        const card = document.getElementById(`card-${restaurant.id}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      const countTag = document.getElementById('resultsCountTag');
      if (countTag) {
        countTag.textContent = `${state.results.length} places (Offline Cache)`;
      }
      return;
    }
    ui.showError(err.message, () => executeSearch(options));
  }
}

function initFeedbackCard() {
  const card = document.getElementById('feedbackCard');
  if (!card) return;

  let selectedAnswer = null;
  const buttons = card.querySelectorAll('.feedback-btn');
  const reasonRow = document.getElementById('feedbackReasonRow');
  const reasonInput = document.getElementById('feedbackReasonInput');
  const submitBtn = document.getElementById('submitFeedbackBtn');
  const thanksMsg = document.getElementById('feedbackThanks');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAnswer = btn.dataset.answer;
      if (reasonRow) reasonRow.classList.remove('hidden');
    });
  });

  submitBtn?.addEventListener('click', async () => {
    if (!selectedAnswer) return;
    const topPick = state.topPicks?.[0] || state.results?.[0];
    const payload = {
      areaName: state.currentLocation?.name,
      cuisine: state.cuisine,
      priority: state.priority,
      topPickId: topPick?.id,
      answer: selectedAnswer,
      reason: reasonInput?.value?.trim() || ''
    };

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (thanksMsg) thanksMsg.classList.remove('hidden');
      if (reasonRow) reasonRow.classList.add('hidden');
      setTimeout(() => {
        card.classList.add('hidden');
      }, 3000);
    } catch (e) {
      console.warn('Feedback submit error:', e);
    }
  });
}

function initPwaInstall() {
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.onclick = () => {
        installBtn.classList.add('hidden');
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
        });
      };
    }
  });

  if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration:', err);
      });
    });
  }
}

function initModeTabs() {
  const tabStd = document.getElementById('tabStandardMode');
  const tabMeal = document.getElementById('tabMealTimeMode');
  const panelStd = document.getElementById('standardSearchPanel');
  const panelMeal = document.getElementById('mealTimeControlPanel');

  tabStd?.addEventListener('click', () => {
    tabStd.classList.add('active');
    tabStd.setAttribute('aria-selected', 'true');
    tabMeal?.classList.remove('active');
    tabMeal?.setAttribute('aria-selected', 'false');
    panelStd?.classList.remove('hidden');
    panelMeal?.classList.add('hidden');
  });

  tabMeal?.addEventListener('click', () => {
    tabMeal.classList.add('active');
    tabMeal.setAttribute('aria-selected', 'true');
    tabStd?.classList.remove('active');
    tabStd?.setAttribute('aria-selected', 'false');
    panelStd?.classList.add('hidden');
    panelMeal?.classList.remove('hidden');
  });
}

document.addEventListener('DOMContentLoaded', initApp);
