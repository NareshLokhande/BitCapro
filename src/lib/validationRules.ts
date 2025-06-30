/**
 * Validation Rules for Investment Requests
 * Implements business rules for CAPEX/OPEX allocation based on project types and cost thresholds
 */

import { formatCurrencyAmount, formatNumber } from './supabase';

export interface ValidationRule {
  id: string;
  description: string;
  condition: (data: ValidationData) => boolean;
  errorMessage: string | ((data: ValidationData) => string);
}

export interface ValidationData {
  capex: number;
  opex: number;
  totalCost: number;
  category: string;
  currency: string;
  projectType?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Currency-specific thresholds
const CURRENCY_THRESHOLDS = {
  USD: { high: 10000000, small: 500000 },
  EUR: { high: 8500000, small: 425000 },
  GBP: { high: 7300000, small: 365000 },
  JPY: { high: 1500000000, small: 75000000 },
  CAD: { high: 12500000, small: 625000 },
  AUD: { high: 13500000, small: 675000 },
};

// Get thresholds for a specific currency
const getThresholds = (currency: string) => {
  return (
    CURRENCY_THRESHOLDS[currency as keyof typeof CURRENCY_THRESHOLDS] ||
    CURRENCY_THRESHOLDS.USD
  );
};

// Format number according to international standards
const formatNumberLocal = (num: number): string => {
  return formatNumber(num);
};

// Get currency symbol
const getCurrencySymbolLocal = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
  };
  return symbols[currency] || '$';
};

// Helper function to get error message
const getErrorMessage = (
  rule: ValidationRule,
  data: ValidationData,
): string => {
  if (typeof rule.errorMessage === 'function') {
    return rule.errorMessage(data);
  }
  // Replace any $ or hardcoded currency with the correct symbol
  return rule.errorMessage.replace(
    /\$/g,
    getCurrencySymbolLocal(data.currency),
  );
};

export const validationRules: ValidationRule[] = [
  // Infrastructure projects should have CAPEX
  {
    id: 'infrastructure_capex',
    description: 'Infrastructure projects require CAPEX',
    condition: (data: ValidationData) => {
      if (data.category !== 'Infrastructure') return true;
      return data.capex > 0;
    },
    errorMessage:
      'Infrastructure projects should include CAPEX. Consider adding capital expenditure for assets and facilities.',
  },

  // R&D projects should focus on OPEX
  {
    id: 'rd_opex_focus',
    description: 'R&D projects focus on operational costs',
    condition: (data: ValidationData) => {
      if (data.category !== 'R&D') return true;
      return data.opex > 0;
    },
    errorMessage:
      'R&D projects should focus on operational costs. Consider adding operational expenditure for research activities.',
  },

  // Maintenance projects should be OPEX-only
  {
    id: 'maintenance_opex_only',
    description: 'Maintenance projects should be OPEX-only',
    condition: (data: ValidationData) => {
      if (data.category !== 'Maintenance') return true;
      return data.capex === 0;
    },
    errorMessage:
      'Maintenance projects should be OPEX-only for cost efficiency. Remove CAPEX allocation.',
  },

  // Large projects should have CAPEX
  {
    id: 'large_project_capex',
    description: 'Large projects require CAPEX',
    condition: (data: ValidationData) => {
      const thresholds = getThresholds(data.currency);
      if (data.totalCost <= thresholds.high) return true;
      return data.capex > 0;
    },
    errorMessage: (data: ValidationData) => {
      const thresholds = getThresholds(data.currency);
      const formattedAmount = formatNumberLocal(thresholds.high);
      return `Projects over ${getCurrencySymbolLocal(
        data.currency,
      )}${formattedAmount} typically require CAPEX for initial setup.`;
    },
  },

  // Small projects should be OPEX-only
  {
    id: 'small_project_opex_only',
    description: 'Small projects should be OPEX-only',
    condition: (data: ValidationData) => {
      const thresholds = getThresholds(data.currency);
      if (data.totalCost >= thresholds.small) return true;
      return data.capex === 0;
    },
    errorMessage: (data: ValidationData) => {
      const thresholds = getThresholds(data.currency);
      const formattedAmount = formatNumberLocal(thresholds.small);
      return `Projects under ${getCurrencySymbolLocal(
        data.currency,
      )}${formattedAmount} should be OPEX-only for cost efficiency.`;
    },
  },

  // Total cost should be reasonable
  {
    id: 'reasonable_total_cost',
    description: 'Total cost should be reasonable',
    condition: (data: ValidationData) => {
      return data.totalCost > 0 && data.totalCost < 1000000000; // 1B limit
    },
    errorMessage: (data: ValidationData) => {
      return `Total cost should be greater than 0 and less than ${getCurrencySymbolLocal(
        data.currency,
      )}1B.`;
    },
  },

  // CAPEX should not exceed total cost
  {
    id: 'capex_not_exceed_total',
    description: 'CAPEX should not exceed total cost',
    condition: (data: ValidationData) => {
      return data.capex <= data.totalCost;
    },
    errorMessage: (data: ValidationData) => {
      return `CAPEX (${getCurrencySymbolLocal(
        data.currency,
      )}${formatNumberLocal(
        data.capex,
      )}) cannot exceed total cost (${getCurrencySymbolLocal(
        data.currency,
      )}${formatNumberLocal(data.totalCost)}).`;
    },
  },

  // OPEX should not exceed total cost
  {
    id: 'opex_not_exceed_total',
    description: 'OPEX should not exceed total cost',
    condition: (data: ValidationData) => {
      return data.opex <= data.totalCost;
    },
    errorMessage: (data: ValidationData) => {
      return `OPEX (${getCurrencySymbolLocal(data.currency)}${formatNumberLocal(
        data.opex,
      )}) cannot exceed total cost (${getCurrencySymbolLocal(
        data.currency,
      )}${formatNumberLocal(data.totalCost)}).`;
    },
  },
];

export const getValidationSummary = (data: ValidationData) => {
  const applicableRules = validationRules.filter((rule) => {
    // Filter rules based on category and other conditions
    if (
      rule.id === 'infrastructure_capex' &&
      data.category !== 'Infrastructure'
    )
      return false;
    if (rule.id === 'rd_opex_focus' && data.category !== 'R&D') return false;
    if (rule.id === 'maintenance_opex_only' && data.category !== 'Maintenance')
      return false;
    return true;
  });

  const passedRules = applicableRules.filter((rule) =>
    rule.condition(data),
  ).length;
  const failedRules = applicableRules.length - passedRules;

  return {
    totalRules: applicableRules.length,
    passedRules,
    failedRules,
    applicableRules,
  };
};

export const formatCurrency = (amount: number, currency: string): string => {
  return formatCurrencyAmount(amount, currency);
};

/**
 * Validate investment request data against all rules
 */
export function validateInvestmentRequest(
  data: ValidationData,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Run all validation rules
  validationRules.forEach((rule) => {
    try {
      if (!rule.condition(data)) {
        errors.push(getErrorMessage(rule, data));
      }
    } catch (error) {
      console.error(`Error in validation rule ${rule.id}:`, error);
      warnings.push(`Validation rule ${rule.id} encountered an error`);
    }
  });

  // Additional business logic warnings
  if (data.capex > 0 && data.opex === 0) {
    warnings.push(
      `Consider including OPEX for ongoing operational costs (${getCurrencySymbolLocal(
        data.currency,
      )}${formatNumberLocal(data.opex)})`,
    );
  }

  if (data.opex > 0 && data.capex === 0 && data.totalCost > 1000000) {
    warnings.push(
      `Large projects typically require some CAPEX (${getCurrencySymbolLocal(
        data.currency,
      )}${formatNumberLocal(data.capex)}) for initial setup`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validation rules for a specific project category
 */
export function getRulesForCategory(category: string): ValidationRule[] {
  return validationRules.filter((rule) => {
    switch (rule.id) {
      case 'infrastructure_capex':
        return category === 'Infrastructure';
      case 'rd_opex_focus':
        return category === 'R&D';
      case 'maintenance_opex_only':
        return category === 'Maintenance';
      default:
        return true; // Apply general rules to all categories
    }
  });
}

/**
 * Validate specific rule by ID
 */
export function validateRule(ruleId: string, data: ValidationData): boolean {
  const rule = validationRules.find((r) => r.id === ruleId);
  if (!rule) {
    throw new Error(`Validation rule with ID ${ruleId} not found`);
  }
  return rule.condition(data);
}
