import { esc } from './escape.js';
import { state } from './state.js';
import { ui } from './ui.js';
import { mapController } from './map.js';

export function initFilterUI() {
  const sidebar = document.getElementById('filterOptionsSidebar');
  const toggleBtn = document.getElementById('toggleFilterSidebarBtn');
  const badgeCount = document.getElementById('activeFilterCountBadge');
  const resetBtn = document.getElementById('resetAllFiltersBtn');
  const activeContainer = document.getElementById('activeFiltersContainer');

  const minSlider = document.getElementById('priceMinSlider');
  const maxSlider = document.getElementById('priceMaxSlider');
  const sliderFill = document.getElementById('dualSliderFill');
  const minInput = document.getElementById('priceMinInput');
  const maxInput = document.getElementById('priceMaxInput');
  const presetChips = document.querySelectorAll('.price-preset-chip');
  const topBudgetChips = document.querySelectorAll('.budget-chip');
  const checkboxes = document.querySelectorAll('.filter-checkbox');
  const collapsibleSections = document.querySelectorAll('.collapsible-section');

  const SLIDER_MAX = 5000;
  const SLIDER_MIN = 0;

  // 1. Collapsible Section headers
  collapsibleSections.forEach(section => {
    const header = section.querySelector('.filter-section-header');
    header?.addEventListener('click', () => {
      const isCollapsed = section.classList.contains('collapsed');
      if (isCollapsed) {
        section.classList.remove('collapsed');
        section.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      } else {
        section.classList.remove('open');
        section.classList.add('collapsed');
        header.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // 2. Mobile sidebar toggle
  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  // 3. Dual slider track fill update
  function updateSliderFill(minVal, maxVal) {
    if (!sliderFill) return;
    const leftPercent = Math.max(0, Math.min(100, (minVal / SLIDER_MAX) * 100));
    const rightPercent = Math.max(0, Math.min(100, 100 - (maxVal / SLIDER_MAX) * 100));
    sliderFill.style.left = `${leftPercent}%`;
    sliderFill.style.right = `${rightPercent}%`;
  }

  // Helper to synchronize active budget chips based on min & max
  function syncBudgetChips(minVal, maxVal) {
    let matchedTier = null;
    if (minVal <= 50 && maxVal <= 450) matchedTier = 1;
    else if (minVal >= 350 && minVal <= 500 && maxVal >= 800 && maxVal <= 1100) matchedTier = 2;
    else if (minVal >= 850 && minVal <= 1100 && maxVal >= 1800 && maxVal <= 2200) matchedTier = 3;
    else if (minVal >= 1800 && maxVal >= 4500) matchedTier = 4;
    else if (maxVal <= 400) matchedTier = 1;
    else if (minVal >= 2000) matchedTier = 4;

    presetChips.forEach(chip => {
      const cMin = Number(chip.dataset.min);
      const cMax = Number(chip.dataset.max);
      if (Math.abs(minVal - cMin) <= 50 && Math.abs(maxVal - cMax) <= 100) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    topBudgetChips.forEach(chip => {
      const bTier = Number(chip.dataset.budget);
      if (matchedTier && bTier === matchedTier) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    return matchedTier;
  }

  let priceDebounce = null;
  function triggerPriceUpdate(minVal, maxVal, fromSlider = false) {
    if (!fromSlider) {
      if (minSlider) minSlider.value = minVal;
      if (maxSlider) maxSlider.value = maxVal;
    }
    if (minInput && minInput.value !== String(minVal)) minInput.value = minVal;
    if (maxInput && maxInput.value !== String(maxVal)) maxInput.value = maxVal;

    updateSliderFill(minVal, maxVal);
    const matchedTier = syncBudgetChips(minVal, maxVal);

    clearTimeout(priceDebounce);
    priceDebounce = setTimeout(() => {
      if (matchedTier) {
        state.budget = matchedTier;
      }
      state.setFacetFilters({ priceMin: minVal, priceMax: maxVal });
    }, 80);
  }

  // Dual Slider Event Listeners
  minSlider?.addEventListener('input', () => {
    let minVal = parseInt(minSlider.value, 10) || 0;
    let maxVal = parseInt(maxSlider?.value, 10) || SLIDER_MAX;
    if (minVal > maxVal) {
      minVal = maxVal;
      minSlider.value = minVal;
    }
    triggerPriceUpdate(minVal, maxVal, true);
  });

  maxSlider?.addEventListener('input', () => {
    let minVal = parseInt(minSlider?.value, 10) || 0;
    let maxVal = parseInt(maxSlider.value, 10) || SLIDER_MAX;
    if (maxVal < minVal) {
      maxVal = minVal;
      maxSlider.value = maxVal;
    }
    triggerPriceUpdate(minVal, maxVal, true);
  });

  // Numeric Inputs Event Listeners
  minInput?.addEventListener('change', () => {
    let minVal = parseInt(minInput.value, 10);
    if (isNaN(minVal) || minVal < 0) minVal = 0;
    if (minVal > SLIDER_MAX) minVal = SLIDER_MAX;
    let maxVal = parseInt(maxInput?.value, 10) || SLIDER_MAX;
    if (minVal > maxVal) maxVal = minVal;
    triggerPriceUpdate(minVal, maxVal, false);
  });

  maxInput?.addEventListener('change', () => {
    let maxVal = parseInt(maxInput.value, 10);
    if (isNaN(maxVal) || maxVal < 0) maxVal = SLIDER_MAX;
    if (maxVal > SLIDER_MAX) maxVal = SLIDER_MAX;
    let minVal = parseInt(minInput?.value, 10) || 0;
    if (maxVal < minVal) minVal = maxVal;
    triggerPriceUpdate(minVal, maxVal, false);
  });

  // Sidebar Preset Chips (৳ ≤400, ৳৳ 400–950, ৳৳৳ 950–2k, ৳৳৳৳ 2k+)
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const min = Number(chip.dataset.min);
      const max = Number(chip.dataset.max);
      triggerPriceUpdate(min, max, false);
    });
  });

  // Top Budget Chips Synchronization (৳, ৳৳, ৳৳৳, ৳৳৳৳)
  topBudgetChips.forEach(btn => {
    btn.addEventListener('click', () => {
      const tier = parseInt(btn.dataset.budget, 10);
      let min = 0;
      let max = 5000;
      if (tier === 1) { min = 0; max = 400; }
      else if (tier === 2) { min = 400; max = 950; }
      else if (tier === 3) { min = 950; max = 2000; }
      else if (tier === 4) { min = 2000; max = 5000; }

      triggerPriceUpdate(min, max, false);
    });
  });

  // Subscribe to state changes for external budget updates
  state.subscribe((curState, changeType) => {
    if (changeType === 'budget') {
      const min = curState.facetFilters.priceMin || 0;
      const max = curState.facetFilters.priceMax || 5000;
      if (minSlider) minSlider.value = min;
      if (maxSlider) maxSlider.value = max;
      if (minInput) minInput.value = min;
      if (maxInput) maxInput.value = max;
      updateSliderFill(min, max);
      syncBudgetChips(min, max);
    }
  });

  // Initial Slider Track Fill
  const initialMin = parseInt(minSlider?.value || '0', 10);
  const initialMax = parseInt(maxSlider?.value || '3000', 10);
  updateSliderFill(initialMin, initialMax);
  syncBudgetChips(initialMin, initialMax);

  // 4. Checkboxes change listener
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      syncCheckboxesToState();
    });
  });

  function syncCheckboxesToState() {
    const groups = {
      availability: [],
      cuisine: [],
      restaurantType: [],
      dietary: [],
      features: []
    };

    checkboxes.forEach(cb => {
      if (cb.checked && groups[cb.dataset.group]) {
        groups[cb.dataset.group].push(cb.value);
      }
    });

    state.setFacetFilters({
      availability: groups.availability,
      cuisines: groups.cuisine,
      restaurantTypes: groups.restaurantType,
      dietary: groups.dietary,
      features: groups.features
    });
  }

  // 5. Reset All button
  resetBtn?.addEventListener('click', () => {
    resetAllFilters();
  });

  function resetAllFilters() {
    checkboxes.forEach(cb => { cb.checked = false; });
    triggerPriceUpdate(0, 5000, false);
    presetChips.forEach(c => c.classList.remove('active'));
    topBudgetChips.forEach(c => c.classList.remove('active'));
    state.resetFacetFilters();
  }

  // 6. Active Filters Bar & Badge renderer
  function updateActiveBadges() {
    if (!activeContainer) return;
    const f = state.facetFilters;

    const badges = [];
    const isPriceCustom = (f.priceMin > 0 || f.priceMax < 5000);
    if (isPriceCustom) {
      badges.push({
        type: 'price',
        label: `৳${f.priceMin} – ৳${f.priceMax}`
      });
    }

    const availLabels = {
      open_now: 'Open Now',
      closing_soon: 'Closing Soon',
      open_late: 'Open Late'
    };
    (f.availability || []).forEach(av => {
      badges.push({ type: 'availability', val: av, label: availLabels[av] || av });
    });

    (f.cuisines || []).forEach(c => {
      badges.push({ type: 'cuisine', val: c, label: c });
    });

    (f.restaurantTypes || []).forEach(t => {
      badges.push({ type: 'restaurantType', val: t, label: t });
    });

    const dietaryLabels = {
      halal: 'Halal',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      no_beef: 'No Beef'
    };
    (f.dietary || []).forEach(d => {
      badges.push({ type: 'dietary', val: d, label: dietaryLabels[d] || d });
    });

    (f.features || []).forEach(feat => {
      badges.push({ type: 'features', val: feat, label: feat });
    });

    // Update count on mobile filter button
    if (badgeCount) {
      if (badges.length > 0) {
        badgeCount.textContent = badges.length;
        badgeCount.classList.remove('hidden');
      } else {
        badgeCount.classList.add('hidden');
      }
    }

    if (badges.length === 0) {
      activeContainer.classList.add('hidden');
      activeContainer.innerHTML = '';
      return;
    }

    activeContainer.classList.remove('hidden');
    activeContainer.innerHTML = `
      <span class="active-filters-heading">Applied:</span>
      ${badges.map(b => `
        <span class="active-filter-badge" data-type="${esc(b.type)}" ${b.val ? `data-val="${esc(b.val)}"` : ''}>
          <span>${esc(b.label)}</span>
          <span class="active-filter-remove" aria-label="Remove filter">✕</span>
        </span>
      `).join('')}
      <button type="button" class="clear-all-filters-btn">Clear All</button>
    `;

    // Attach remove handlers
    activeContainer.querySelectorAll('.active-filter-badge').forEach(badgeEl => {
      badgeEl.addEventListener('click', () => {
        const type = badgeEl.dataset.type;
        const val = badgeEl.dataset.val;

        if (type === 'price') {
          triggerPriceUpdate(0, 5000, false);
          state.setFacetFilters({ priceMin: 0, priceMax: 5000 });
        } else {
          // Uncheck corresponding checkbox
          const matchCb = Array.from(checkboxes).find(cb => cb.dataset.group === type && cb.value === val);
          if (matchCb) {
            matchCb.checked = false;
            syncCheckboxesToState();
          }
        }
      });
    });

    activeContainer.querySelector('.clear-all-filters-btn')?.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // 7. Subscribe to state changes to update results and badges
  state.subscribe((curState, changeType) => {
    if (changeType === 'facetFilter' || changeType === 'results') {
      updateActiveBadges();

      if (changeType === 'facetFilter') {
        // Re-render restaurant cards with filtered list
        ui.renderResults(curState.results, curState.currentLocation, (restaurant) => {
          mapController.highlightRestaurant(curState.currentLocation, restaurant);
        });

        // Update map markers
        mapController.update(curState.currentLocation, curState.results, (restaurant) => {
          const card = document.getElementById(`card-${restaurant.id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('flash-highlight');
            setTimeout(() => card.classList.remove('flash-highlight'), 1200);
          }
        });

        const countTag = document.getElementById('resultsCountTag');
        if (countTag) {
          countTag.textContent = `${curState.results.length} places match filters`;
        }
      }
    }
  });
}
