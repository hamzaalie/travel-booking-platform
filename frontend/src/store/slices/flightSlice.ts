import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FlightState {
  searchResults: any[];
  selectedFlight: any | null;
  searchParams: any | null;
  isLoading: boolean;
}

const initialState: FlightState = {
  searchResults: [],
  selectedFlight: null,
  searchParams: null,
  isLoading: false,
};

const flightSlice = createSlice({
  name: 'flight',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setSelectedFlight: (state, action: PayloadAction<any>) => {
      state.selectedFlight = action.payload;
    },
    setSearchParams: (state, action: PayloadAction<any>) => {
      state.searchParams = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearSearch: (state) => {
      state.searchResults = [];
      state.selectedFlight = null;
      state.searchParams = null;
    },
  },
});

export const {
  setSearchResults,
  setSelectedFlight,
  setSearchParams,
  setLoading,
  clearSearch,
} = flightSlice.actions;

export default flightSlice.reducer;
