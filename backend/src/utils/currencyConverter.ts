/**
 * Currency Converter Utility
 * 
 * Converts prices from foreign currencies (USD, EUR, etc.) to NPR.
 * Since we removed multi-currency support, all prices must be in NPR
 * before being sent to the frontend.
 * 
 * Exchange rates are approximate and should be updated periodically.
 * In production, these could be fetched from an API like exchangerate-api.com.
 */

import { logger } from '../config/logger';

// Exchange rates: 1 unit of foreign currency = X NPR
// These are approximate mid-market rates as of Feb 2026
// Source currencies → NPR conversion rates
const EXCHANGE_RATES_TO_NPR: Record<string, number> = {
  NPR: 1,
  USD: 133.50,    // 1 USD = 133.50 NPR
  EUR: 144.20,    // 1 EUR = 144.20 NPR
  GBP: 168.80,    // 1 GBP = 168.80 NPR
  INR: 1.60,      // 1 INR = 1.60 NPR
  AUD: 86.50,     // 1 AUD = 86.50 NPR
  CAD: 95.20,     // 1 CAD = 95.20 NPR
  JPY: 0.89,      // 1 JPY = 0.89 NPR
  CNY: 18.40,     // 1 CNY = 18.40 NPR
  AED: 36.35,     // 1 AED = 36.35 NPR
  SGD: 99.80,     // 1 SGD = 99.80 NPR
  THB: 3.88,      // 1 THB = 3.88 NPR
  MYR: 30.20,     // 1 MYR = 30.20 NPR
  KRW: 0.096,     // 1 KRW = 0.096 NPR
  CHF: 151.30,    // 1 CHF = 151.30 NPR
  SAR: 35.58,     // 1 SAR = 35.58 NPR
  QAR: 36.66,     // 1 QAR = 36.66 NPR
  BDT: 1.11,      // 1 BDT = 1.11 NPR
  PKR: 0.48,      // 1 PKR = 0.48 NPR
  LKR: 0.44,      // 1 LKR = 0.44 NPR
  MMK: 0.064,     // 1 MMK = 0.064 NPR
};

/**
 * Convert an amount from a source currency to NPR.
 * If the source currency is already NPR, returns the amount unchanged.
 * If the source currency is unknown, logs a warning and returns the amount as-is.
 */
export function toNPR(amount: number, sourceCurrency: string): number {
  if (!amount || isNaN(amount)) return 0;
  
  const currency = sourceCurrency?.toUpperCase()?.trim();
  
  if (!currency || currency === 'NPR') {
    return amount;
  }

  const rate = EXCHANGE_RATES_TO_NPR[currency];
  
  if (rate === undefined) {
    logger.warn(`Unknown currency "${currency}" — cannot convert to NPR. Returning amount as-is.`);
    return amount;
  }

  const converted = amount * rate;
  
  // Round to 2 decimal places
  return Math.round(converted * 100) / 100;
}

/**
 * Convert a price object's numeric fields from source currency to NPR.
 * Returns a new object with converted amounts and currency set to 'NPR'.
 * 
 * @param price - Object with total, base, fees, taxes, grandTotal etc.
 * @param sourceCurrency - The currency the price is currently in
 */
export function convertPriceToNPR(
  price: {
    total?: number | string;
    base?: number | string;
    fees?: number | string | any[];
    taxes?: number | string | any[];
    grandTotal?: number | string;
    [key: string]: any;
  },
  sourceCurrency: string
): any {
  const currency = sourceCurrency?.toUpperCase()?.trim();
  
  if (!currency || currency === 'NPR') {
    return { ...price, currency: 'NPR' };
  }

  const convert = (val: any): any => {
    if (val === null || val === undefined) return val;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val;
    return toNPR(num, currency);
  };

  return {
    ...price,
    currency: 'NPR',
    total: convert(price.total),
    base: convert(price.base),
    grandTotal: convert(price.grandTotal),
    // fees and taxes may be numbers or arrays - handle both
    fees: typeof price.fees === 'number' || typeof price.fees === 'string'
      ? convert(price.fees)
      : price.fees,
    taxes: typeof price.taxes === 'number' || typeof price.taxes === 'string'
      ? convert(price.taxes)
      : price.taxes,
  };
}

/**
 * Get the exchange rate for a given currency to NPR.
 */
export function getExchangeRate(currency: string): number | undefined {
  return EXCHANGE_RATES_TO_NPR[currency?.toUpperCase()?.trim()];
}

/**
 * Check if a currency is supported for conversion.
 */
export function isCurrencySupported(currency: string): boolean {
  return currency?.toUpperCase()?.trim() in EXCHANGE_RATES_TO_NPR;
}

/**
 * Get all supported currencies and their rates.
 */
export function getSupportedRates(): Record<string, number> {
  return { ...EXCHANGE_RATES_TO_NPR };
}
