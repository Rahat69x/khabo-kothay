/**
 * Khabo Kothay? - Meal Cost Estimator (Feature G)
 * Itemized food cost estimation for 1-10 diners with verified menu prices,
 * optional 15% Bangladesh VAT, and optional 10% dining service charge.
 * Real menu item selection, verified BDT pricing, and traceable source links.
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
    this.selectedItemNames = new Set();
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
    this.selectedItemNames = new Set();

    if (restaurant) {
      const menuItems = restaurant.menu?.items || [];
      if (menuItems.length > 0) {
        // By default select the first item (primary dish)
        this.selectedItemNames.add(menuItems[0].name);
        if (menuItems.length > 1 && (menuItems[1].name.toLowerCase().includes('drink') || menuItems[1].name.toLowerCase().includes('borhani') || menuItems[1].name.toLowerCase().includes('pepsi') || menuItems[1].name.toLowerCase().includes('naan'))) {
          this.selectedItemNames.add(menuItems[1].name);
        }
        this.updateBasePriceFromSelectedItems();
      } else {
        this.basePricePerPerson = restaurant.estimatedCostPerPersonBdt || (restaurant.priceLevel ? restaurant.priceLevel * 350 : 450);
      }
    } else {
      this.basePricePerPerson = 450;
    }

    this.render();
    this.modal?.classList.add('open');
  }

  updateBasePriceFromSelectedItems() {
    const menuItems = this.activeRestaurant?.menu?.items || [];
    if (this.selectedItemNames.size > 0 && menuItems.length > 0) {
      let sum = 0;
      for (const item of menuItems) {
        if (this.selectedItemNames.has(item.name)) {
          const p = item.priceBdt ?? item.price;
          if (typeof p === 'number' && !isNaN(p)) {
            sum += p;
          }
        }
      }
      if (sum > 0) {
        this.basePricePerPerson = sum;
        return;
      }
    }

    if (this.activeRestaurant) {
      this.basePricePerPerson = this.activeRestaurant.estimatedCostPerPersonBdt || (this.activeRestaurant.priceLevel ? this.activeRestaurant.priceLevel * 350 : 450);
    }
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
    const menu = this.activeRestaurant?.menu || null;
    const menuItems = menu?.items || [];

    const sourceUrl = menu?.sourceUrl || this.activeRestaurant?.menuSourceUrl || this.activeRestaurant?.websiteUri || null;
    const sourceName = menu?.sourceName || this.activeRestaurant?.menuSource || 'Official Listing';
    const lastChecked = menu?.lastChecked || this.activeRestaurant?.menuLastUpdated || 'October 2026';

    const itemsSelectionHtml = menuItems.length > 0 ? `
      <div class="estimator-items-selection" style="background: var(--surface); padding: 12px; border-radius: 12px; border: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="font-weight: 700; font-size: 0.9rem; color: var(--text);">📋 Select Menu Items (per diner):</label>
          <span style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">${this.selectedItemNames.size} of ${menuItems.length} selected</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
          ${menuItems.map((item, idx) => {
            const isChecked = this.selectedItemNames.has(item.name);
            const rawPrice = item.priceBdt ?? item.price;
            const isItemVerified = item.verified !== false && item.status !== 'Unverified';
            return `
              <label class="menu-item-check-row" style="display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; background: ${isChecked ? 'var(--surface-alt)' : 'var(--background)'}; border: 1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" class="estimator-item-cb" data-name="${esc(item.name)}" ${isChecked ? 'checked' : ''} style="width: 17px; height: 17px; accent-color: var(--primary); cursor: pointer;" />
                  <div>
                    <span style="font-size: 0.88rem; font-weight: 600;">${esc(item.name)}</span>
                    <span class="status-chip ${isItemVerified ? 'status-open' : 'status-closing'}" style="font-size: 0.65rem; padding: 1px 5px; margin-left: 4px;">${isItemVerified ? 'Verified' : 'Estimated'}</span>
                  </div>
                </div>
                <strong style="font-size: 0.92rem; color: var(--primary);">৳${esc(rawPrice)}</strong>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    const sourceInfoHtml = sourceUrl ? `
      <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border);">
        <span>Source: <strong>${esc(sourceName)}</strong> (Checked: ${esc(lastChecked)})</span>
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); font-weight: 700; text-decoration: underline;">View Source ↗</a>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="meal-estimator-layout" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: var(--surface-alt); padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 1.05rem; color: var(--text);">${esc(restName)}</strong>
            <span class="status-chip ${calc.isVerified ? 'status-open' : 'status-closing'}" style="font-size: 0.75rem;">
              ${calc.isVerified ? '✅ Verified Dhaka Menu' : 'ℹ️ Average Portion Estimate'}
            </span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
            ${t('costEstimatorDesc')}
          </p>
        </div>

        ${itemsSelectionHtml}

        <!-- Headcount Selector (1 to 10 people) -->
        <div class="estimator-control-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-weight: 700; font-size: 0.92rem;">${t('costHeadcount')}:</label>
            <span id="headcountDisplay" style="font-weight: 800; font-size: 1.15rem; color: var(--primary);">${this.headcount} ${this.headcount === 1 ? 'person' : 'people'}</span>
          </div>
          <input type="range" id="headcountSlider" min="1" max="10" step="1" value="${this.headcount}" style="width: 100%; accent-color: var(--primary);" />
          <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
            <span>1 person</span>
            <span>5 people</span>
            <span>10 people</span>
          </div>
        </div>

        <!-- Base Cost Per Person -->
        <div class="estimator-control-group">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <label style="font-weight: 700; font-size: 0.92rem;">${t('costCostPerPerson')}:</label>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              ${this.selectedItemNames.size > 0 ? `(Sum of ${this.selectedItemNames.size} selected dishes)` : '(Estimated portion per diner)'}
            </span>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="position: relative; display: inline-flex; align-items: center;">
              <span style="position: absolute; left: 10px; font-weight: 700; color: var(--text-muted);">৳</span>
              <input type="number" id="basePriceInput" class="form-input" value="${this.basePricePerPerson}" min="50" max="15000" step="50" style="padding-left: 26px; width: 140px; font-weight: 700;" />
            </div>
            <span style="font-size: 0.82rem; color: var(--text-muted);">BDT per diner</span>
          </div>
        </div>

        <!-- Tax & Surcharge Toggles -->
        <div class="estimator-toggles-box" style="display: flex; flex-direction: column; gap: 8px; background: var(--surface); padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border);">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem;">
            <input type="checkbox" id="vatToggle" ${this.includeVat ? 'checked' : ''} style="width: 17px; height: 17px; accent-color: var(--primary);" />
            <span>${t('costAddVat')}</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem;">
            <input type="checkbox" id="serviceChargeToggle" ${this.includeServiceCharge ? 'checked' : ''} style="width: 17px; height: 17px; accent-color: var(--primary);" />
            <span>${t('costAddServiceCharge')}</span>
          </label>
        </div>

        <!-- Calculation Receipt Breakdown -->
        <div class="estimator-receipt card-glass" style="padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-alt);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem;">
            <span>Food Subtotal (${this.headcount} diners × ৳${this.basePricePerPerson}):</span>
            <strong>৳${calc.baseSubtotal}</strong>
          </div>
          ${this.includeVat ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-muted);">
              <span>+ 15% Bangladesh VAT:</span>
              <span>৳${calc.vatAmount}</span>
            </div>
          ` : ''}
          ${this.includeServiceCharge ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; color: var(--text-muted);">
              <span>+ 10% Dining Service Charge:</span>
              <span>৳${calc.serviceAmount}</span>
            </div>
          ` : ''}
          <div style="border-top: 1px dashed var(--border); margin: 8px 0; padding-top: 8px; display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="font-size: 1.05rem;">${t('costEstimatedTotal')}:</strong>
            <strong style="font-size: 1.35rem; color: var(--primary);">৳${calc.grandTotal}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
            <span>${t('costPerPersonSplit')}:</span>
            <strong style="color: var(--text);">~৳${calc.splitPerPerson} / diner</strong>
          </div>
        </div>

        ${sourceInfoHtml}
      </div>
    `;

    // Event handlers
    const itemCheckboxes = container.querySelectorAll('.estimator-item-cb');
    itemCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const name = e.target.dataset.name;
        if (e.target.checked) {
          this.selectedItemNames.add(name);
        } else {
          this.selectedItemNames.delete(name);
        }
        this.updateBasePriceFromSelectedItems();
        this.render();
      });
    });

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
