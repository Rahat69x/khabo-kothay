/**
 * Khabo Kothay? - Group Food Planner (Feature F)
 * Resolves multi-person dining dilemmas, balances individual budgets,
 * enforces collective dietary safety, and highlights preference conflicts.
 */

import { esc } from './escape.js';
import { appStorage } from './storage.js';
import { state } from './state.js';
import { t } from './i18n.js';
import { mapController } from './map.js';

class GroupFoodPlanner {
  constructor() {
    this.modal = null;
    this.members = this.loadMembers();
  }

  loadMembers() {
    const saved = appStorage.getItem('khabo_group_members');
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return [
      { id: 'm1', name: 'Member 1', budget: 500, dietary: ['halal'], preferredCuisines: ['Biriyani', 'Kabab'] },
      { id: 'm2', name: 'Member 2', budget: 800, dietary: ['vegetarian'], preferredCuisines: ['Cafe', 'Indian'] }
    ];
  }

  saveMembers() {
    appStorage.setItem('khabo_group_members', this.members);
  }

  init() {
    this.modal = document.getElementById('groupPlannerModal');
    const openBtn = document.getElementById('openGroupPlannerBtn');
    const closeBtn = document.getElementById('closeGroupPlannerModalBtn');

    openBtn?.addEventListener('click', () => {
      this.render();
      this.modal?.classList.add('open');
    });

    closeBtn?.addEventListener('click', () => {
      this.modal?.classList.remove('open');
    });

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.modal.classList.remove('open');
    });
  }

  addMember() {
    const nextIdx = this.members.length + 1;
    this.members.push({
      id: 'm_' + Date.now(),
      name: `Member ${nextIdx}`,
      budget: 600,
      dietary: [],
      preferredCuisines: []
    });
    this.saveMembers();
    this.render();
  }

  removeMember(id) {
    if (this.members.length <= 1) {
      alert('A group must have at least one member.');
      return;
    }
    this.members = this.members.filter(m => m.id !== id);
    this.saveMembers();
    this.render();
  }

  updateMember(id, fields) {
    const m = this.members.find(mem => mem.id === id);
    if (!m) return;
    Object.assign(m, fields);
    this.saveMembers();
  }

  computeConsensus() {
    const budgets = this.members.map(m => Number(m.budget) || 400);
    const minBudget = Math.min(...budgets);
    const avgBudget = Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length);

    // Required dietary restrictions
    const requiredDietary = new Set();
    this.members.forEach(m => {
      (m.dietary || []).forEach(d => requiredDietary.add(d));
    });

    // Preferred cuisines
    const cuisineCounts = {};
    this.members.forEach(m => {
      (m.preferredCuisines || []).forEach(c => {
        cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
      });
    });

    return {
      minBudget,
      avgBudget,
      requiredDietary: Array.from(requiredDietary),
      cuisineCounts
    };
  }

  findMatches() {
    const consensus = this.computeConsensus();
    const candidatePlaces = state.rawResults.length > 0 ? state.rawResults : [];

    const matches = [];
    const conflicts = [];

    candidatePlaces.forEach(r => {
      const placeCost = r.estimatedCostPerPersonBdt || (r.priceLevel ? r.priceLevel * 300 : 500);
      const isBudgetFit = placeCost <= consensus.minBudget;
      const isAvgBudgetFit = placeCost <= consensus.avgBudget;

      // Dietary checks
      const unmetDietary = [];
      consensus.requiredDietary.forEach(diet => {
        if (diet === 'halal' && r.halal === false) unmetDietary.push('Halal');
        if (diet === 'vegetarian' && !r.vegetarian) unmetDietary.push('Vegetarian');
        if (diet === 'vegan' && !r.vegan) unmetDietary.push('Vegan');
        if (diet === 'no_beef' && !r.no_beef) unmetDietary.push('No Beef');
      });

      if (isBudgetFit && unmetDietary.length === 0) {
        matches.push({
          restaurant: r,
          status: 'PERFECT_CONSENSUS',
          score: 100,
          cost: placeCost,
          reason: `Fits all members within lowest budget ৳${consensus.minBudget} and satisfies all dietary needs.`
        });
      } else if (isAvgBudgetFit && unmetDietary.length === 0) {
        matches.push({
          restaurant: r,
          status: 'COMPROMISE_AVERAGE_BUDGET',
          score: 80,
          cost: placeCost,
          reason: `Satisfies all diets. Price ৳${placeCost} exceeds minimum budget ৳${consensus.minBudget} but fits group average ৳${consensus.avgBudget}.`
        });
      } else {
        const issues = [];
        if (!isBudgetFit) issues.push(`Cost ৳${placeCost} exceeds ৳${consensus.minBudget}`);
        if (unmetDietary.length > 0) issues.push(`Missing: ${unmetDietary.join(', ')}`);
        conflicts.push({
          restaurant: r,
          cost: placeCost,
          issues
        });
      }
    });

    return { consensus, matches, conflicts };
  }

  render() {
    const container = document.getElementById('groupPlannerBody');
    if (!container) return;

    const consensus = this.computeConsensus();
    const analysis = this.findMatches();

    container.innerHTML = `
      <div class="group-planner-layout" style="display: flex; flex-direction: column; gap: 18px;">
        <div class="group-intro-box" style="background: var(--surface-alt); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">
          <p style="font-size: 0.9rem; color: var(--text);">
            ${t('groupPlannerDesc')}
          </p>
          <div style="display: flex; gap: 16px; margin-top: 10px; flex-wrap: wrap;">
            <div style="background: var(--surface); padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Lowest Member Budget (Safe):</span>
              <strong style="font-size: 1.1rem; color: var(--primary);">৳${consensus.minBudget}</strong>
            </div>
            <div style="background: var(--surface); padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Group Average Budget:</span>
              <strong style="font-size: 1.1rem; color: var(--text);">৳${consensus.avgBudget}</strong>
            </div>
            <div style="background: var(--surface); padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Shared Dietary Constraints:</span>
              <strong style="font-size: 0.9rem; color: var(--text);">${consensus.requiredDietary.length > 0 ? consensus.requiredDietary.join(', ') : 'None'}</strong>
            </div>
          </div>
        </div>

        <div class="group-members-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 1.05rem;">Group Members (${this.members.length})</h4>
            <button type="button" id="addMemberBtn" class="btn btn-secondary btn-sm">${t('groupAddMember')}</button>
          </div>

          <div class="members-cards-grid" style="display: flex; flex-direction: column; gap: 10px;">
            ${this.members.map((m, idx) => `
              <div class="member-card" data-id="${m.id}" style="background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <input type="text" class="form-input member-name-input" value="${esc(m.name)}" style="font-weight: 700; width: 140px; padding: 6px 8px;" />
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <label style="font-size: 0.85rem; color: var(--text-muted);">Max ৳:</label>
                    <input type="number" class="form-input member-budget-input" value="${m.budget}" min="100" max="5000" step="50" style="width: 90px; padding: 6px 8px;" />
                  </div>
                  <button type="button" class="btn btn-ghost btn-sm remove-member-btn" title="Remove member" style="color: var(--danger);">✕</button>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.8rem;">
                  <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                    <input type="checkbox" class="diet-cb" data-diet="halal" ${m.dietary?.includes('halal') ? 'checked' : ''} /> <span>Halal</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                    <input type="checkbox" class="diet-cb" data-diet="vegetarian" ${m.dietary?.includes('vegetarian') ? 'checked' : ''} /> <span>Vegetarian</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                    <input type="checkbox" class="diet-cb" data-diet="vegan" ${m.dietary?.includes('vegan') ? 'checked' : ''} /> <span>Vegan</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                    <input type="checkbox" class="diet-cb" data-diet="no_beef" ${m.dietary?.includes('no_beef') ? 'checked' : ''} /> <span>No Beef</span>
                  </label>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="group-results-section" style="border-top: 1px solid var(--border); padding-top: 14px;">
          <h4 style="margin-bottom: 8px;">Consensus Matches (${analysis.matches.length})</h4>
          ${analysis.matches.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${analysis.matches.slice(0, 5).map(m => `
                <div class="match-item-card" style="padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 1rem;">${esc(m.restaurant.displayName)}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                      ${esc(m.restaurant.cuisine)} • ⭐ ${m.restaurant.rating} • ~৳${m.cost}/person
                    </div>
                    <p style="font-size: 0.8rem; color: var(--primary); margin-top: 4px;">✅ ${esc(m.reason)}</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm view-on-map-btn" data-id="${m.restaurant.id}">Map</button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding: 16px; background: var(--surface-alt); border-radius: 10px; text-align: center;">
              <p style="font-weight: 700; color: var(--warning);">⚠️ No place satisfies all constraints simultaneously</p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Some members have conflicting dietary or budget limits. Try increasing the lowest budget.</p>
            </div>
          `}

          ${analysis.conflicts.length > 0 ? `
            <div style="margin-top: 14px;">
              <details style="font-size: 0.85rem; color: var(--text-muted);">
                <summary style="cursor: pointer; font-weight: 700; color: var(--text-muted);">View ${analysis.conflicts.length} conflicted places with clashing constraints</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
                  ${analysis.conflicts.slice(0, 4).map(c => `
                    <div style="padding: 8px 12px; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border);">
                      <strong>${esc(c.restaurant.displayName)}:</strong> ${c.issues.join(' | ')}
                    </div>
                  `).join('')}
                </div>
              </details>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Attach Handlers
    container.querySelector('#addMemberBtn')?.addEventListener('click', () => {
      this.addMember();
    });

    container.querySelectorAll('.member-card').forEach(card => {
      const id = card.dataset.id;

      card.querySelector('.member-name-input')?.addEventListener('change', (e) => {
        this.updateMember(id, { name: e.target.value.trim() });
      });

      card.querySelector('.member-budget-input')?.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10) || 400;
        this.updateMember(id, { budget: val });
        this.render();
      });

      card.querySelectorAll('.diet-cb').forEach(cb => {
        cb.addEventListener('change', () => {
          const diets = Array.from(card.querySelectorAll('.diet-cb:checked')).map(c => c.dataset.diet);
          this.updateMember(id, { dietary: diets });
          this.render();
        });
      });

      card.querySelector('.remove-member-btn')?.addEventListener('click', () => {
        this.removeMember(id);
      });
    });

    container.querySelectorAll('.view-on-map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const target = state.rawResults.find(r => r.id === id);
        if (target) {
          this.modal?.classList.remove('open');
          mapController.highlightRestaurant(state.currentLocation, target);
          const card = document.getElementById(`card-${id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('flash-highlight');
            setTimeout(() => card.classList.remove('flash-highlight'), 1200);
          }
        }
      });
    });
  }
}

export const groupFoodPlanner = new GroupFoodPlanner();
export default groupFoodPlanner;
