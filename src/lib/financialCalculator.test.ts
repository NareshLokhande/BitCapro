/**
 * Test file for financial calculator functions
 * Tests the example case: Initial Investment: $500,000, Cash Inflows: $75,000/year, Discount Rate: 10%
 */

import {
  calculateFinancialMetrics,
  calculateIRR,
  calculateNPV,
  calculatePaybackPeriod,
  estimateAnnualCashInflow,
  generateCashFlows,
  getDefaultDiscountRate,
} from './financialCalculator';

describe('Financial Calculator Tests', () => {
  describe('Example Case: $500,000 investment, $75,000/year inflows, 10% discount rate', () => {
    const initialInvestment = 500000;
    const annualCashInflow = 75000;
    const discountRate = 0.1;
    const projectDuration = 10; // 10 years

    test('should calculate NPV correctly', () => {
      const cashFlows = generateCashFlows({
        initialInvestment,
        discountRate,
        projectDuration,
        annualCashInflow,
      });

      const npv = calculateNPV(cashFlows, discountRate, initialInvestment);

      // Expected NPV calculation:
      // NPV = -500,000 + 75,000/(1.1)^1 + 75,000/(1.1)^2 + ... + 75,000/(1.1)^10
      // NPV = -500,000 + 75,000 * (1 - 1.1^-10) / 0.1
      // NPV = -500,000 + 75,000 * 6.1446
      // NPV = -500,000 + 460,845
      // NPV = -39,155 (approximately)

      expect(npv).toBeCloseTo(-39155, -2); // Within $100
    });

    test('should calculate IRR correctly', () => {
      const cashFlows = generateCashFlows({
        initialInvestment,
        discountRate,
        projectDuration,
        annualCashInflow,
      });

      const irr = calculateIRR(cashFlows, initialInvestment);

      // IRR should be around 8.14% for this case
      // (the rate that makes NPV = 0)
      expect(irr * 100).toBeCloseTo(8.14, 1);
    });

    test('should calculate payback period correctly', () => {
      const cashFlows = generateCashFlows({
        initialInvestment,
        discountRate,
        projectDuration,
        annualCashInflow,
      });

      const paybackPeriod = calculatePaybackPeriod(
        cashFlows,
        initialInvestment,
      );

      // Payback = 500,000 / 75,000 = 6.67 years
      expect(paybackPeriod).toBeCloseTo(6.67, 1);
    });

    test('should calculate all metrics together', () => {
      const metrics = calculateFinancialMetrics({
        initialInvestment,
        discountRate,
        projectDuration,
        annualCashInflow,
      });

      expect(metrics.npv).toBeCloseTo(-39155, -2);
      expect(metrics.irr).toBeCloseTo(8.14, 1);
      expect(metrics.paybackPeriod).toBeCloseTo(6.67, 1);
      expect(metrics.roi).toBeCloseTo(50, 0); // (750,000 - 500,000) / 500,000 * 100 = 50%
    });
  });

  describe('Default discount rate calculation', () => {
    test('should return base rate for no business case types', () => {
      const rate = getDefaultDiscountRate([]);
      expect(rate).toBe(0.1); // 10%
    });

    test('should adjust rate for ESG projects', () => {
      const rate = getDefaultDiscountRate(['ESG']);
      expect(rate).toBe(0.12); // 10% + 2% = 12%
    });

    test('should adjust rate for IPO Prep projects', () => {
      const rate = getDefaultDiscountRate(['IPO Prep']);
      expect(rate).toBe(0.13); // 10% + 3% = 13%
    });

    test('should adjust rate for Cost Control projects', () => {
      const rate = getDefaultDiscountRate(['Cost Control']);
      expect(rate).toBe(0.09); // 10% - 1% = 9%
    });

    test('should handle multiple business case types', () => {
      const rate = getDefaultDiscountRate(['ESG', 'Cost Control']);
      expect(rate).toBe(0.11); // 10% + 2% - 1% = 11%
    });
  });

  describe('Annual cash inflow estimation', () => {
    test('should estimate base return correctly', () => {
      const inflow = estimateAnnualCashInflow(1000000, [], 5);
      expect(inflow).toBe(150000); // 15% of 1M
    });

    test('should adjust for Cost Control projects', () => {
      const inflow = estimateAnnualCashInflow(1000000, ['Cost Control'], 5);
      expect(inflow).toBe(200000); // 20% of 1M
    });

    test('should adjust for ESG projects', () => {
      const inflow = estimateAnnualCashInflow(1000000, ['ESG'], 5);
      expect(inflow).toBe(120000); // 12% of 1M
    });

    test('should adjust for longer projects', () => {
      const inflow = estimateAnnualCashInflow(1000000, [], 10);
      expect(inflow).toBe(135000); // 15% * 0.9 = 13.5% of 1M
    });
  });

  describe('Edge cases', () => {
    test('should handle zero investment', () => {
      expect(() => {
        calculateFinancialMetrics({
          initialInvestment: 0,
          discountRate: 0.1,
          projectDuration: 5,
          annualCashInflow: 10000,
        });
      }).toThrow('Initial investment must be positive');
    });

    test('should handle negative discount rate', () => {
      expect(() => {
        calculateFinancialMetrics({
          initialInvestment: 100000,
          discountRate: -0.05,
          projectDuration: 5,
          annualCashInflow: 10000,
        });
      }).toThrow('Discount rate cannot be negative');
    });

    test('should handle very high discount rate', () => {
      const metrics = calculateFinancialMetrics({
        initialInvestment: 100000,
        discountRate: 0.5, // 50%
        projectDuration: 5,
        annualCashInflow: 20000,
      });

      expect(metrics.npv).toBeLessThan(0); // Should be negative with high discount rate
    });
  });
});
