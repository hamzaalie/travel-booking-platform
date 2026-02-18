/**
 * Centralized currency formatting utility.
 * 
 * All pages should use this instead of defining their own formatPrice.
 * Ensures consistent currency symbols, conversion, and fallback behavior.
 */

// Currency symbol map for common currencies
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NPR: 'रू',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  AED: 'د.إ',
  SGD: 'S$',
  THB: '฿',
  MYR: 'RM',
  KRW: '₩',
};

// Single source of truth for fallback exchange rates (relative to NPR as base = 1)
export const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  NPR: 1,
  USD: 0.0075,
  EUR: 0.0069,
  GBP: 0.0059,
  INR: 0.63,
  AUD: 0.0115,
  CAD: 0.0102,
  JPY: 1.12,
  AED: 0.0275,
  THB: 0.262,
  SGD: 0.01,
  MYR: 0.0337,
};

/**
 * Get the symbol for a currency code.
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Format an amount with the correct currency symbol and decimal places.
 * No conversion — just formatting.
 */
export function formatAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const decimals = currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2;
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Convert and format a price from source currency to target currency.
 * This is the main function all pages should use.
 * 
 * @param amount - The raw numeric amount
 * @param sourceCurrency - The currency the amount is in (e.g. from Amadeus API or booking.currency)
 * @param targetCurrency - The user's preferred display currency (from Redux store)
 * @param exchangeRates - Live rates from the store (keyed by currency code, relative to NPR base)
 */
export function formatConvertedPrice(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  exchangeRates: Record<string, number> = {},
): string {
  if (!amount && amount !== 0) return formatAmount(0, targetCurrency);

  // If same currency, just format
  if (sourceCurrency === targetCurrency) {
    return formatAmount(amount, targetCurrency);
  }

  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : FALLBACK_EXCHANGE_RATES;

  const sourceRate = rates[sourceCurrency];
  const targetRate = rates[targetCurrency];

  // If we don't have rates for either currency, show as-is with source symbol
  if (sourceRate === undefined || targetRate === undefined) {
    return formatAmount(amount, sourceCurrency);
  }

  // Cross-rate conversion: source → NPR (base) → target
  const convertedAmount = amount * (targetRate / sourceRate);
  return formatAmount(convertedAmount, targetCurrency);
}

/**
 * Get the correct source currency from a booking object.
 * Reads from booking.currency (new field) or falls back to flightDetails.price.currency.
 */
export function getBookingCurrency(booking: any): string {
  if (booking?.currency) return booking.currency;
  if (booking?.flightDetails?.price?.currency) return booking.flightDetails.price.currency;
  if (booking?.flightOffer?.price?.currency) return booking.flightOffer.price.currency;
  return 'USD';
}
