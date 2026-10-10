import { appStorage } from './storage.js';
import { recordTasteSignal, compareRoutes } from './api.js';
import { mapController } from './map.js';
import { esc, safeUrl } from './escape.js';

export class UIController {
  constructor() {
    this.resultsContainer = document.getElementById('resultsContainer');
    this.topPicksContainer = document.getElementById('topPicksContainer');
    this.drawer = document.getElementById('explainDrawer');
    this.compareModal = document.getElementById('compareModal');
    this.favModal = document.getElementById('favoritesModal');
    this.historyModal = document.getElementById('historyModal');
    this.menuModal = document.getElementById('menuModal');
    this.sideBySideModal = document.getElementById('sideBySideModal');
    this.profileModal = document.getElementById('profileModal');
  }

  showLoading() {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = `
      <div class="skeleton-list">
        ${[1, 2, 3].map(() => `
          <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-content">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line subtitle"></div>
              <div class="skeleton-line text"></div>
              <div class="skeleton-line btn"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    if (this.topPicksContainer) {
      this.topPicksContainer.innerHTML = `<div class="skeleton-card" style="height: 120px;"></div>`;
    }
  }

  showError(message, retryCallback) {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = `
      <div class="empty-state error-state">
        <div class="empty-icon">⚠️</div>
        <h3>Unable to load recommendations</h3>
        <p>${esc(message || 'An unexpected error occurred while contacting the server.')}</p>
        <button id="errorRetryBtn" class="btn btn-primary">Try Again</button>
      </div>
    `;
    const btn = document.getElementById('errorRetryBtn');
    if (btn && retryCallback) {
      btn.addEventListener('click', retryCallback);
    }
  }

  showEmpty() {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>No restaurants found</h3>
        <p>No open places matched your current filters. Try expanding your budget or picking a different cuisine.</p>
      </div>
    `;
    if (this.topPicksContainer) this.topPicksContainer.innerHTML = '';
  }

  renderTopPicks(topPicks, onSelectRestaurant) {
    if (!this.topPicksContainer || !topPicks) return;
    const { bestMatch, fastestOrNearest, trySomethingNew, summary } = topPicks;
    if (!bestMatch) return;

    this.topPicksContainer.innerHTML = `
      <div class="top-picks-card">
        <div class="top-picks-header">
          <div class="top-picks-title">
            <span class="sparkle-icon">✨</span>
            <div>
              <h3>For you right now</h3>
              <p class="top-picks-summary">${esc(summary)}</p>
            </div>
          </div>
        </div>
        <div class="top-picks-grid">
          ${bestMatch ? this.renderMiniPick(bestMatch, '🌟 Best Match', 'best-match', onSelectRestaurant) : ''}
          ${fastestOrNearest ? this.renderMiniPick(fastestOrNearest, '⚡ Fastest Option', 'fastest-option', onSelectRestaurant) : ''}
          ${trySomethingNew ? this.renderMiniPick(trySomethingNew, '🎲 Try Something New', 'discovery-option', onSelectRestaurant) : ''}
        </div>
      </div>
    `;

    this.topPicksContainer.querySelectorAll('.mini-pick').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const targetCard = document.getElementById(`card-${id}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('flash-highlight');
          setTimeout(() => targetCard.classList.remove('flash-highlight'), 1200);
        }
      });
    });
  }

  getOpeningStatusBadge(openStatus) {
    if (!openStatus || !openStatus.status || openStatus.status === 'Hours unknown') {
      return '<span class="status-chip status-unknown">⚪ Hours unknown</span>';
    }
    if (openStatus.status === 'Closing soon') {
      const minText = openStatus.minutesUntilClose ? ` (${esc(openStatus.minutesUntilClose)} min)` : '';
      return `<span class="status-chip status-closing">🟡 Closing soon${minText}</span>`;
    }
    if (openStatus.status === 'Open now' || openStatus.isOpen === true) {
      return '<span class="status-chip status-open">🟢 Open now</span>';
    }
    return '<span class="status-chip status-closed">🔴 Closed</span>';
  }

  formatTravelDistance(r) {
    const km = (r.distanceMeters / 1000).toFixed(1);
    if (r.durationSeconds !== null && r.durationSeconds !== undefined) {
      const mins = Math.max(1, Math.round(r.durationSeconds / 60));
      return `🚗 Driving: ${mins} min • ${km} km`;
    }
    return `Travel time: Not available • ${km} km (approx. straight-line)`;
  }

  renderMiniPick(item, badgeText, badgeClass, onSelect) {
    const km = (item.distanceMeters / 1000).toFixed(1);
    const timeText = item.durationSeconds !== null && item.durationSeconds !== undefined
      ? `${Math.max(1, Math.round(item.durationSeconds / 60))} min (${km} km)`
      : `${km} km (approx. straight-line)`;

    return `
      <div class="mini-pick ${badgeClass}" data-id="${esc(item.id)}">
        <span class="mini-badge">${esc(badgeText)}</span>
        <h4 class="mini-name">${esc(item.displayName)}</h4>
        <div class="mini-meta">
          <span>${esc(item.rating)}★ (${esc(item.userRatingCount)})</span>
          <span>•</span>
          <span>${esc(timeText)}</span>
        </div>
        <p class="mini-reason">${esc(item.reason)}</p>
      </div>
    `;
  }

  renderResults(restaurants, userLocation, onSelectRestaurant) {
    if (!this.resultsContainer) return;
    if (restaurants.length === 0) {
      this.showEmpty();
      return;
    }

    this.resultsContainer.innerHTML = restaurants.map((r, idx) => {
      const isFav = appStorage.isFavorite(r.id);
      const travelInfo = this.formatTravelDistance(r);
      const openingBadge = this.getOpeningStatusBadge(r.openStatus);
      const priceText = r.priceLevel ? '৳'.repeat(r.priceLevel) : 'Price unlisted';
      const costPerPersonText = r.estimatedCostPerPersonBdt
        ? `~৳${r.estimatedCostPerPersonBdt}/person`
        : 'Cost: Not available';
      const trafficColor = r.trafficLevel === 'Low' ? 'traffic-green' : (r.trafficLevel === 'Moderate' ? 'traffic-yellow' : 'traffic-red');
      const photoUrl = r.photos && r.photos.length > 0
        ? `/api/places/photo?name=${encodeURIComponent(r.photos[0].name)}&maxWidth=600`
        : `/api/places/photo?name=mock_placeholder&maxWidth=600`;

      const directionsUrl = mapController.getGoogleMapsDirectionsUrl(userLocation, r);

      return `
        <article class="restaurant-card" id="card-${esc(r.id)}" data-id="${esc(r.id)}">
          <div class="card-media">
            <img src="${esc(photoUrl)}" alt="${esc(r.displayName)}" class="card-photo" loading="lazy" />
            <div class="card-badges">
              <span class="rank-badge">#${idx + 1}</span>
              ${r.badges.map(b => `<span class="factor-badge ${this.getBadgeClass(b)}">${esc(b)}</span>`).join('')}
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${esc(r.id)}" aria-label="Toggle favorite">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>

          <div class="card-body">
            <div class="card-header-row">
              <h3 class="card-title">${esc(r.displayName)}</h3>
              <div class="card-score-pill" title="Algorithmic match score (0-100)">
                ${esc(r.score)}<small>/100</small>
              </div>
            </div>

            <p class="card-address">${esc(r.formattedAddress)}</p>

            <div class="card-metrics-row" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0;">
              ${openingBadge}
              <span class="metric-item rating-metric">⭐ ${esc(r.rating)} <small>(${esc(r.userRatingCount)})</small></span>
              <span class="metric-item price-metric">${priceText}</span>
              <span class="metric-item cost-metric" style="font-weight: 700; color: var(--primary);">${esc(costPerPersonText)}</span>
              <span class="metric-item time-metric">🕒 ${esc(travelInfo)}</span>
              ${r.trafficLevel && r.trafficLevel !== 'Unknown' ? `<span class="traffic-chip ${trafficColor}">🚦 ${esc(r.trafficLevel)} Traffic</span>` : ''}
            </div>

            <div class="card-transport-box">
              <span class="transport-label">Estimated Transit:</span>
              <span class="transport-cost">~৳${esc(r.transport.cheapestEstimatedCostBdt)} (${esc(r.transport.cheapestFeasibleMode)})</span>
              <span class="estimate-tag">estimated</span>
            </div>

            <div class="card-reason-box">
              <span class="reason-icon">💡</span>
              <p class="reason-text">${esc(r.reason)}</p>
            </div>

            <div class="card-actions">
              <button class="btn btn-outline btn-menu" data-id="${esc(r.id)}">
                🍽️ Menu & Prices
              </button>
              <button class="btn btn-outline btn-compare" data-id="${esc(r.id)}">
                🔄 Routes
              </button>
              <button class="btn btn-outline btn-explain" data-id="${esc(r.id)}">
                📊 Why this pick?
              </button>
              <a href="${esc(directionsUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-directions" data-id="${esc(r.id)}">
                🧭 Directions
              </a>
              <button class="btn btn-ghost btn-dismiss" data-id="${esc(r.id)}" title="Not interested (teaches your taste profile)">
                ✕
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach Event Handlers
    restaurants.forEach(r => {
      const card = document.getElementById(`card-${r.id}`);
      if (!card) return;

      // Card click selects restaurant & highlights on map
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        document.querySelectorAll('.restaurant-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        mapController.highlightRestaurant(userLocation, r);
        recordTasteSignal('viewed', r);
      });

      // Favorite toggle
      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isNowFav = appStorage.toggleFavorite(r);
          favBtn.innerHTML = isNowFav ? '❤️' : '🤍';
          favBtn.classList.toggle('active', isNowFav);
          if (isNowFav) recordTasteSignal('favorited', r);
        });
      }

      // Menu modal
      const menuBtn = card.querySelector('.btn-menu');
      if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openMenuModal(r);
        });
      }

      // Compare Routes
      const compareBtn = card.querySelector('.btn-compare');
      if (compareBtn) {
        compareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openCompareModal(userLocation, r);
        });
      }

      // Explain Drawer
      const explainBtn = card.querySelector('.btn-explain');
      if (explainBtn) {
        explainBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openExplainDrawer(r);
        });
      }

      // Directions button
      const directionsBtn = card.querySelector('.btn-directions');
      if (directionsBtn) {
        directionsBtn.addEventListener('click', () => {
          recordTasteSignal('directions', r);
          appStorage.setItem('pending_visit_place', { id: r.id, name: r.displayName, cuisine: r.cuisine, timestamp: Date.now() });
        });
      }

      // Dismiss button
      const dismissBtn = card.querySelector('.btn-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.style.opacity = '0.3';
          card.style.pointerEvents = 'none';
          recordTasteSignal('dismissed', r);
        });
      }
    });
  }

  getBadgeClass(badge) {
    if (badge === 'Best Overall') return 'badge-best';
    if (badge === 'Fastest to Reach') return 'badge-fast';
    if (badge === 'Best for Price') return 'badge-price';
    if (badge === 'Try something new') return 'badge-discovery';
    return 'badge-collab';
  }

  openExplainDrawer(restaurant) {
    if (!this.drawer) return;
    const b = restaurant.factorBreakdown || {};

    const content = `
      <div class="drawer-header">
        <h3>Recommendation Breakdown</h3>
        <button id="closeDrawerBtn" class="close-btn" aria-label="Close drawer">✕</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-restaurant-info">
          <h4>${esc(restaurant.displayName)}</h4>
          <span class="drawer-score">${esc(restaurant.score)}/100 Match Score</span>
        </div>
        <p class="drawer-summary">${esc(restaurant.reason)}</p>
        
        <div class="breakdown-list">
          ${this.renderBreakdownBar('Taste Affinity', b.taste)}
          ${this.renderBreakdownBar('Travel Time', b.time)}
          ${this.renderBreakdownBar('Traffic Flow', b.traffic)}
          ${this.renderBreakdownBar('Customer Rating', b.rating)}
          ${this.renderBreakdownBar('Restaurant Price Level', b.price)}
          ${this.renderBreakdownBar('Transport Transit Cost', b.cost)}
          ${this.renderBreakdownBar('Proximity Distance', b.distance)}
        </div>
      </div>
    `;

    this.drawer.innerHTML = content;
    this.drawer.classList.add('open');

    const closeBtn = document.getElementById('closeDrawerBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.drawer.classList.remove('open');
    }
  }

  renderBreakdownBar(label, value = 50) {
    return `
      <div class="breakdown-item">
        <div class="breakdown-labels">
          <span>${esc(label)}</span>
          <span class="breakdown-pct">${value}%</span>
        </div>
        <div class="breakdown-track">
          <div class="breakdown-bar" style="width: ${value}%;"></div>
        </div>
      </div>
    `;
  }

  async openCompareModal(userLocation, restaurant) {
    if (!this.compareModal) return;
    this.compareModal.classList.add('open');
    this.compareModal.innerHTML = `
      <div class="modal-box modal-lg">
        <div class="modal-header">
          <h3>Compare Routes & Transport to ${esc(restaurant.displayName)}</h3>
          <button class="close-modal-btn" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="loading-spinner">Calculating traffic-aware routes and Dhaka transport fares...</div>
        </div>
      </div>
    `;
    // Inline onclick handlers are blocked by the CSP (script-src-attr 'none')
    this.compareModal.querySelector('.close-modal-btn').addEventListener('click', () => {
      this.compareModal.classList.remove('open');
    });

    try {
      const data = await compareRoutes(userLocation, {
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      });

      const modalBody = this.compareModal.querySelector('.modal-body');
      modalBody.innerHTML = `
        <div class="route-reason-highlight">
          <strong>Recommended Path:</strong> ${esc(data.recommendationReason)}
        </div>

        <h4>Alternative Driving Routes</h4>
        <div class="routes-comparison-grid">
          ${data.routes.map((rt, idx) => `
            <div class="route-option-card ${idx === data.recommendedRouteIndex ? 'recommended' : ''}">
              <div class="route-option-badge">
                ${idx === data.recommendedRouteIndex ? '★ Recommended' : `Option ${idx + 1}`}
              </div>
              <h5>${esc(rt.name)}</h5>
              <div class="route-meta">
                <span>⏱️ ${Math.round(rt.durationSeconds / 60)} min</span>
                <span>🛣️ ${(rt.distanceMeters / 1000).toFixed(1)} km</span>
                <span class="traffic-tag ${rt.trafficLevel.toLowerCase()}">Traffic: ${esc(rt.trafficLevel)}</span>
              </div>
              <p class="route-summary">${esc(rt.summary || 'Real-time computed road path')}</p>
            </div>
          `).join('')}
        </div>

        <h4 style="margin-top: 24px;">Transport Mode Cost Estimator (Dhaka Model)</h4>
        <p class="caption-text">All fares are estimated based on local Dhaka meters, rickshaw rates, and traffic congestion multipliers.</p>
        <div class="transport-table-wrapper">
          <table class="transport-table">
            <thead>
              <tr>
                <th>Mode</th>
                <th>Estimated Cost</th>
                <th>Feasibility</th>
                <th>Calculation Model</th>
              </tr>
            </thead>
            <tbody>
              ${data.transportModes.map(m => `
                <tr>
                  <td><strong>${esc(m.modeName)}</strong></td>
                  <td class="cost-cell">৳${esc(m.estimatedCostBdt)} <small class="estimate-tag">estimated</small></td>
                  <td>${m.feasible ? '✅ Feasible' : '⚠️ Long distance'}</td>
                  <td class="calc-cell">${esc(m.breakdown.calculation)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      const modalBody = this.compareModal.querySelector('.modal-body');
      modalBody.innerHTML = `<div class="error-msg">Error calculating routes: ${esc(e.message)}</div>`;
    }
  }

  openMenuModal(r) {
    if (!this.menuModal) return;
    const titleEl = document.getElementById('menuModalTitle');
    const contentEl = document.getElementById('menuModalContent');
    const closeBtn = document.getElementById('closeMenuModalBtn');
    if (titleEl) titleEl.textContent = `🍽️ ${r.displayName} — Menu & Prices`;

    const menu = r.menu || null;
    const costPerPerson = r.estimatedCostPerPersonBdt;
    const costRange = r.costRangeMinBdt && r.costRangeMaxBdt ? `৳${r.costRangeMinBdt} - ৳${r.costRangeMaxBdt}` : null;
    const costDerivation = r.costDerivation || (r.priceLevel ? `Estimated based on price level (${'৳'.repeat(r.priceLevel)}) and average Dhaka dining portion` : null);

    let costSectionHtml = '';
    if (costPerPerson) {
      costSectionHtml = `
        <div class="menu-cost-box" style="background: var(--surface-alt); padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="font-size: 1.1rem; color: var(--primary);">~৳${costPerPerson} per person</strong>
            ${costRange ? `<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Range: ${esc(costRange)}</span>` : ''}
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            <strong>How derived:</strong> ${esc(costDerivation)}
          </p>
        </div>
      `;
    } else {
      costSectionHtml = `
        <div class="menu-cost-box" style="background: var(--surface-alt); padding: 12px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border);">
          <span style="font-size: 0.9rem; color: var(--text-muted);">Estimated cost per person: <strong>Not available</strong> (insufficient verified pricing data)</span>
        </div>
      `;
    }

    let itemsHtml = '';
    if (menu && Array.isArray(menu.items) && menu.items.length > 0) {
      itemsHtml = `
        <div class="menu-items-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          ${menu.items.map(item => {
            const badgeClass = item.status === 'Verified' ? 'status-open' : (item.status === 'Unverified' ? 'status-closing' : 'status-unknown');
            const priceLabel = item.priceBdt ? `৳${item.priceBdt}` : 'Not available';
            return `
              <div class="menu-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px;">
                <div style="flex: 1; margin-right: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="font-size: 0.95rem;">${esc(item.name)}</strong>
                    <span class="status-chip ${badgeClass}" style="font-size: 0.7rem; padding: 2px 6px;">${esc(item.status || 'Verified')}</span>
                  </div>
                  ${item.description ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${esc(item.description)}</p>` : ''}
                </div>
                <div style="text-align: right; min-width: 80px;">
                  <strong style="font-size: 1rem; color: var(--primary);">${esc(priceLabel)}</strong>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      itemsHtml = `
        <div class="empty-state" style="padding: 24px; text-align: center; background: var(--surface-alt); border-radius: 12px; margin-bottom: 16px;">
          <p style="font-weight: 700; margin-bottom: 4px;">No verified menu items currently on file</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Verified menus are traceable from official sources or owner submission. No estimates are presented as factual prices.</p>
        </div>
      `;
    }

    const sourceHtml = menu && menu.sourceUrl ? `
      <div class="menu-source-card" style="padding: 12px; background: var(--surface-alt); border-radius: 10px; font-size: 0.85rem; border: 1px solid var(--border);">
        <p><strong>Traceable Source:</strong> ${esc(menu.sourceName || 'Official Listing')}</p>
        <p style="margin-top: 4px; word-break: break-all;">
          <strong>Link:</strong> <a href="${safeUrl(menu.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">${esc(menu.sourceUrl)}</a>
        </p>
        <p style="margin-top: 4px; color: var(--text-muted); font-size: 0.8rem;">
          <strong>Last checked:</strong> ${esc(menu.lastChecked || 'Recently')}
        </p>
      </div>
    ` : `
      <div class="menu-source-card" style="padding: 12px; background: var(--surface-alt); border-radius: 10px; font-size: 0.85rem; border: 1px solid var(--border);">
        <p style="color: var(--text-muted);">Source: <em>Unverified / Awaiting owner or verified submission</em></p>
      </div>
    `;

    const websiteBtnHtml = (menu?.sourceUrl || r.websiteUri) ? `
      <div style="margin-top: 14px; text-align: right;">
        <a href="${safeUrl(menu?.sourceUrl || r.websiteUri)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          🌐 View Official Menu / Website
        </a>
      </div>
    ` : '';

    if (contentEl) {
      contentEl.innerHTML = `
        ${costSectionHtml}
        <h4 style="margin-bottom: 10px;">📋 Menu Items & Prices</h4>
        ${itemsHtml}
        ${sourceHtml}
        ${websiteBtnHtml}
      `;
    }

    this.menuModal.classList.add('open');
    if (closeBtn) closeBtn.onclick = () => this.menuModal.classList.remove('open');
    this.menuModal.onclick = (e) => {
      if (e.target === this.menuModal) this.menuModal.classList.remove('open');
    };
  }

  openSideBySideModal(restaurants, userLocation) {
    if (!this.sideBySideModal) return;
    const selectorsContainer = document.getElementById('compareSelectorsContainer');
    const tableContainer = document.getElementById('sideBySideTableContainer');
    const closeBtn = document.getElementById('closeSideBySideModalBtn');
    const budgetSlider = document.getElementById('compareBudgetSlider');
    const budgetValue = document.getElementById('compareBudgetValue');

    if (!restaurants || restaurants.length === 0) {
      if (tableContainer) {
        tableContainer.innerHTML = '<p class="empty-msg">No restaurants available to compare. Please run a search first.</p>';
      }
      this.sideBySideModal.classList.add('open');
      if (closeBtn) closeBtn.onclick = () => this.sideBySideModal.classList.remove('open');
      return;
    }

    let selectedIds = [restaurants[0]?.id, restaurants[1]?.id, restaurants[2]?.id].filter(Boolean);
    let maxBudget = budgetSlider ? parseInt(budgetSlider.value, 10) : 2500;

    const renderSelectors = () => {
      if (!selectorsContainer) return;
      selectorsContainer.innerHTML = [0, 1, 2].map(slotIdx => `
        <div style="flex: 1; min-width: 140px;">
          <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">Place ${slotIdx + 1}:</label>
          <select class="form-input compare-select" data-slot="${slotIdx}" style="width: 100%; padding: 6px 10px; font-size: 0.85rem;">
            <option value="">-- None --</option>
            ${restaurants.map(r => `
              <option value="${esc(r.id)}" ${selectedIds[slotIdx] === r.id ? 'selected' : ''}>${esc(r.displayName)} (${esc(r.cuisine)})</option>
            `).join('')}
          </select>
        </div>
      `).join('');

      selectorsContainer.querySelectorAll('.compare-select').forEach(sel => {
        sel.onchange = (e) => {
          const slot = parseInt(e.target.dataset.slot, 10);
          selectedIds[slot] = e.target.value || null;
          renderTable();
        };
      });
    };

    const renderTable = () => {
      if (!tableContainer) return;
      const comparedPlaces = selectedIds
        .map(id => restaurants.find(r => r.id === id))
        .filter(Boolean);

      if (comparedPlaces.length < 2) {
        tableContainer.innerHTML = '<p class="empty-msg" style="padding: 20px; text-align: center;">Please select at least 2 restaurants above to compare.</p>';
        return;
      }

      tableContainer.innerHTML = `
        <table class="compare-table" style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border);">
              <th style="text-align: left; padding: 10px; width: 22%;">Feature</th>
              ${comparedPlaces.map(r => `
                <th style="text-align: left; padding: 10px; width: ${Math.floor(78 / comparedPlaces.length)}%;">
                  <div style="font-weight: 800; font-size: 1rem; color: var(--text);">${esc(r.displayName)}</div>
                  <div style="font-size: 0.8rem; color: var(--primary);">${esc(r.cuisine)}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Distance</td>
              ${comparedPlaces.map(r => {
                const km = (r.distanceMeters / 1000).toFixed(1);
                const isApprox = r.durationSeconds === null || r.isStraightLine;
                return `<td style="padding: 10px;">${km} km ${isApprox ? '<small style="color: var(--text-muted);">(approx. straight-line)</small>' : ''}</td>`;
              }).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Travel Time</td>
              ${comparedPlaces.map(r => {
                if (r.durationSeconds !== null && r.durationSeconds !== undefined) {
                  return `<td style="padding: 10px;">🚗 ${Math.max(1, Math.round(r.durationSeconds / 60))} min</td>`;
                }
                return `<td style="padding: 10px; color: var(--text-muted);">Not available</td>`;
              }).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Operating Status</td>
              ${comparedPlaces.map(r => `<td style="padding: 10px;">${this.getOpeningStatusBadge(r.openStatus)}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Price Range</td>
              ${comparedPlaces.map(r => `<td style="padding: 10px; font-weight: 700;">${r.priceLevel ? '৳'.repeat(r.priceLevel) : 'Not available'}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Cost Per Person</td>
              ${comparedPlaces.map(r => {
                const cost = r.estimatedCostPerPersonBdt;
                if (!cost) return `<td style="padding: 10px; color: var(--text-muted);">Not available</td>`;
                const withinBudget = cost <= maxBudget;
                return `
                  <td style="padding: 10px;">
                    <span style="font-weight: 800; color: ${withinBudget ? 'var(--primary)' : 'var(--danger)'};">~৳${cost}</span>
                    ${!withinBudget ? '<span style="font-size: 0.75rem; color: var(--danger); display: block;">Over budget</span>' : ''}
                    <small style="font-size: 0.75rem; color: var(--text-muted); display: block;">${esc(r.costDerivation || '')}</small>
                  </td>
                `;
              }).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Cuisines</td>
              ${comparedPlaces.map(r => `<td style="padding: 10px;">${esc(r.cuisine || 'Not available')}</td>`).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Dietary Info</td>
              ${comparedPlaces.map(r => `
                <td style="padding: 10px; font-size: 0.85rem;">
                  ${r.halal ? '🕌 Halal ' : ''}
                  ${r.vegetarian ? '🥗 Veg ' : ''}
                  ${r.no_beef ? '🥩 No Beef' : ''}
                  ${(!r.halal && !r.vegetarian && !r.no_beef) ? '<span style="color: var(--text-muted);">Unverified</span>' : ''}
                </td>
              `).join('')}
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 10px; font-weight: 700; color: var(--text-muted);">Menu Source</td>
              ${comparedPlaces.map(r => {
                if (r.menu?.sourceUrl) {
                  return `
                    <td style="padding: 10px; font-size: 0.8rem;">
                      <a href="${safeUrl(r.menu.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">
                        ${esc(r.menu.sourceName || 'Source Link')}
                      </a>
                      <small style="display: block; color: var(--text-muted);">Checked: ${esc(r.menu.lastChecked || 'Recent')}</small>
                    </td>
                  `;
                }
                return `<td style="padding: 10px; color: var(--text-muted); font-size: 0.8rem;">Unverified source</td>`;
              }).join('')}
            </tr>
            <tr>
              <td style="padding: 10px;"></td>
              ${comparedPlaces.map(r => {
                const dirUrl = mapController.getGoogleMapsDirectionsUrl(userLocation, r);
                return `
                  <td style="padding: 10px;">
                    <a href="${esc(dirUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-block;">
                      🧭 Directions
                    </a>
                  </td>
                `;
              }).join('')}
            </tr>
          </tbody>
        </table>
      `;
    };

    if (budgetSlider && budgetValue) {
      budgetSlider.oninput = (e) => {
        maxBudget = parseInt(e.target.value, 10);
        budgetValue.textContent = `≤ ${maxBudget} BDT`;
        renderTable();
      };
    }

    renderSelectors();
    renderTable();

    this.sideBySideModal.classList.add('open');
    if (closeBtn) closeBtn.onclick = () => this.sideBySideModal.classList.remove('open');
    this.sideBySideModal.onclick = (e) => {
      if (e.target === this.sideBySideModal) this.sideBySideModal.classList.remove('open');
    };
  }

  openProfileModal(onSave) {
    if (!this.profileModal) return;
    const closeBtn = document.getElementById('closeProfileModalBtn');
    const cuisinesContainer = document.getElementById('profileCuisinesList');
    const budgetMinInput = document.getElementById('profileBudgetMin');
    const budgetMaxInput = document.getElementById('profileBudgetMax');
    const dietHalal = document.getElementById('profileDietHalal');
    const dietVeg = document.getElementById('profileDietVeg');
    const dietVegan = document.getElementById('profileDietVegan');
    const dietNoBeef = document.getElementById('profileDietNoBeef');
    const dislikedContainer = document.getElementById('dislikedTagsContainer');
    const addDislikedInput = document.getElementById('addDislikedInput');
    const addDislikedBtn = document.getElementById('addDislikedBtn');
    const resetBtn = document.getElementById('resetProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');

    let currentProfile = appStorage.getFoodProfile();
    let preferredCuisines = [...(currentProfile.preferredCuisines || [])];
    let dislikedFoods = [...(currentProfile.dislikedFoods || [])];

    const ALL_CUISINES = [
      'Japanese', 'Bangladeshi', 'Indian', 'Chinese', 'Korean',
      'Fast Food', 'Cafe', 'Kabab', 'Biriyani', 'Dessert', 'Coffee', 'Burger'
    ];

    const renderCuisines = () => {
      if (!cuisinesContainer) return;
      cuisinesContainer.innerHTML = ALL_CUISINES.map(c => {
        const isSelected = preferredCuisines.includes(c);
        return `
          <button type="button" class="chip cuisine-pref-chip ${isSelected ? 'active' : ''}" data-cuisine="${c}" style="cursor: pointer;">
            ${c} ${isSelected ? '✓' : ''}
          </button>
        `;
      }).join('');

      cuisinesContainer.querySelectorAll('.cuisine-pref-chip').forEach(btn => {
        btn.onclick = () => {
          const c = btn.dataset.cuisine;
          if (preferredCuisines.includes(c)) {
            preferredCuisines = preferredCuisines.filter(x => x !== c);
          } else {
            preferredCuisines.push(c);
          }
          renderCuisines();
        };
      });
    };

    const renderDisliked = () => {
      if (!dislikedContainer) return;
      if (dislikedFoods.length === 0) {
        dislikedContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">None specified</span>';
        return;
      }
      dislikedContainer.innerHTML = dislikedFoods.map((item, idx) => `
        <span class="chip" style="background: var(--surface-alt); border: 1px solid var(--border); padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
          ${esc(item)}
          <button type="button" class="remove-disliked-btn" data-idx="${idx}" style="background: none; border: none; cursor: pointer; color: var(--danger); font-weight: 800;">✕</button>
        </span>
      `).join('');

      dislikedContainer.querySelectorAll('.remove-disliked-btn').forEach(b => {
        b.onclick = () => {
          const idx = parseInt(b.dataset.idx, 10);
          dislikedFoods.splice(idx, 1);
          renderDisliked();
        };
      });
    };

    const syncForm = (prof) => {
      preferredCuisines = [...(prof.preferredCuisines || [])];
      dislikedFoods = [...(prof.dislikedFoods || [])];
      if (budgetMinInput) budgetMinInput.value = prof.budgetMin || 200;
      if (budgetMaxInput) budgetMaxInput.value = prof.budgetMax || 1200;
      if (dietHalal) dietHalal.checked = Boolean(prof.dietary?.halal);
      if (dietVeg) dietVeg.checked = Boolean(prof.dietary?.vegetarian);
      if (dietVegan) dietVegan.checked = Boolean(prof.dietary?.vegan);
      if (dietNoBeef) dietNoBeef.checked = Boolean(prof.dietary?.no_beef);
      renderCuisines();
      renderDisliked();
    };

    syncForm(currentProfile);

    if (addDislikedBtn && addDislikedInput) {
      addDislikedBtn.onclick = () => {
        const val = addDislikedInput.value.trim();
        if (val && !dislikedFoods.includes(val)) {
          dislikedFoods.push(val);
          addDislikedInput.value = '';
          renderDisliked();
        }
      };
      addDislikedInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addDislikedBtn.click();
        }
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        const confirmed = confirm('Are you sure you want to reset your food profile to default settings?');
        if (confirmed) {
          const def = appStorage.resetFoodProfile();
          syncForm(def);
        }
      };
    }

    if (saveBtn) {
      saveBtn.onclick = () => {
        const updated = {
          preferredCuisines,
          budgetMin: parseInt(budgetMinInput?.value || '200', 10),
          budgetMax: parseInt(budgetMaxInput?.value || '1200', 10),
          dietary: {
            halal: Boolean(dietHalal?.checked),
            vegetarian: Boolean(dietVeg?.checked),
            vegan: Boolean(dietVegan?.checked),
            no_beef: Boolean(dietNoBeef?.checked)
          },
          dislikedFoods
        };
        appStorage.saveFoodProfile(updated);
        this.profileModal.classList.remove('open');
        if (onSave) onSave(updated);
      };
    }

    this.profileModal.classList.add('open');
    if (closeBtn) closeBtn.onclick = () => this.profileModal.classList.remove('open');
    this.profileModal.onclick = (e) => {
      if (e.target === this.profileModal) this.profileModal.classList.remove('open');
    };
  }

  initDidYouGoPrompt() {
    const pending = appStorage.getItem('pending_visit_place');
    if (!pending) return;

    // Show prompt once if visited in last 24h
    const now = Date.now();
    if (now - pending.timestamp < 24 * 60 * 60 * 1000) {
      const banner = document.createElement('div');
      banner.className = 'visit-prompt-banner';
      banner.innerHTML = `
        <div class="visit-prompt-text">
          <span>🍽️ Did you visit <strong>${esc(pending.name)}</strong>? Rate your experience:</span>
        </div>
        <div class="visit-rating-stars">
          ${[1, 2, 3, 4, 5].map(star => `
            <button class="star-btn" data-star="${star}">${star}★</button>
          `).join('')}
          <button class="star-dismiss-btn">✕</button>
        </div>
      `;

      document.body.appendChild(banner);

      banner.querySelectorAll('.star-btn').forEach(b => {
        b.onclick = () => {
          const rating = parseInt(b.dataset.star, 10);
          if (rating >= 4) {
            recordTasteSignal('rated_high', pending);
          } else if (rating <= 2) {
            recordTasteSignal('rated_low', pending);
          }
          banner.remove();
          appStorage.removeItem('pending_visit_place');
        };
      });

      const dismiss = banner.querySelector('.star-dismiss-btn');
      if (dismiss) {
        dismiss.onclick = () => {
          banner.remove();
          appStorage.removeItem('pending_visit_place');
        };
      }
    }
  }
}

export const ui = new UIController();
export default ui;
