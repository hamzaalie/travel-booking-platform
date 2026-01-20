import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import flightReducer from '@/store/slices/flightSlice';
import bookingReducer from '@/store/slices/bookingSlice';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

// Create a test store
export const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      flight: flightReducer,
      booking: bookingReducer,
    } as any,
    preloadedState,
  });
};

interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: ReturnType<typeof createTestStore>;
}

function AllTheProviders({ children, store }: AllTheProvidersProps) {
  const testStore = store || createTestStore();
  const queryClient = createTestQueryClient();

  return (
    <Provider store={testStore}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: ReturnType<typeof createTestStore>;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { preloadedState, store, ...renderOptions } = options || {};
  const testStore = store || createTestStore(preloadedState);

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders store={testStore}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };
