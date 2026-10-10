/**
 * Khabo Kothay? - Meal Cost Estimator (Feature G)
 * Itemized food cost estimation for 1-10 diners with verified menu prices,
 * optional 15% Bangladesh VAT, and optional 10% dining service charge.
 */

import { esc } from './escape.js';
import { t } from './i18n.js';

class MealCostEstimator {
  constructor() {
    this.modal = null;
    this.headcount = 2;
    this.basePricePerPerson = 450;
    this.includeVat = true;
    this.includeServiceCharge = false;
    this.activeRestaurant = null;
  }

  init() {
    this.modal = document.getElementById('mealEstimatorModal');
    const openBtn = document.getElementById('openMealEstimatorBtn');
    const closeBtn = document.getElementById('closeMealEstimatorModalBtn');

    openBtn?.addEventListener('click', () => {
      this.openForRestaurant(null);
    });

    closeBtn?.addEventListener('click', () => {
      this.modal?.classList.remove('open');
    });

    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.modal.classList.remove('open');
    });
  }

  openForRestaurant(restaurant = null) {
    this.activeRestaurant = restaurant;
    if (restaurant) {
      this.basePricePerPerson = restaurant.estimatedCostPerPersonBdt || (restaurant.priceLevel ? restaurant.priceLevel * 350 : 450);
    }
    this.render();
    this.modal?.classList.add('open');
  }

  calculate() {
    const baseSubtotal = this.headcount * this.basePricePerPerson;
    const vatRate = this.includeVat ? 0.15 : 0.0;
    const serviceRate = this.includeServiceCharge ? 0.10 : 0.0;

    const vatAmount = Math.round(baseSubtotal * vatRate);
    const serviceAmount = Math.round(baseSubtotal * serviceRate);
    const grandTotal = baseSubtotal + vatAmount + serviceAmount;
    const splitPerPerson = Math.round(grandTotal / this.headcount);

    return {
      headcount: this.headcount,
      basePricePerPerson: this.basePricePerPerson,
      baseSubtotal,
      vatAmount,
      serviceAmount,
      grandTotal,
      splitPerPerson,
      isVerified: Boolean(this.activeRestaurant?.menu?.items?.length > 0)
    };
  }

  render() {
    const container = document.getElementById('mealEstimatorBody');
    if (!container) return;

    const calc = this.calculate();
    const restName = this.activeRestaurant ? this.activeRestaurant.displayName : 'Custom Dining Query';

    container.innerHTML = `
      <div class="meal-estimator-layout" style="display: flex; flex-direction: column; gap: 18px;">
        <div style="background: var(--surface-alt); padding: 14px; border-radius: 12px; border: 1px solid var(--border);">
          <strong style="font-size: 1.05rem; color: var(--text);">${esc(restName)}</strong>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
            ${t('costEstimatorDesc')}
          </p>
        </div>

        <!-- Headcount Selector (1 to 10 people) -->
        <div class="estimator-control-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-weight: 700; font-size: 0.95rem;">${t('costHeadcount')}:</label>
            <span id="headcountDisplay" style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${this.headcount} ${this.headcount === 1 ? 'person' : 'people'}</span>
          </div>
          <input type="range" id="headcountSlider" min="1" max="10" step="1" value="${this.headcount}" style="width: 100%; accent-color: var(--primary);" />
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
            <span>1 person</span>
            <span>5 people</span>
            <span>10 people</span>
          </div>
        </div>

        <!-- Base Cost Per Person -->
        <div class="estimator-control-group">
          <label style="font-weight: 700; font-size: 0.95rem; display: block; margin-bottom: 6px;">${t('costCostPerPerson')}:</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="basePriceInput" class="form-input" value="${this.basePricePerPerson}" min="50" max="10000" step="50" style="width: 140px; font-weight: 700;" />
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${calc.isVerified ? '✅ Verified Menu Data' : 'ℹ️ Estimated Average Portion'}
            </span>
          </div>
        </div>

        <!-- Tax & Surcharge Toggles -->
        <div class="estimator-toggles-box" style="display: flex; flex-direction: column; gap: 8px; background: var(--surface); padding: 12px; border-radius: 10px; border: 1px solid var(--border);">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" id="vatToggle" ${this.includeVat ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
            <span>${t('costAddVat')}</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
            <input type="checkbox" id="serviceChargeToggle" ${this.includeServiceCharge ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
            <span>${t('costAddServiceCharge')}</span>
          </label>
        </div>

        <!-- Calculation Receipt Breakdown -->
        <div class="estimator-receipt card-glass" style="padding: 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-alt);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem;">
            <span>Food Subtotal (${this.headcount} × ৳${this.basePricePerPerson}):</span>
            <strong>৳${calc.baseSubtotal}</strong>
          </div>
          ${this.includeVat ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-muted);">
              <span>+ 15% VAT:</span>
              <span>৳${calc.vatAmount}</span>
            </div>
          ` : ''}
          ${this.includeServiceCharge ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-muted);">
              <span>+ 10% Service Charge:</span>
              <span>৳${calc.serviceAmount}</span>
            </div>
          ` : ''}
          <div style="border-top: 1px dashed var(--border); margin: 8px 0; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="font-size: 1.1rem;">${t('costEstimatedTotal')}:</strong>
            <strong style="font-size: 1.4rem; color: var(--primary);">৳${calc.grandTotal}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
            <span>${t('costPerPersonSplit')}:</span>
            <strong style="color: var(--text);">~৳${calc.splitPerPerson} / diner</strong>
          </div>
        </div>
      </div>
    `;

    // Event handlers
    const slider = container.querySelector('#headcountSlider');
    slider?.addEventListener('input', (e) => {
      this.headcount = parseInt(e.target.value, 10) || 1;
      this.render();
    });

    const priceInput = container.querySelector('#basePriceInput');
    priceInput?.addEventListener('change', (e) => {
      this.basePricePerPerson = parseInt(e.target.value, 10) || 100;
      this.render();
    });

    const vatToggle = container.querySelector('#vatToggle');
    vatToggle?.addEventListener('change', (e) => {
      this.includeVat = e.target.checked;
      this.render();
    });

    const serviceToggle = container.querySelector('#serviceChargeToggle');
    serviceToggle?.addEventListener('change', (e) => {
      this.includeServiceCharge = e.target.checked;
      this.render();
    });
  }
}

export const mealCostEstimator = new MealCostEstimator();
export default mealCostEstimator;
