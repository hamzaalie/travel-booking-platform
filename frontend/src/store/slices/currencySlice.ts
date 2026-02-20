/**
 * MULTI-CURRENCY MODEL REMOVED - Only NPR currency is supported.
 * This slice is kept as a minimal stub to avoid breaking imports across the app.
 * All currency conversion logic has been removed. Everything defaults to NPR.
 */
import { createSlice } from '@reduxjs/toolkit';

// --- MULTI-CURRENCY IMPORTS COMMENTED OUT ---
// import { createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { api } from '@/services/api';
// import { FALLBACK_EXCHANGE_RATES } from '@/utils/currency';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  isBase: boolean;
  decimalPlaces: number;
}

interface CurrencyState {
  currencies: Currency[];
  currentCurrency: string;
  currencyInfo: Currency | null;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  error: string | null;
}

// --- MULTI-CURRENCY: localStorage-based currency detection removed ---
// const getStoredCurrency = (): string => {
//   try {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('preferredCurrency') || 'NPR';
//     }
//   } catch { /* SSR or restricted context */ }
//   return 'NPR';
// };

const NPR_CURRENCY: Currency = {
  id: '1',
  code: 'NPR',
  name: 'Nepalese Rupee',
  symbol: 'रू',
  exchangeRate: 1,
  isActive: true,
  isBase: true,
  decimalPlaces: 2,
};

const initialState: CurrencyState = {
  currencies: [NPR_CURRENCY],
  currentCurrency: 'NPR',
  currencyInfo: NPR_CURRENCY,
  exchangeRates: { NPR: 1 },
  isLoading: false,
  error: null,
};

// --- MULTI-CURRENCY: All async thunks commented out ---
// export const fetchCurrencies = createAsyncThunk(
//   'currency/fetchCurrencies',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response: any = await api.get('/currency');
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to fetch currencies');
//     }
//   }
// );
//
// export const detectCurrency = createAsyncThunk(
//   'currency/detectCurrency',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response: any = await api.get('/currency/detect');
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to detect currency');
//     }
//   }
// );
//
// export const convertCurrency = createAsyncThunk(
//   'currency/convert',
//   async (
//     { amount, from, to }: { amount: number; from: string; to: string },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response: any = await api.post('/currency/convert', { amount, from, to });
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.error || 'Failed to convert currency');
//     }
//   }
// );

// No-op stubs for backward compatibility (these were async thunks before)
export const fetchCurrencies = () => ({ type: 'currency/noop' as const });
export const detectCurrency = () => ({ type: 'currency/noop' as const });
export const convertCurrency = (_args: { amount: number; from: string; to: string }) => ({ type: 'currency/noop' as const });

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    // --- MULTI-CURRENCY: setCurrency no longer changes currency, always NPR ---
    setCurrency: (state, _action) => {
      // Multi-currency removed - always NPR
      state.currentCurrency = 'NPR';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  // --- MULTI-CURRENCY: All extraReducers removed ---
  // extraReducers were handling fetchCurrencies, detectCurrency, convertCurrency
});

export const { setCurrency, clearError } = currencySlice.actions;
export default currencySlice.reducer;

// Selectors
export const selectCurrencies = (state: { currency: CurrencyState }) => state.currency.currencies;
export const selectCurrentCurrency = (_state: { currency: CurrencyState }) => 'NPR';
export const selectCurrencyInfo = (state: { currency: CurrencyState }) => state.currency.currencyInfo;
export const selectExchangeRates = (state: { currency: CurrencyState }) => state.currency.exchangeRates;

/**
 * MULTI-CURRENCY CONVERSION REMOVED
 * convertPrice now simply formats the amount in NPR without any conversion.
 * Kept for backward compatibility - all pages that call this will get NPR formatting.
 */
export const convertPrice = (
  amount: number,
  _targetCurrency?: string,
  _exchangeRates?: Record<string, number>,
  _currencies?: Currency[],
  _sourceCurrency?: string
): string => {
  return `रू ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
