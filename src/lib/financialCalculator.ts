/**
 * Financial Calculator Utility
 * Implements proper financial formulas for IRR, NPV, and Payback Period calculations
 */

export interface CashFlow {
  year: number;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export interface FinancialMetrics {
  irr: number;
  npv: number;
  paybackPeriod: number;
  roi: number;
}

export interface FinancialInputs {
  initialInvestment: number;
  discountRate: number;
  projectDuration: number;
  annualCashInflow: number;
  annualCashOutflow?: number;
  yearlyBreakdown?: Record<string, { capex: number; opex: number }>;
}

/**
 * Calculate Net Present Value (NPV)
 * NPV = Σ[CFₜ / (1 + r)ᵗ] - C₀
 * Where: CFₜ = Cash flow at time t, r = discount rate, C₀ = initial investment
 */
export function calculateNPV(
  cashFlows: CashFlow[],
  discountRate: number,
  initialInvestment: number,
): number {
  if (discountRate <= -1) {
    throw new Error('Discount rate must be greater than -100%');
  }

  let npv = -initialInvestment; // Initial investment is negative cash flow

  cashFlows.forEach((flow) => {
    const discountFactor = Math.pow(1 + discountRate, flow.year);
    npv += flow.netFlow / discountFactor;
  });

  return npv;
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 * IRR is the discount rate that makes NPV = 0
 */
export function calculateIRR(
  cashFlows: CashFlow[],
  initialInvestment: number,
  maxIterations: number = 100,
  tolerance: number = 0.0001,
): number {
  let guess = 0.1; // Start with 10% as initial guess

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, guess, initialInvestment);

    if (Math.abs(npv) < tolerance) {
      return guess;
    }

    // Calculate derivative (NPV prime) for Newton-Raphson
    let npvPrime = 0;
    cashFlows.forEach((flow) => {
      const discountFactor = Math.pow(1 + guess, flow.year + 1);
      npvPrime -= (flow.year * flow.netFlow) / discountFactor;
    });

    if (Math.abs(npvPrime) < tolerance) {
      break; // Avoid division by zero
    }

    const newGuess = guess - npv / npvPrime;

    // Prevent negative rates or rates that are too high
    if (newGuess <= -1 || newGuess > 10) {
      break;
    }

    guess = newGuess;
  }

  return guess;
}

/**
 * Calculate Payback Period
 * Returns the time it takes to recover the initial investment
 */
export function calculatePaybackPeriod(
  cashFlows: CashFlow[],
  initialInvestment: number,
): number {
  let cumulativeCashFlow = 0;
  let paybackYear = 0;

  for (const flow of cashFlows) {
    cumulativeCashFlow += flow.netFlow;
    paybackYear = flow.year;

    if (cumulativeCashFlow >= initialInvestment) {
      // Calculate partial year if needed
      const previousCumulative = cumulativeCashFlow - flow.netFlow;
      const remainingToRecover = initialInvestment - previousCumulative;
      const partialYear = remainingToRecover / flow.netFlow;
      return paybackYear - 1 + partialYear;
    }
  }

  // If payback period exceeds project duration
  return (
    paybackYear +
    (initialInvestment - cumulativeCashFlow) /
      cashFlows[cashFlows.length - 1]?.netFlow
  );
}

/**
 * Calculate Return on Investment (ROI)
 * ROI = (Total Return - Initial Investment) / Initial Investment * 100
 */
export function calculateROI(
  cashFlows: CashFlow[],
  initialInvestment: number,
): number {
  const totalReturn = cashFlows.reduce((sum, flow) => sum + flow.netFlow, 0);
  return ((totalReturn - initialInvestment) / initialInvestment) * 100;
}

/**
 * Generate cash flows from project inputs
 */
export function generateCashFlows(inputs: FinancialInputs): CashFlow[] {
  const cashFlows: CashFlow[] = [];
  const {
    initialInvestment,
    projectDuration,
    annualCashInflow,
    annualCashOutflow = 0,
    yearlyBreakdown,
  } = inputs;

  for (let year = 1; year <= projectDuration; year++) {
    let outflow = annualCashOutflow;

    // Use yearly breakdown if available
    if (yearlyBreakdown && yearlyBreakdown[year]) {
      outflow += yearlyBreakdown[year].opex || 0;
    }

    const netFlow = annualCashInflow - outflow;

    cashFlows.push({
      year,
      inflow: annualCashInflow,
      outflow,
      netFlow,
    });
  }

  return cashFlows;
}

/**
 * Main function to calculate all financial metrics
 */
export function calculateFinancialMetrics(
  inputs: FinancialInputs,
): FinancialMetrics {
  const { initialInvestment, discountRate, projectDuration } = inputs;

  if (initialInvestment <= 0) {
    throw new Error('Initial investment must be positive');
  }

  if (discountRate < 0) {
    throw new Error('Discount rate cannot be negative');
  }

  const cashFlows = generateCashFlows(inputs);

  // Calculate metrics
  const npv = calculateNPV(cashFlows, discountRate, initialInvestment);
  const irr = calculateIRR(cashFlows, initialInvestment);
  const paybackPeriod = calculatePaybackPeriod(cashFlows, initialInvestment);
  const roi = calculateROI(cashFlows, initialInvestment);

  return {
    irr: irr * 100, // Convert to percentage
    npv,
    paybackPeriod,
    roi,
  };
}

/**
 * Validate financial inputs
 */
export function validateFinancialInputs(inputs: FinancialInputs): string[] {
  const errors: string[] = [];

  if (inputs.initialInvestment <= 0) {
    errors.push('Initial investment must be positive');
  }

  if (inputs.discountRate < 0) {
    errors.push('Discount rate cannot be negative');
  }

  if (inputs.projectDuration <= 0) {
    errors.push('Project duration must be positive');
  }

  if (inputs.annualCashInflow <= 0) {
    errors.push('Annual cash inflow must be positive');
  }

  return errors;
}

/**
 * Get default discount rate based on project type
 */
export function getDefaultDiscountRate(businessCaseTypes: string[]): number {
  // Base rate of 10%
  let rate = 0.1;

  // Adjust based on business case type
  if (businessCaseTypes.includes('ESG')) {
    rate += 0.02; // ESG projects might have higher risk
  }

  if (businessCaseTypes.includes('IPO Prep')) {
    rate += 0.03; // IPO preparation projects have higher risk
  }

  if (businessCaseTypes.includes('Cost Control')) {
    rate -= 0.01; // Cost control projects typically have lower risk
  }

  return Math.max(0.05, Math.min(0.25, rate)); // Clamp between 5% and 25%
}

/**
 * Estimate annual cash inflow based on project characteristics
 */
export function estimateAnnualCashInflow(
  totalInvestment: number,
  businessCaseTypes: string[],
  projectDuration: number,
): number {
  let annualReturn = 0;

  // Base assumption: 15% annual return on investment
  annualReturn = totalInvestment * 0.15;

  // Adjust based on business case type
  if (businessCaseTypes.includes('Cost Control')) {
    annualReturn = totalInvestment * 0.2; // Higher returns for cost control
  } else if (businessCaseTypes.includes('ESG')) {
    annualReturn = totalInvestment * 0.12; // Lower returns for ESG (longer term benefits)
  } else if (businessCaseTypes.includes('IPO Prep')) {
    annualReturn = totalInvestment * 0.18; // Higher returns for IPO prep
  }

  // Adjust for project duration (longer projects might have different returns)
  if (projectDuration > 5) {
    annualReturn *= 0.9; // Slightly lower returns for longer projects
  }

  return Math.max(0, annualReturn);
}
