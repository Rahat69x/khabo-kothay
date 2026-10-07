import { appStorage } from './storage.js';
import { recordTasteSignal, compareRoutes } from './api.js';
import { mapController } from './map.js';

export class UIController {
  constructor() {
    this.resultsContainer = document.getElementById('resultsContainer');
    this.topPicksContainer = document.getElementById('topPicksContainer');
    this.drawer = document.getElementById('explainDrawer');
    this.compareModal = document.getElementById('compareModal');
    this.favModal = document.getElementById('favoritesModal');
    this.historyModal = document.getElementById('historyModal');
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
        <p>${message || 'An unexpected error occurred while contacting the server.'}</p>
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
              <p class="top-picks-summary">${summary}</p>
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

  renderMiniPick(item, badgeText, badgeClass, onSelect) {
    const mins = Math.max(1, Math.round(item.durationSeconds / 60));
    const km = (item.distanceMeters / 1000).toFixed(1);
    return `
      <div class="mini-pick ${badgeClass}" data-id="${item.id}">
        <span class="mini-badge">${badgeText}</span>
        <h4 class="mini-name">${item.displayName}</h4>
        <div class="mini-meta">
          <span>${item.rating}★ (${item.userRatingCount})</span>
          <span>•</span>
          <span>${mins} min (${km} km)</span>
        </div>
        <p class="mini-reason">${item.reason}</p>
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
      const mins = Math.max(1, Math.round(r.durationSeconds / 60));
      const km = (r.distanceMeters / 1000).toFixed(1);
      const priceText = r.priceLevel ? '৳'.repeat(r.priceLevel) : 'Price unlisted';
      const trafficColor = r.trafficLevel === 'Low' ? 'traffic-green' : (r.trafficLevel === 'Moderate' ? 'traffic-yellow' : 'traffic-red');
      const photoUrl = r.photos && r.photos.length > 0
        ? `/api/places/photo?name=${encodeURIComponent(r.photos[0].name)}&maxWidth=600`
        : `/api/places/photo?name=mock_placeholder&maxWidth=600`;

      const directionsUrl = mapController.getGoogleMapsDirectionsUrl(userLocation, r);

      return `
        <article class="restaurant-card" id="card-${r.id}" data-id="${r.id}">
          <div class="card-media">
            <img src="${photoUrl}" alt="${r.displayName}" class="card-photo" loading="lazy" />
            <div class="card-badges">
              <span class="rank-badge">#${idx + 1}</span>
              ${r.badges.map(b => `<span class="factor-badge ${this.getBadgeClass(b)}">${b}</span>`).join('')}
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${r.id}" aria-label="Toggle favorite">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>

          <div class="card-body">
            <div class="card-header-row">
              <h3 class="card-title">${r.displayName}</h3>
              <div class="card-score-pill" title="Algorithmic match score (0-100)">
                ${r.score}<small>/100</small>
              </div>
            </div>

            <p class="card-address">${r.formattedAddress}</p>

            <div class="card-metrics-row">
              <span class="metric-item rating-metric">⭐ ${r.rating} <small>(${r.userRatingCount})</small></span>
              <span class="metric-item price-metric">${priceText}</span>
              <span class="metric-item time-metric">🕒 ${mins} min (${km} km)</span>
              <span class="traffic-chip ${trafficColor}">🚦 ${r.trafficLevel} Traffic</span>
            </div>

            <div class="card-transport-box">
              <span class="transport-label">Estimated Transit:</span>
              <span class="transport-cost">~৳${r.transport.cheapestEstimatedCostBdt} (${r.transport.cheapestFeasibleMode})</span>
              <span class="estimate-tag">estimated</span>
            </div>

            <div class="card-reason-box">
              <span class="reason-icon">💡</span>
              <p class="reason-text">${r.reason}</p>
            </div>

            <div class="card-actions">
              <button class="btn btn-outline btn-compare" data-id="${r.id}">
                🔄 Compare Routes
              </button>
              <button class="btn btn-outline btn-explain" data-id="${r.id}">
                📊 Why this pick?
              </button>
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-directions" data-id="${r.id}">
                🧭 Directions
              </a>
              <button class="btn btn-ghost btn-dismiss" data-id="${r.id}" title="Not interested (teaches your taste profile)">
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

      // Directions button (records directions signal)
      const directionsBtn = card.querySelector('.btn-directions');
      if (directionsBtn) {
        directionsBtn.addEventListener('click', () => {
          recordTasteSignal('directions', r);
          // Set reminder flag for "Did you go?"
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
          <h4>${restaurant.displayName}</h4>
          <span class="drawer-score">${restaurant.score}/100 Match Score</span>
        </div>
        <p class="drawer-summary">${restaurant.reason}</p>
        
        <div class="breakdown-list">
          ${this.renderBreakdownBar('Taste Affinity', b.taste, '#8B5CF6')}
          ${this.renderBreakdownBar('Travel Time', b.time, '#10B981')}
          ${this.renderBreakdownBar('Traffic Flow', b.traffic, '#3B82F6')}
          ${this.renderBreakdownBar('Customer Rating', b.rating, '#F59E0B')}
          ${this.renderBreakdownBar('Restaurant Price Level', b.price, '#EC4899')}
          ${this.renderBreakdownBar('Transport Transit Cost', b.cost, '#14B8A6')}
          ${this.renderBreakdownBar('Proximity Distance', b.distance, '#6366F1')}
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

  renderBreakdownBar(label, value = 50, color = '#3B82F6') {
    return `
      <div class="breakdown-item">
        <div class="breakdown-labels">
          <span>${label}</span>
          <span class="breakdown-pct">${value}%</span>
        </div>
        <div class="breakdown-track">
          <div class="breakdown-bar" style="width: ${value}%; background-color: ${color};"></div>
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
          <h3>Compare Routes & Transport to ${restaurant.displayName}</h3>
          <button class="close-modal-btn" onclick="document.getElementById('compareModal').classList.remove('open')">✕</button>
        </div>
        <div class="modal-body">
          <div class="loading-spinner">Calculating traffic-aware routes and Dhaka transport fares...</div>
        </div>
      </div>
    `;

    try {
      const data = await compareRoutes(userLocation, {
        lat: restaurant.location.latitude,
        lng: restaurant.location.longitude
      });

      const modalBody = this.compareModal.querySelector('.modal-body');
      modalBody.innerHTML = `
        <div class="route-reason-highlight">
          <strong>Recommended Path:</strong> ${data.recommendationReason}
        </div>

        <h4>Alternative Driving Routes</h4>
        <div class="routes-comparison-grid">
          ${data.routes.map((rt, idx) => `
            <div class="route-option-card ${idx === data.recommendedRouteIndex ? 'recommended' : ''}">
              <div class="route-option-badge">
                ${idx === data.recommendedRouteIndex ? '★ Recommended' : `Option ${idx + 1}`}
              </div>
              <h5>${rt.name}</h5>
              <div class="route-meta">
                <span>⏱️ ${Math.round(rt.durationSeconds / 60)} min</span>
                <span>🛣️ ${(rt.distanceMeters / 1000).toFixed(1)} km</span>
                <span class="traffic-tag ${rt.trafficLevel.toLowerCase()}">Traffic: ${rt.trafficLevel}</span>
              </div>
              <p class="route-summary">${rt.summary || 'Real-time computed road path'}</p>
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
                  <td><strong>${m.modeName}</strong></td>
                  <td class="cost-cell">৳${m.estimatedCostBdt} <small class="estimate-tag">estimated</small></td>
                  <td>${m.feasible ? '✅ Feasible' : '⚠️ Long distance'}</td>
                  <td class="calc-cell">${m.breakdown.calculation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      const modalBody = this.compareModal.querySelector('.modal-body');
      modalBody.innerHTML = `<div class="error-msg">Error calculating routes: ${e.message}</div>`;
    }
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
          <span>🍽️ Did you visit <strong>${pending.name}</strong>? Rate your experience:</span>
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
