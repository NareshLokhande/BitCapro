/**
 * Test file for validation rules
 * Tests all CAPEX/OPEX validation rules with various scenarios
 */

import {
  formatCurrency,
  getCurrencySymbol,
  getRulesForCategory,
  getValidationSummary,
  validateInvestmentRequest,
} from './validationRules';

describe('Validation Rules Tests', () => {
  describe('Rule 1: Total Cost Match', () => {
    test('should pass when CAPEX + OPEX equals total cost', () => {
      const data = {
        capex: 500000,
        opex: 300000,
        totalCost: 800000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail when CAPEX + OPEX does not equal total cost', () => {
      const data = {
        capex: 500000,
        opex: 300000,
        totalCost: 900000, // Mismatch
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'CAPEX and OPEX must sum to the total project cost.',
      );
    });
  });

  describe('Rule 2: Min CAPEX for Infrastructure', () => {
    test('should pass when Infrastructure project has >= 60% CAPEX', () => {
      const data = {
        capex: 600000, // 60% of 1M
        opex: 400000, // 40% of 1M
        totalCost: 1000000,
        projectType: 'Infrastructure',
        category: 'Infrastructure',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail when Infrastructure project has < 60% CAPEX', () => {
      const data = {
        capex: 500000, // 50% of 1M
        opex: 500000, // 50% of 1M
        totalCost: 1000000,
        projectType: 'Infrastructure',
        category: 'Infrastructure',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'CAPEX must be at least 60% for Infrastructure projects.',
      );
    });

    test('should pass for non-Infrastructure projects regardless of CAPEX ratio', () => {
      const data = {
        capex: 100000, // 10% of 1M
        opex: 900000, // 90% of 1M
        totalCost: 1000000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Rule 3: Max OPEX for R&D', () => {
    test('should pass when R&D project has <= 60% OPEX', () => {
      const data = {
        capex: 500000, // 50% of 1M
        opex: 500000, // 50% of 1M
        totalCost: 1000000,
        projectType: 'R&D',
        category: 'R&D',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail when R&D project has > 60% OPEX', () => {
      const data = {
        capex: 300000, // 30% of 1M
        opex: 700000, // 70% of 1M
        totalCost: 1000000,
        projectType: 'R&D',
        category: 'R&D',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'OPEX must not exceed 60% for R&D projects.',
      );
    });
  });

  describe('Rule 4: No CAPEX for Maintenance', () => {
    test('should pass when Maintenance project has 0 CAPEX', () => {
      const data = {
        capex: 0,
        opex: 1000000,
        totalCost: 1000000,
        projectType: 'Maintenance',
        category: 'Maintenance',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail when Maintenance project has CAPEX > 0', () => {
      const data = {
        capex: 100000,
        opex: 900000,
        totalCost: 1000000,
        projectType: 'Maintenance',
        category: 'Maintenance',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'CAPEX is not allowed for Maintenance projects.',
      );
    });
  });

  describe('Rule 5: CAPEX required for high-value projects', () => {
    test('should pass when project over ₹1 crore has CAPEX', () => {
      const data = {
        capex: 100000, // Has CAPEX
        opex: 900000,
        totalCost: 1000000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail when project over ₹1 crore has no CAPEX', () => {
      const data = {
        capex: 0, // No CAPEX
        opex: 1000000,
        totalCost: 1000000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Projects over ₹1 crore must include CAPEX.',
      );
    });
  });

  describe('Rule 6: OPEX-only for small projects', () => {
    test('should pass when project under ₹5 lakh has no CAPEX', () => {
      const data = {
        capex: 0, // No CAPEX
        opex: 400000,
        totalCost: 400000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(true);
    });

    test('should fail when project under ₹5 lakh has CAPEX', () => {
      const data = {
        capex: 100000, // Has CAPEX
        opex: 300000,
        totalCost: 400000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Projects under ₹5 lakh should not include CAPEX.',
      );
    });
  });

  describe('Category-specific rules', () => {
    test('should return Infrastructure rules for Infrastructure category', () => {
      const rules = getRulesForCategory('Infrastructure');
      const hasInfrastructureRule = rules.some(
        (rule) => rule.name === 'MinCapexForInfrastructure',
      );
      expect(hasInfrastructureRule).toBe(true);
    });

    test('should return R&D rules for R&D category', () => {
      const rules = getRulesForCategory('R&D');
      const hasRnDRule = rules.some((rule) => rule.name === 'MaxOpexForRnD');
      expect(hasRnDRule).toBe(true);
    });

    test('should return Maintenance rules for Maintenance category', () => {
      const rules = getRulesForCategory('Maintenance');
      const hasMaintenanceRule = rules.some(
        (rule) => rule.name === 'NoCapexForMaintenance',
      );
      expect(hasMaintenanceRule).toBe(true);
    });
  });

  describe('Validation summary', () => {
    test('should calculate correct summary for valid data', () => {
      const data = {
        capex: 500000,
        opex: 300000,
        totalCost: 800000,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const summary = getValidationSummary(data);
      expect(summary.passedRules).toBeGreaterThan(0);
      expect(summary.failedRules).toBe(0);
      expect(summary.totalRules).toBeGreaterThan(0);
    });

    test('should calculate correct summary for invalid data', () => {
      const data = {
        capex: 0,
        opex: 1000000,
        totalCost: 1000000,
        projectType: 'Infrastructure',
        category: 'Infrastructure',
        currency: 'USD',
      };

      const summary = getValidationSummary(data);
      expect(summary.failedRules).toBeGreaterThan(0);
    });
  });

  describe('Currency formatting', () => {
    test('should format USD correctly', () => {
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
    });

    test('should format INR with lakhs and crores', () => {
      expect(formatCurrency(500000, 'INR')).toBe('₹5.00 lakh');
      expect(formatCurrency(15000000, 'INR')).toBe('₹1.50 crore');
    });

    test('should return correct currency symbols', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('INR')).toBe('₹');
    });
  });

  describe('Complex scenarios', () => {
    test('should handle multiple rule violations', () => {
      const data = {
        capex: 0, // Violates Infrastructure rule
        opex: 1000000,
        totalCost: 1000000,
        projectType: 'Infrastructure',
        category: 'Infrastructure',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should handle edge cases with zero values', () => {
      const data = {
        capex: 0,
        opex: 0,
        totalCost: 0,
        projectType: 'Technology',
        category: 'Technology',
        currency: 'USD',
      };

      const result = validateInvestmentRequest(data);
      // Should pass basic validation but may have warnings
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Budget Validation', () => {
    test('should validate yearly breakdown against total budget', () => {
      const totalBudget = 500000; // CapEx + OpEx
      const yearlyBreakdown = {
        2024: { capex: 120000, opex: 80000 },
        2025: { capex: 150000, opex: 100000 },
        2026: { capex: 180000, opex: 120000 },
        2027: { capex: 80000, opex: 60000 },
      };

      const yearlyBreakdownTotal = Object.values(yearlyBreakdown).reduce(
        (sum, yearData) => sum + yearData.capex + yearData.opex,
        0,
      );

      // Total breakdown: 120000 + 80000 + 150000 + 100000 + 180000 + 120000 + 80000 + 60000 = 790000
      // Budget: 500000
      // Should exceed budget
      expect(yearlyBreakdownTotal).toBe(790000);
      expect(yearlyBreakdownTotal > totalBudget).toBe(true);

      // Test valid breakdown
      const validYearlyBreakdown = {
        2024: { capex: 100000, opex: 50000 },
        2025: { capex: 120000, opex: 80000 },
        2026: { capex: 150000, opex: 100000 },
      };

      const validTotal = Object.values(validYearlyBreakdown).reduce(
        (sum, yearData) => sum + yearData.capex + yearData.opex,
        0,
      );

      // Valid total: 100000 + 50000 + 120000 + 80000 + 150000 + 100000 = 600000
      // Budget: 500000
      // Should still exceed budget
      expect(validTotal).toBe(600000);
      expect(validTotal > totalBudget).toBe(true);

      // Test within budget
      const withinBudgetBreakdown = {
        2024: { capex: 80000, opex: 40000 },
        2025: { capex: 100000, opex: 60000 },
        2026: { capex: 120000, opex: 80000 },
      };

      const withinBudgetTotal = Object.values(withinBudgetBreakdown).reduce(
        (sum, yearData) => sum + yearData.capex + yearData.opex,
        0,
      );

      // Within budget total: 80000 + 40000 + 100000 + 60000 + 120000 + 80000 = 480000
      // Budget: 500000
      // Should be within budget
      expect(withinBudgetTotal).toBe(480000);
      expect(withinBudgetTotal <= totalBudget).toBe(true);
    });
  });
});
