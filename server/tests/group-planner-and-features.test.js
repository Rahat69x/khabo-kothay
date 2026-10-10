import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../../public/js/i18n.js';

describe('Group Food Planner & Meal Cost Estimator Feature Intelligence', () => {
  describe('Group Food Planner Consensus Logic', () => {
    function computeGroupConsensus(members) {
      const budgets = members.map(m => Number(m.budget) || 400);
      const minBudget = Math.min(...budgets);
      const avgBudget = Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length);
      const requiredDietary = new Set();
      members.forEach(m => (m.dietary || []).forEach(d => requiredDietary.add(d)));
      return { minBudget, avgBudget, requiredDietary: Array.from(requiredDietary) };
    }

    function evaluateCandidate(restaurant, consensus) {
      const cost = restaurant.estimatedCostPerPersonBdt || 500;
      const isBudgetFit = cost <= consensus.minBudget;
      const isAvgBudgetFit = cost <= consensus.avgBudget;

      const unmetDietary = [];
      consensus.requiredDietary.forEach(diet => {
        if (diet === 'halal' && restaurant.halal === false) unmetDietary.push('Halal');
        if (diet === 'vegetarian' && !restaurant.vegetarian) unmetDietary.push('Vegetarian');
        if (diet === 'no_beef' && !restaurant.no_beef) unmetDietary.push('No Beef');
      });

      if (isBudgetFit && unmetDietary.length === 0) {
        return { status: 'PERFECT_CONSENSUS', satisfiesAll: true };
      } else if (isAvgBudgetFit && unmetDietary.length === 0) {
        return { status: 'COMPROMISE_AVERAGE_BUDGET', satisfiesAll: true };
      }
      return { status: 'CONFLICT', satisfiesAll: false, unmetDietary, costDiff: cost - consensus.minBudget };
    }

    it('Calculates lowest safe member budget and dietary union correctly', () => {
      const members = [
        { id: '1', name: 'Tanvir', budget: 450, dietary: ['halal'] },
        { id: '2', name: 'Nabila', budget: 900, dietary: ['vegetarian', 'no_beef'] },
        { id: '3', name: 'Farhan', budget: 600, dietary: ['halal'] }
      ];

      const consensus = computeGroupConsensus(members);
      expect(consensus.minBudget).toBe(450);
      expect(consensus.avgBudget).toBe(650);
      expect(consensus.requiredDietary).toContain('halal');
      expect(consensus.requiredDietary).toContain('vegetarian');
      expect(consensus.requiredDietary).toContain('no_beef');
    });

    it('Correctly classifies perfect consensus and surfaces constraint conflicts', () => {
      const consensus = { minBudget: 500, avgBudget: 750, requiredDietary: ['vegetarian'] };

      const vegBudgetPlace = { id: 'p1', estimatedCostPerPersonBdt: 400, vegetarian: true, halal: true, no_beef: true };
      const vegExpensivePlace = { id: 'p2', estimatedCostPerPersonBdt: 650, vegetarian: true, halal: true, no_beef: true };
      const meatOnlyPlace = { id: 'p3', estimatedCostPerPersonBdt: 350, vegetarian: false, halal: true, no_beef: true };

      const r1 = evaluateCandidate(vegBudgetPlace, consensus);
      expect(r1.status).toBe('PERFECT_CONSENSUS');
      expect(r1.satisfiesAll).toBe(true);

      const r2 = evaluateCandidate(vegExpensivePlace, consensus);
      expect(r2.status).toBe('COMPROMISE_AVERAGE_BUDGET');
      expect(r2.satisfiesAll).toBe(true);

      const r3 = evaluateCandidate(meatOnlyPlace, consensus);
      expect(r3.status).toBe('CONFLICT');
      expect(r3.satisfiesAll).toBe(false);
      expect(r3.unmetDietary).toContain('Vegetarian');
    });
  });

  describe('Meal Cost Estimator Calculation Logic', () => {
    function estimateMealCost({ headcount, basePricePerPerson, includeVat, includeServiceCharge }) {
      const baseSubtotal = headcount * basePricePerPerson;
      const vatAmount = includeVat ? Math.round(baseSubtotal * 0.15) : 0;
      const serviceAmount = includeServiceCharge ? Math.round(baseSubtotal * 0.10) : 0;
      const grandTotal = baseSubtotal + vatAmount + serviceAmount;
      const splitPerPerson = Math.round(grandTotal / headcount);

      return { baseSubtotal, vatAmount, serviceAmount, grandTotal, splitPerPerson };
    }

    it('Accurately computes food bill with 15% VAT and 10% service charge for 4 diners', () => {
      const result = estimateMealCost({
        headcount: 4,
        basePricePerPerson: 500,
        includeVat: true,
        includeServiceCharge: true
      });

      expect(result.baseSubtotal).toBe(2000);
      expect(result.vatAmount).toBe(300); // 15% of 2000
      expect(result.serviceAmount).toBe(200); // 10% of 2000
      expect(result.grandTotal).toBe(2500);
      expect(result.splitPerPerson).toBe(625);
    });

    it('Supports single diner without VAT or service charges', () => {
      const result = estimateMealCost({
        headcount: 1,
        basePricePerPerson: 280,
        includeVat: false,
        includeServiceCharge: false
      });

      expect(result.baseSubtotal).toBe(280);
      expect(result.grandTotal).toBe(280);
      expect(result.splitPerPerson).toBe(280);
    });
  });

  describe('Bilingual Translation Dictionary Parity', () => {
    it('Ensures English and Bengali translation keys match 100%', () => {
      const enKeys = Object.keys(TRANSLATIONS.en).sort();
      const bnKeys = Object.keys(TRANSLATIONS.bn).sort();

      expect(enKeys).toEqual(bnKeys);
      expect(enKeys.length).toBeGreaterThan(40);
    });
  });
});
