import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

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

const initialState: CurrencyState = {
  currencies: [],
  currentCurrency: localStorage.getItem('preferredCurrency') || 'NPR',
  currencyInfo: null,
  exchangeRates: {},
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCurrencies = createAsyncThunk(
  'currency/fetchCurrencies',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await api.get('/currency');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch currencies');
    }
  }
);

export const detectCurrency = createAsyncThunk(
  'currency/detectCurrency',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await api.get('/currency/detect');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to detect currency');
    }
  }
);

export const convertCurrency = createAsyncThunk(
  'currency/convert',
  async (
    { amount, from, to }: { amount: number; from: string; to: string },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await api.post('/currency/convert', { amount, from, to });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to convert currency');
    }
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currentCurrency = action.payload;
      localStorage.setItem('preferredCurrency', action.payload);
      
      // Find currency info
      const currencyInfo = state.currencies.find(c => c.code === action.payload);
      if (currencyInfo) {
        state.currencyInfo = currencyInfo;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currencies = action.payload;
        
        // Build exchange rates map
        state.exchangeRates = action.payload.reduce((acc: Record<string, number>, curr: Currency) => {
          acc[curr.code] = Number(curr.exchangeRate);
          return acc;
        }, {});
        
        // Set current currency info
        const currencyInfo = action.payload.find(
          (c: Currency) => c.code === state.currentCurrency
        );
        if (currencyInfo) {
          state.currencyInfo = currencyInfo;
        }
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Detect currency
      .addCase(detectCurrency.fulfilled, (state, action) => {
        // Only set if user hasn't manually chosen a currency
        const storedCurrency = localStorage.getItem('preferredCurrency');
        if (!storedCurrency) {
          state.currentCurrency = action.payload.currencyCode;
          if (action.payload.details) {
            state.currencyInfo = action.payload.details;
          }
        }
      });
  },
});

export const { setCurrency, clearError } = currencySlice.actions;
export default currencySlice.reducer;

// Selectors
export const selectCurrencies = (state: { currency: CurrencyState }) => state.currency.currencies;
export const selectCurrentCurrency = (state: { currency: CurrencyState }) => state.currency.currentCurrency;
export const selectCurrencyInfo = (state: { currency: CurrencyState }) => state.currency.currencyInfo;
export const selectExchangeRates = (state: { currency: CurrencyState }) => state.currency.exchangeRates;

// Helper function to convert and format price
// Converts from any source currency to the target currency using cross-rates
export const convertPrice = (
  amount: number,
  targetCurrency: string,
  exchangeRates: Record<string, number>,
  currencies: Currency[],
  sourceCurrency: string = 'NPR'
): string => {
  // Fallback exchange rates (relative to NPR as base = 1)
  const fallbackRates: Record<string, number> = {
    NPR: 1,
    USD: 0.0075,
    EUR: 0.0069,
    GBP: 0.0059,
    INR: 0.63,
  };

  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackRates;

  const sourceRate = rates[sourceCurrency] || 1;
  const targetRate = rates[targetCurrency] || 1;

  // Cross-rate conversion: source → base (NPR) → target
  const convertedAmount = amount * (targetRate / sourceRate);

  const currencyInfo = currencies.find(c => c.code === targetCurrency);
  const symbol = currencyInfo?.symbol || targetCurrency;
  const decimals = currencyInfo?.decimalPlaces ?? 2;

  return `${symbol} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};
