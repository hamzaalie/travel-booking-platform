import { prisma } from '../config/database';
import { logger } from '../config/logger';
import axios from 'axios';

/**
 * Currency Service
 * Handles currency conversion and geo-location based currency detection
 */

interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  date: string;
}

interface GeoLocationResponse {
  country_code: string;
  country_name: string;
  currency: string;
}

// Default exchange rates (fallback when API is unavailable)
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  NPR: 1,        // Base currency
  USD: 0.0075,   // 1 NPR = 0.0075 USD (approx 133 NPR = 1 USD)
  EUR: 0.0069,   // 1 NPR = 0.0069 EUR
  GBP: 0.0059,   // 1 NPR = 0.0059 GBP
  INR: 0.625,    // 1 NPR = 0.625 INR (approx 1.6 NPR = 1 INR)
  AUD: 0.0115,   // 1 NPR = 0.0115 AUD
  CAD: 0.0101,   // 1 NPR = 0.0101 CAD
  CNY: 0.054,    // 1 NPR = 0.054 CNY
  JPY: 1.12,     // 1 NPR = 1.12 JPY
  AED: 0.0275,   // 1 NPR = 0.0275 AED
  SGD: 0.01,     // 1 NPR = 0.01 SGD
  THB: 0.265,    // 1 NPR = 0.265 THB
  MYR: 0.035,    // 1 NPR = 0.035 MYR
  KRW: 10.0,     // 1 NPR = 10 KRW
  CHF: 0.0066,   // 1 NPR = 0.0066 CHF
};

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  NP: 'NPR', // Nepal
  US: 'USD', // United States
  GB: 'GBP', // United Kingdom
  EU: 'EUR', // European Union
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  IN: 'INR', // India
  AU: 'AUD', // Australia
  CA: 'CAD', // Canada
  CN: 'CNY', // China
  JP: 'JPY', // Japan
  AE: 'AED', // UAE
  SG: 'SGD', // Singapore
  TH: 'THB', // Thailand
  MY: 'MYR', // Malaysia
  KR: 'KRW', // South Korea
  CH: 'CHF', // Switzerland
  BD: 'BDT', // Bangladesh
  PK: 'PKR', // Pakistan
  LK: 'LKR', // Sri Lanka
};

// Currency information
const CURRENCY_INFO: Record<string, { name: string; symbol: string; decimalPlaces: number }> = {
  NPR: { name: 'Nepalese Rupee', symbol: 'रू', decimalPlaces: 2 },
  USD: { name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
  EUR: { name: 'Euro', symbol: '€', decimalPlaces: 2 },
  GBP: { name: 'British Pound', symbol: '£', decimalPlaces: 2 },
  INR: { name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  CNY: { name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
  JPY: { name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
  THB: { name: 'Thai Baht', symbol: '฿', decimalPlaces: 2 },
  MYR: { name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
  KRW: { name: 'South Korean Won', symbol: '₩', decimalPlaces: 0 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
  BDT: { name: 'Bangladeshi Taka', symbol: '৳', decimalPlaces: 2 },
  PKR: { name: 'Pakistani Rupee', symbol: 'Rs', decimalPlaces: 2 },
  LKR: { name: 'Sri Lankan Rupee', symbol: 'Rs', decimalPlaces: 2 },
};

export class CurrencyService {
  private exchangeRatesCache: Record<string, number> = DEFAULT_EXCHANGE_RATES;
  private lastUpdated: Date | null = null;
  private cacheValidityMinutes = 60; // Cache valid for 1 hour

  /**
   * Initialize currencies in database
   */
  async initializeCurrencies(): Promise<void> {
    try {
      for (const [code, info] of Object.entries(CURRENCY_INFO)) {
        await prisma.currency.upsert({
          where: { code },
          update: {
            name: info.name,
            symbol: info.symbol,
            exchangeRate: DEFAULT_EXCHANGE_RATES[code] || 1,
            decimalPlaces: info.decimalPlaces,
          },
          create: {
            code,
            name: info.name,
            symbol: info.symbol,
            exchangeRate: DEFAULT_EXCHANGE_RATES[code] || 1,
            isBase: code === 'NPR',
            isActive: true,
            decimalPlaces: info.decimalPlaces,
          },
        });
      }
      logger.info('Currencies initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize currencies:', error);
    }
  }

  /**
   * Initialize country-currency mappings
   */
  async initializeCountryCurrencies(): Promise<void> {
    try {
      for (const [countryCode, currencyCode] of Object.entries(COUNTRY_CURRENCY_MAP)) {
        await prisma.countryCurrency.upsert({
          where: { countryCode },
          update: { currencyCode },
          create: {
            countryCode,
            countryName: this.getCountryName(countryCode),
            currencyCode,
          },
        });
      }
      logger.info('Country currencies initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize country currencies:', error);
    }
  }

  /**
   * Get country name from country code
   */
  private getCountryName(code: string): string {
    const countryNames: Record<string, string> = {
      NP: 'Nepal',
      US: 'United States',
      GB: 'United Kingdom',
      DE: 'Germany',
      FR: 'France',
      IT: 'Italy',
      ES: 'Spain',
      IN: 'India',
      AU: 'Australia',
      CA: 'Canada',
      CN: 'China',
      JP: 'Japan',
      AE: 'United Arab Emirates',
      SG: 'Singapore',
      TH: 'Thailand',
      MY: 'Malaysia',
      KR: 'South Korea',
      CH: 'Switzerland',
      BD: 'Bangladesh',
      PK: 'Pakistan',
      LK: 'Sri Lanka',
    };
    return countryNames[code] || code;
  }

  /**
   * Get currency by IP-based geo-location
   */
  async getCurrencyByIP(ip: string): Promise<string> {
    try {
      // Use free IP geolocation API
      const response = await axios.get<GeoLocationResponse>(
        `https://ipapi.co/${ip}/json/`,
        { timeout: 5000 }
      );
      
      const countryCode = response.data.country_code;
      const currencyFromMap = COUNTRY_CURRENCY_MAP[countryCode];
      
      if (currencyFromMap) {
        logger.info(`Detected currency ${currencyFromMap} for IP ${ip} (${countryCode})`);
        return currencyFromMap;
      }

      // Try to get from database
      const countryCurrency = await prisma.countryCurrency.findUnique({
        where: { countryCode },
      });

      if (countryCurrency) {
        return countryCurrency.currencyCode;
      }

      // Default to NPR
      return 'NPR';
    } catch (error) {
      logger.warn(`Failed to detect currency by IP ${ip}:`, error);
      return 'NPR'; // Default to NPR
    }
  }

  /**
   * Get all active currencies
   */
  async getActiveCurrencies() {
    return await prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [
        { isBase: 'desc' },
        { code: 'asc' },
      ],
    });
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string) {
    return await prisma.currency.findUnique({
      where: { code },
    });
  }

  /**
   * Update exchange rates from external API
   */
  async updateExchangeRates(): Promise<void> {
    try {
      // Using exchangerate.host API (free tier)
      const response = await axios.get<ExchangeRateResponse>(
        'https://api.exchangerate.host/latest?base=NPR',
        { timeout: 10000 }
      );

      if (response.data && response.data.rates) {
        this.exchangeRatesCache = response.data.rates;
        this.lastUpdated = new Date();

        // Update database
        for (const [code, rate] of Object.entries(response.data.rates)) {
          await prisma.currency.updateMany({
            where: { code },
            data: { exchangeRate: rate },
          });
        }

        logger.info('Exchange rates updated successfully');
      }
    } catch (error) {
      logger.error('Failed to update exchange rates:', error);
      // Use cached/default rates
    }
  }

  /**
   * Get exchange rate for a currency
   */
  async getExchangeRate(currencyCode: string): Promise<number> {
    // Check if cache needs refresh
    if (
      !this.lastUpdated ||
      Date.now() - this.lastUpdated.getTime() > this.cacheValidityMinutes * 60 * 1000
    ) {
      await this.updateExchangeRates();
    }

    // Try from database first
    const currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });

    if (currency) {
      return Number(currency.exchangeRate);
    }

    // Fallback to cache/default
    return this.exchangeRatesCache[currencyCode] || 1;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = await this.getExchangeRate(fromCurrency);
    const toRate = await this.getExchangeRate(toCurrency);

    // Convert to NPR first, then to target currency
    const amountInNPR = amount / fromRate;
    const convertedAmount = amountInNPR * toRate;

    return convertedAmount;
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currencyCode: string): string {
    const info = CURRENCY_INFO[currencyCode];
    if (!info) {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }

    const formattedAmount = amount.toFixed(info.decimalPlaces);
    return `${info.symbol}${formattedAmount}`;
  }

  /**
   * Update a currency
   */
  async updateCurrency(code: string, data: {
    name?: string;
    symbol?: string;
    exchangeRate?: number;
    isActive?: boolean;
    decimalPlaces?: number;
  }) {
    return await prisma.currency.update({
      where: { code },
      data,
    });
  }

  /**
   * Create a new currency
   */
  async createCurrency(data: {
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    decimalPlaces?: number;
  }) {
    return await prisma.currency.create({
      data: {
        ...data,
        isActive: true,
        isBase: false,
        decimalPlaces: data.decimalPlaces || 2,
      },
    });
  }

  /**
   * Add country-currency mapping
   */
  async addCountryCurrency(
    countryCode: string,
    countryName: string,
    currencyCode: string
  ) {
    return await prisma.countryCurrency.upsert({
      where: { countryCode },
      update: { currencyCode, countryName },
      create: { countryCode, countryName, currencyCode },
    });
  }

  /**
   * Get all country-currency mappings
   */
  async getCountryCurrencies() {
    return await prisma.countryCurrency.findMany({
      orderBy: { countryName: 'asc' },
    });
  }
}

export const currencyService = new CurrencyService();
