import { state } from './state.js';
import { ui } from './ui.js';
import { mapController } from './map.js';

export function initFilterUI() {
  const sidebar = document.getElementById('filterOptionsSidebar');
  const toggleBtn = document.getElementById('toggleFilterSidebarBtn');
  const badgeCount = document.getElementById('activeFilterCountBadge');
  const resetBtn = document.getElementById('resetAllFiltersBtn');
  const activeContainer = document.getElementById('activeFiltersContainer');

  const slider = document.getElementById('priceRangeSlider');
  const minInput = document.getElementById('priceMinInput');
  const maxInput = document.getElementById('priceMaxInput');
  const presetChips = document.querySelectorAll('.price-preset-chip');
  const checkboxes = document.querySelectorAll('.filter-checkbox');
  const collapsibleSections = document.querySelectorAll('.collapsible-section');

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

  // 2. Mobile toggle
  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  // 3. Price slider & numeric inputs
  let priceDebounce = null;
  function triggerPriceUpdate() {
    clearTimeout(priceDebounce);
    priceDebounce = setTimeout(() => {
      let min = parseInt(minInput?.value, 10);
      let max = parseInt(maxInput?.value, 10);
      if (isNaN(min) || min < 0) min = 0;
      if (isNaN(max) || max < min) max = Math.max(min, 3000);

      // Check preset active status
      presetChips.forEach(chip => {
        const cMin = Number(chip.dataset.min);
        const cMax = Number(chip.dataset.max);
        if (min === cMin && max === cMax) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });

      state.setFacetFilters({ priceMin: min, priceMax: max });
    }, 120);
  }

  slider?.addEventListener('input', () => {
    if (maxInput) maxInput.value = slider.value;
    triggerPriceUpdate();
  });

  minInput?.addEventListener('input', () => {
    triggerPriceUpdate();
  });

  maxInput?.addEventListener('input', () => {
    if (slider) slider.value = Math.min(3000, parseInt(maxInput.value, 10) || 3000);
    triggerPriceUpdate();
  });

  // Quick preset chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const min = Number(chip.dataset.min);
      const max = Number(chip.dataset.max);
      if (minInput) minInput.value = min;
      if (maxInput) maxInput.value = max;
      if (slider) slider.value = Math.min(3000, max);

      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.setFacetFilters({ priceMin: min, priceMax: max });
    });
  });

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
    if (minInput) minInput.value = 0;
    if (maxInput) maxInput.value = 3000;
    if (slider) slider.value = 3000;
    presetChips.forEach(c => c.classList.remove('active'));
    state.resetFacetFilters();
  }

  // 6. Active Filters Bar & Badge renderer
  function updateActiveBadges() {
    if (!activeContainer) return;
    const f = state.facetFilters;

    const badges = [];
    const isPriceCustom = (f.priceMin > 0 || f.priceMax < 3000);
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
        <span class="active-filter-badge" data-type="${b.type}" ${b.val ? `data-val="${b.val}"` : ''}>
          <span>${b.label}</span>
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
          if (minInput) minInput.value = 0;
          if (maxInput) maxInput.value = 3000;
          if (slider) slider.value = 3000;
          presetChips.forEach(c => c.classList.remove('active'));
          state.setFacetFilters({ priceMin: 0, priceMax: 3000 });
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
