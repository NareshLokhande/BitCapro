import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Test connection with better error handling
supabase
  .from('investment_requests')
  .select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connected successfully. Total requests:', count);
    }
  })
  .catch((error) => {
    console.error('Supabase connection test error:', error);
  });

// Business Case Types
export const BUSINESS_CASE_TYPES = [
  {
    value: 'Compliance',
    label: 'Compliance',
    description: 'Regulatory compliance and risk mitigation',
  },
  {
    value: 'ESG',
    label: 'ESG (Environmental, Social, Governance)',
    description: 'Sustainability and ESG initiatives',
  },
  {
    value: 'Cost Control',
    label: 'Cost Control',
    description: 'Cost reduction and efficiency improvements',
  },
  {
    value: 'Expansion',
    label: 'Expansion',
    description: 'Business expansion and growth initiatives',
  },
  {
    value: 'Asset Creation',
    label: 'Asset Creation',
    description: 'New asset development and creation',
  },
  {
    value: 'IPO Prep',
    label: 'IPO Preparation',
    description: 'Initial Public Offering preparation activities',
  },
];

// Stock Exchange options for IPO Prep
export const STOCK_EXCHANGES = [
  { value: 'NYSE', label: 'New York Stock Exchange (NYSE)' },
  { value: 'NASDAQ', label: 'NASDAQ' },
  { value: 'LSE', label: 'London Stock Exchange (LSE)' },
  { value: 'TSE', label: 'Tokyo Stock Exchange (TSE)' },
  { value: 'HKEX', label: 'Hong Kong Exchange (HKEX)' },
  { value: 'EURONEXT', label: 'Euronext' },
  { value: 'TSX', label: 'Toronto Stock Exchange (TSX)' },
  { value: 'ASX', label: 'Australian Securities Exchange (ASX)' },
  { value: 'OTHER', label: 'Other' },
];

// Currency utilities
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const formatCurrency = (
  amount: number,
  currencyCode: string,
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString()}`;
};

// Exchange rate cache
let exchangeRateCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fallback rates in case API fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  SGD: 1.35,
  HKD: 7.8,
  NOK: 8.5,
  SEK: 8.8,
  DKK: 6.3,
  PLN: 3.9,
  CZK: 21.5,
  HUF: 295.0,
  RON: 4.2,
  BGN: 1.66,
  HRK: 6.4,
  RUB: 73.0,
  TRY: 8.5,
  BRL: 5.2,
  MXN: 20.0,
  ZAR: 14.5,
  KRW: 1180.0,
  THB: 31.0,
  MYR: 4.1,
  IDR: 14250.0,
  PHP: 50.0,
};

// Fetch live exchange rates
export const fetchLiveExchangeRates = async (): Promise<
  Record<string, number>
> => {
  try {
    // Check cache first
    if (
      exchangeRateCache &&
      Date.now() - exchangeRateCache.timestamp < CACHE_DURATION
    ) {
      console.log('Using cached exchange rates');
      return exchangeRateCache.rates;
    }

    console.log('Fetching live exchange rates...');

    // Call our Supabase edge function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-exchange-rates`,
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.rates) {
      // Update cache
      exchangeRateCache = {
        rates: data.rates,
        timestamp: Date.now(),
      };

      console.log('Live exchange rates fetched successfully:', data.source);
      return data.rates;
    } else {
      throw new Error(
        data.error || 'Invalid response from exchange rate service',
      );
    }
  } catch (error) {
    console.error('Error fetching live exchange rates:', error);
    console.log('Using fallback exchange rates');

    // Update cache with fallback rates
    exchangeRateCache = {
      rates: FALLBACK_RATES,
      timestamp: Date.now(),
    };

    return FALLBACK_RATES;
  }
};

// Get exchange rate with live data
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string = 'USD',
): Promise<number> => {
  if (fromCurrency === toCurrency) return 1.0;

  try {
    const rates = await fetchLiveExchangeRates();

    const fromRate = rates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1.0;
    const toRate = rates[toCurrency] || FALLBACK_RATES[toCurrency] || 1.0;

    // Convert via USD: from -> USD -> to
    return toRate / fromRate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);

    // Fallback to static rates
    const fromRate = FALLBACK_RATES[fromCurrency] || 1.0;
    const toRate = FALLBACK_RATES[toCurrency] || 1.0;
    return toRate / fromRate;
  }
};

// Get specific currency rate to USD
export const getCurrencyToUSDRate = async (
  currency: string,
): Promise<number> => {
  if (currency === 'USD') return 1.0;

  try {
    const rates = await fetchLiveExchangeRates();
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1.0;

    // Return how much 1 unit of currency equals in USD
    return 1 / rate;
  } catch (error) {
    console.error('Error getting currency to USD rate:', error);
    const rate = FALLBACK_RATES[currency] || 1.0;
    return 1 / rate;
  }
};

// Convert currency amount
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string = 'USD',
): Promise<number> => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

// Convert to USD specifically (most common use case)
export const convertToUSD = async (
  amount: number,
  fromCurrency: string,
): Promise<number> => {
  if (fromCurrency === 'USD') return amount;

  const usdRate = await getCurrencyToUSDRate(fromCurrency);
  return amount * usdRate;
};

// Get exchange rate info for display
export const getExchangeRateInfo = async (
  currency: string,
): Promise<{
  rate: number;
  usdEquivalent: number;
  timestamp: number;
  source: string;
}> => {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-exchange-rates?currency=${currency}`,
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        rate: data.rate,
        usdEquivalent: data.usdEquivalent,
        timestamp: data.timestamp,
        source: data.source,
      };
    } else {
      throw new Error(data.error || 'Failed to get exchange rate info');
    }
  } catch (error) {
    console.error('Error getting exchange rate info:', error);

    // Fallback
    const rate = FALLBACK_RATES[currency] || 1.0;
    return {
      rate: rate,
      usdEquivalent: 1 / rate,
      timestamp: Date.now(),
      source: 'fallback',
    };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      investment_requests: {
        Row: InvestmentRequest;
        Insert: Omit<InvestmentRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<InvestmentRequest, 'id' | 'created_at'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      approval_matrix: {
        Row: ApprovalMatrix;
        Insert: Omit<ApprovalMatrix, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ApprovalMatrix, 'id' | 'created_at'>>;
      };
      approval_log: {
        Row: ApprovalLog;
        Insert: Omit<ApprovalLog, 'id' | 'created_at'>;
        Update: Partial<Omit<ApprovalLog, 'id' | 'created_at'>>;
      };
      kpis: {
        Row: KPI;
        Insert: Omit<KPI, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KPI, 'id' | 'created_at'>>;
      };
      business_case_routing: {
        Row: BusinessCaseRouting;
        Insert: Omit<BusinessCaseRouting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BusinessCaseRouting, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role:
    | 'Admin'
    | 'Submitter'
    | 'Approver_L1'
    | 'Approver_L2'
    | 'Approver_L3'
    | 'Approver_L4'
    | 'Sustainability_Officer'
    | 'CFO'
    | 'Legal_Officer'
    | 'Compliance_Officer'
    | 'Business_Development'
    | 'Asset_Manager';
  department: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestmentRequest {
  id: string;
  project_title: string;
  objective: string;
  description: string;
  legal_entity: string;
  location: string;
  project_status: string;
  purpose: string;
  is_in_budget: boolean;
  capex: number;
  opex: number;
  start_year: number;
  end_year: number;
  department: string;
  submitted_by: string;
  submitted_date: string;
  last_updated: string;
  priority: string;
  status: string;
  category: string;
  strategic_fit: boolean;
  risk_assessment: boolean;
  supply_plan: boolean;
  legal_fit: boolean;
  it_fit: boolean;
  hsseq_compliance: boolean;
  yearly_breakdown: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
  currency: string;
  exchange_rate: number;
  base_currency_capex: number;
  base_currency_opex: number;
  currency_conversion_date: string;
  business_case_type: string[];
  supporting_documents: any[];
  carbon_footprint_data?: Record<string, any>;
  stock_exchange_target?: string;
  regulatory_requirements?: Record<string, any>;
  cost_savings_target?: number;
  market_expansion_data?: Record<string, any>;
  asset_details?: Record<string, any>;
}

export interface ApprovalMatrix {
  id: string;
  level: number;
  role: string;
  department: string;
  amount_min: number;
  amount_max: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessCaseRouting {
  id: string;
  business_case_type: string;
  required_role: string;
  approval_level: number;
  department: string;
  amount_min: number;
  amount_max: number;
  is_mandatory: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalLog {
  id: string;
  request_id: string;
  approved_by: string;
  role: string;
  level: number;
  status: string;
  comments: string | null;
  timestamp: string;
  created_at: string;
  user_id?: string;
}

export interface KPI {
  id: string;
  request_id: string;
  irr: number;
  npv: number;
  payback_period: number;
  basis_of_calculation: string | null;
  created_at: string;
  updated_at: string;
}

// Supporting document interface
export interface SupportingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  description?: string;
  category:
    | 'ESG_Report'
    | 'Business_Plan'
    | 'Financial_Projection'
    | 'Compliance_Document'
    | 'Other';
}

/**
 * Format numbers according to industry standards (K, M, B, T)
 * Examples: 1500 -> 1.5K, 2500000 -> 2.5M, 1500000000 -> 1.5B
 */
export const formatNumber = (num: number): string => {
  if (num === 0) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  let formatted: string;

  if (absNum >= 1e12) {
    formatted = `${(absNum / 1e12).toFixed(1)}T`;
  } else if (absNum >= 1e9) {
    formatted = `${(absNum / 1e9).toFixed(1)}B`;
  } else if (absNum >= 1e6) {
    formatted = `${(absNum / 1e6).toFixed(1)}M`;
  } else if (absNum >= 1e3) {
    formatted = `${(absNum / 1e3).toFixed(1)}K`;
  } else {
    formatted = absNum.toLocaleString();
  }

  return `${sign}${formatted}`;
};

/**
 * Format currency amounts with proper symbol and number formatting
 */
export const formatCurrencyAmount = (
  amount: number,
  currency: string,
): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = formatNumber(amount);
  return `${symbol}${formatted}`;
};
