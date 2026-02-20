/**
 * Centralized currency formatting utility.
 * 
 * MULTI-CURRENCY MODEL REMOVED - All prices are in NPR (Nepalese Rupee) only.
 * The formatAmount and getBookingCurrency functions are kept for backward compatibility
 * but always use NPR as the default currency.
 */

// Default currency - NPR only
// const DEFAULT_CURRENCY = 'NPR';
const DEFAULT_CURRENCY_SYMBOL = 'रू';

// --- MULTI-CURRENCY MODEL COMMENTED OUT ---
// // Currency symbol map for common currencies
// const CURRENCY_SYMBOLS: Record<string, string> = {
//   USD: '$',
//   EUR: '€',
//   GBP: '£',
//   NPR: 'रू',
//   INR: '₹',
//   JPY: '¥',
//   CNY: '¥',
//   AUD: 'A$',
//   CAD: 'C$',
//   CHF: 'Fr',
//   AED: 'د.إ',
//   SGD: 'S$',
//   THB: '฿',
//   MYR: 'RM',
//   KRW: '₩',
// };

// // Single source of truth for fallback exchange rates (relative to NPR as base = 1)
// export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
//   NPR: 1,
//   USD: 0.0075,
//   EUR: 0.0069,
//   GBP: 0.0059,
//   INR: 0.63,
//   AUD: 0.0115,
//   CAD: 0.0102,
//   JPY: 1.12,
//   AED: 0.0275,
//   THB: 0.262,
//   SGD: 0.01,
//   MYR: 0.0337,
// };
// --- END MULTI-CURRENCY MODEL COMMENTED OUT ---

// Keep FALLBACK_EXCHANGE_RATES export for backward compatibility (NPR only)
export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  NPR: 1,
};

/**
 * Get the symbol for a currency code. Always returns NPR symbol.
 */
export function getCurrencySymbol(_code?: string): string {
  return DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Format an amount in NPR (default currency).
 * The currencyCode parameter is kept for backward compatibility but ignored.
 */
export function formatAmount(amount: number, _currencyCode?: string): string {
  return `${DEFAULT_CURRENCY_SYMBOL} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// --- MULTI-CURRENCY CONVERSION COMMENTED OUT ---
// /**
//  * Convert and format a price from source currency to target currency.
//  * This is the main function all pages should use.
//  * 
//  * @param amount - The raw numeric amount
//  * @param sourceCurrency - The currency the amount is in (e.g. from Amadeus API or booking.currency)
//  * @param targetCurrency - The user's preferred display currency (from Redux store)
//  * @param exchangeRates - Live rates from the store (keyed by currency code, relative to NPR base)
//  */
// export function formatConvertedPrice(
//   amount: number,
//   sourceCurrency: string,
//   targetCurrency: string,
//   exchangeRates: Record<string, number> = {},
// ): string {
//   if (!amount && amount !== 0) return formatAmount(0, targetCurrency);
//
//   // If same currency, just format
//   if (sourceCurrency === targetCurrency) {
//     return formatAmount(amount, targetCurrency);
//   }
//
//   const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : FALLBACK_EXCHANGE_RATES;
//
//   const sourceRate = rates[sourceCurrency];
//   const targetRate = rates[targetCurrency];
//
//   // If we don't have rates for either currency, show as-is with source symbol
//   if (sourceRate === undefined || targetRate === undefined) {
//     return formatAmount(amount, sourceCurrency);
//   }
//
//   // Cross-rate conversion: source → NPR (base) → target
//   const convertedAmount = amount * (targetRate / sourceRate);
//   return formatAmount(convertedAmount, targetCurrency);
// }
// --- END MULTI-CURRENCY CONVERSION COMMENTED OUT ---

// Keep formatConvertedPrice for backward compatibility - just formats in NPR, no conversion
export function formatConvertedPrice(
  amount: number,
  _sourceCurrency?: string,
  _targetCurrency?: string,
  _exchangeRates?: Record<string, number>,
): string {
  if (!amount && amount !== 0) return formatAmount(0);
  return formatAmount(amount);
}

/**
 * Get the correct source currency from a booking object.
 * Always returns 'NPR' since we only support single currency now.
 */
export function getBookingCurrency(_booking?: any): string {
  return 'NPR';
}
