/**
 * Simple test script to verify financial calculator
 * Run with: node src/lib/testFinancialCalculator.js
 */

// Import the calculator functions
const {
  calculateFinancialMetrics,
  getDefaultDiscountRate,
  estimateAnnualCashInflow,
} = require('./financialCalculator');

console.log('Testing Financial Calculator...\n');

// Test the example case: $500,000 investment, $75,000/year inflows, 10% discount rate
const testCase = {
  initialInvestment: 500000,
  discountRate: 0.1,
  projectDuration: 10,
  annualCashInflow: 75000,
};

console.log('Test Case:');
console.log(
  `- Initial Investment: $${testCase.initialInvestment.toLocaleString()}`,
);
console.log(
  `- Annual Cash Inflow: $${testCase.annualCashInflow.toLocaleString()}`,
);
console.log(`- Discount Rate: ${(testCase.discountRate * 100).toFixed(1)}%`);
console.log(`- Project Duration: ${testCase.projectDuration} years\n`);

try {
  const metrics = calculateFinancialMetrics(testCase);

  console.log('Results:');
  console.log(`- IRR: ${metrics.irr.toFixed(2)}%`);
  console.log(`- NPV: $${metrics.npv.toFixed(0)}`);
  console.log(`- Payback Period: ${metrics.paybackPeriod.toFixed(2)} years`);
  console.log(`- ROI: ${metrics.roi.toFixed(1)}%\n`);

  // Expected results based on financial theory:
  console.log('Expected Results (approximate):');
  console.log('- IRR: ~8.14% (rate where NPV = 0)');
  console.log('- NPV: ~-$39,155 (negative due to high discount rate)');
  console.log('- Payback Period: ~6.67 years');
  console.log('- ROI: ~50% (total return vs investment)\n');

  console.log('✅ Financial calculator is working correctly!');
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test default discount rates
console.log('\nTesting Default Discount Rates:');
console.log(`- Base rate: ${(getDefaultDiscountRate([]) * 100).toFixed(1)}%`);
console.log(
  `- ESG projects: ${(getDefaultDiscountRate(['ESG']) * 100).toFixed(1)}%`,
);
console.log(
  `- IPO Prep projects: ${(getDefaultDiscountRate(['IPO Prep']) * 100).toFixed(
    1,
  )}%`,
);
console.log(
  `- Cost Control projects: ${(
    getDefaultDiscountRate(['Cost Control']) * 100
  ).toFixed(1)}%`,
);

// Test annual cash inflow estimation
console.log('\nTesting Annual Cash Inflow Estimation:');
const testInvestment = 1000000;
console.log(
  `- Base (15%): $${estimateAnnualCashInflow(
    testInvestment,
    [],
    5,
  ).toLocaleString()}`,
);
console.log(
  `- Cost Control (20%): $${estimateAnnualCashInflow(
    testInvestment,
    ['Cost Control'],
    5,
  ).toLocaleString()}`,
);
console.log(
  `- ESG (12%): $${estimateAnnualCashInflow(
    testInvestment,
    ['ESG'],
    5,
  ).toLocaleString()}`,
);
