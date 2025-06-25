import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface ExchangeRateResponse {
  success: boolean;
  rates?: Record<string, number>;
  error?: string;
  timestamp?: number;
  base?: string;
}

// Supported currencies
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'SGD',
  'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK',
  'RUB', 'TRY', 'BRL', 'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'IDR', 'PHP'
];

// Fallback rates in case API fails
const FALLBACK_RATES: Record<string, number> = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.73,
  'JPY': 110.0,
  'CAD': 1.25,
  'AUD': 1.35,
  'CHF': 0.92,
  'CNY': 6.45,
  'INR': 74.5,
  'SGD': 1.35,
  'HKD': 7.8,
  'NOK': 8.5,
  'SEK': 8.8,
  'DKK': 6.3,
  'PLN': 3.9,
  'CZK': 21.5,
  'HUF': 295.0,
  'RON': 4.2,
  'BGN': 1.66,
  'HRK': 6.4,
  'RUB': 73.0,
  'TRY': 8.5,
  'BRL': 5.2,
  'MXN': 20.0,
  'ZAR': 14.5,
  'KRW': 1180.0,
  'THB': 31.0,
  'MYR': 4.1,
  'IDR': 14250.0,
  'PHP': 50.0
};

async function fetchExchangeRates(): Promise<ExchangeRateResponse> {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    // Alternative: fixer.io, currencylayer.com, or openexchangerates.org
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid response format from exchange rate API');
    }
    
    // Filter to only supported currencies
    const filteredRates: Record<string, number> = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      if (data.rates[currency]) {
        filteredRates[currency] = data.rates[currency];
      } else {
        // Use fallback rate if not available
        filteredRates[currency] = FALLBACK_RATES[currency] || 1.0;
      }
    }
    
    return {
      success: true,
      rates: filteredRates,
      timestamp: Date.now(),
      base: 'USD'
    };
    
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates
    return {
      success: false,
      rates: FALLBACK_RATES,
      error: 'Using fallback rates due to API error',
      timestamp: Date.now(),
      base: 'USD'
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const currency = url.searchParams.get('currency');
    
    // Fetch latest exchange rates
    const rateData = await fetchExchangeRates();
    
    if (currency && SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      // Return specific currency rate
      const currencyCode = currency.toUpperCase();
      const rate = rateData.rates?.[currencyCode] || FALLBACK_RATES[currencyCode] || 1.0;
      
      return new Response(
        JSON.stringify({
          success: true,
          currency: currencyCode,
          rate: rate,
          usdEquivalent: 1 / rate, // How much 1 unit of currency equals in USD
          timestamp: rateData.timestamp,
          source: rateData.success ? 'live' : 'fallback'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      // Return all rates
      return new Response(
        JSON.stringify({
          success: true,
          rates: rateData.rates,
          timestamp: rateData.timestamp,
          base: 'USD',
          source: rateData.success ? 'live' : 'fallback',
          supportedCurrencies: SUPPORTED_CURRENCIES
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

  } catch (error) {
    console.error('Error in get-exchange-rates function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch exchange rates',
        rates: FALLBACK_RATES,
        timestamp: Date.now(),
        source: 'fallback'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})