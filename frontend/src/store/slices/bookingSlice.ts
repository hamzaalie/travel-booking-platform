import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BookingState {
  currentBooking: any | null;
  passengers: any[];
  isProcessing: boolean;
}

const initialState: BookingState = {
  currentBooking: null,
  passengers: [],
  isProcessing: false,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentBooking: (state, action: PayloadAction<any>) => {
      state.currentBooking = action.payload;
    },
    setPassengers: (state, action: PayloadAction<any[]>) => {
      state.passengers = action.payload;
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    clearBooking: (state) => {
      state.currentBooking = null;
      state.passengers = [];
    },
  },
});

export const {
  setCurrentBooking,
  setPassengers,
  setProcessing,
  clearBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;
