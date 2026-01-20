# Travel Booking Platform - Frontend

React + TypeScript + Redux Toolkit + TailwindCSS frontend for B2B & B2C travel booking platform.

## Tech Stack

- **React 18.2** - UI framework
- **TypeScript 5.3** - Type-safe JavaScript
- **Redux Toolkit 2.0** - State management with slices
- **React Router v6** - Client-side routing with protected routes
- **TanStack Query 5** - Server state management & caching
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Vite 5.0** - Fast build tool with HMR
- **React Hook Form 7.49** - Performant forms with validation
- **Zod** - Schema validation
- **Axios** - HTTP client with interceptors
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Shared UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DashboardHeader.tsx
│   │   └── layouts/         # Layout wrappers
│   │       ├── MainLayout.tsx
│   │       └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── auth/            # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── public/          # Public pages
│   │   │   ├── HomePage.tsx
│   │   │   └── FlightSearchPage.tsx
│   │   ├── customer/        # B2C customer pages
│   │   │   ├── CustomerDashboard.tsx
│   │   │   └── MyBookingsPage.tsx
│   │   ├── agent/           # B2B agent pages
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── AgentBookingsPage.tsx
│   │   │   ├── WalletPage.tsx
│   │   │   └── AgentMarkupsPage.tsx
│   │   ├── admin/           # Super admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AgentApprovalPage.tsx
│   │   │   ├── AllBookingsPage.tsx
│   │   │   ├── FundRequestsPage.tsx
│   │   │   └── MarkupManagementPage.tsx
│   │   └── shared/          # Shared between roles
│   │       └── BookingDetailsPage.tsx
│   ├── services/
│   │   └── api.ts           # Axios instance with interceptors
│   ├── store/
│   │   ├── index.ts         # Redux store configuration
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── flightSlice.ts
│   │       └── bookingSlice.tsx
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Features Implemented

### 1. Authentication & Authorization
- JWT-based authentication with refresh token flow
- Redux slice for auth state management
- Protected routes with role-based access control
- Login/Register pages with form validation
- Token storage in localStorage
- Auto token refresh on 401 responses

### 2. State Management
- Redux Toolkit with TypeScript
- Auth slice with login/register/logout thunks
- Flight slice (prepared for flight search)
- Booking slice (prepared for booking management)
- React Query for server state & caching

### 3. Routing & Navigation
- React Router v6 with nested routes
- Protected routes component
- Role-based dashboard routing
- Public routes (home, search, login, register)
- Customer routes (dashboard, bookings)
- Agent routes (dashboard, bookings, wallet, markups)
- Admin routes (dashboard, agents, fund requests, markups)

### 4. UI Components & Layouts
- **MainLayout**: Header + Footer for public pages
- **DashboardLayout**: Sidebar + DashboardHeader for authenticated pages
- **Header**: Role-based navigation with auth state
- **Sidebar**: Dynamic menu items based on user role (Admin/Agent/Customer)
- **DashboardHeader**: User info display with logout
- Responsive design with TailwindCSS
- Custom utility classes and color palette

### 5. API Integration
- Centralized Axios instance with baseURL
- Request interceptor for JWT token injection
- Response interceptor for:
  - 401 handling with automatic token refresh
  - Error toast notifications
  - Request retry after token refresh
- Organized API methods:
  - `authApi`: register, login, refreshToken
  - `flightApi`: search, getPrice
  - `bookingApi`: create, confirm, get, cancel
  - `walletApi`: getWallet, getTransactions, requestFund
  - `agentApi`: getBookings, getMarkups
  - `adminApi`: getDashboard, approveAgent, etc.
  - `paymentApi`: Stripe, Khalti, Esewa, PayPal

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### Run Development Server

```bash
npm run dev
```

Frontend will run on http://localhost:5173

### Build for Production

```bash
npm run build
```

Production files will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start Vite dev server with HMR
- `npm run build` - TypeScript check + production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Styling

### TailwindCSS Configuration

Custom color palette in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... full scale to 900
  }
}
```

### Custom CSS Classes

Defined in `src/index.css`:

- `.btn` - Base button styles
- `.btn-primary` - Primary button variant
- `.btn-secondary` - Secondary button variant
- `.input` - Form input styles
- `.card` - Card container styles

## State Management Patterns

### Redux Slices

Each slice follows the pattern:

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const someAction = createAsyncThunk(
  'sliceName/actionName',
  async (payload, { rejectWithValue }) => {
    // API call
  }
);

const someSlice = createSlice({
  name: 'sliceName',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(someAction.pending, (state) => {})
      .addCase(someAction.fulfilled, (state, action) => {})
      .addCase(someAction.rejected, (state, action) => {});
  },
});
```

### React Query Usage

For server state caching:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['bookings'],
  queryFn: async () => {
    const response = await bookingApi.getBookings();
    return response.data;
  },
});
```

## API Integration Examples

### Making Authenticated Requests

```typescript
import { flightApi } from '@/services/api';

const searchFlights = async (params) => {
  const response = await flightApi.search(params);
  return response.data;
};
```

The API service automatically:
- Adds JWT token to request headers
- Handles token refresh on 401
- Retries failed request after refresh
- Shows error toasts for failed requests

### Protected Routes

```typescript
<Route element={<ProtectedRoute allowedRoles={['B2B_AGENT']} />}>
  <Route path="/agent" element={<AgentDashboard />} />
</Route>
```

## Next Steps for Full Implementation

### High Priority Pages
1. **FlightSearchPage** - Flight search form with date pickers, passenger selection
2. **FlightResultsPage** - Display search results from Amadeus API
3. **BookingFlowPages** - Passenger details, seat selection, payment
4. **AgentDashboard** - Wallet balance, recent bookings, quick actions
5. **AdminDashboard** - Stats cards, pending approvals list (already has basic version)

### Medium Priority
6. **WalletPage** - Balance display, transaction history, fund request form
7. **AgentApprovalPage** - List of pending agents with approve/reject actions
8. **FundRequestsPage** - List of pending fund requests with approval workflow
9. **AllBookingsPage** - Admin view of all bookings with filters
10. **MyBookingsPage** - Customer/Agent booking list with status

### Features to Implement
- Form validation with React Hook Form + Zod
- Data tables with sorting, filtering, pagination
- Modal dialogs for confirmations
- Loading skeletons and spinners
- Error boundaries
- Toast notifications (already setup)
- Date/time formatting utilities
- Currency formatting utilities
- PDF ticket generation
- Email receipt sending

### Testing
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- API mocking with MSW

## Integration with Backend

The frontend is designed to work with the backend API:

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- **Flights**: `/api/flights/search`, `/api/flights/price`
- **Bookings**: `/api/bookings`, `/api/bookings/:id/confirm`, `/api/bookings/:id/cancel`
- **Wallet**: `/api/wallet`, `/api/wallet/transactions`, `/api/wallet/fund-requests`
- **Admin**: `/api/admin/*` (dashboard, agents, bookings, markups)
- **Payments**: `/api/payments/*` (Stripe, Khalti, Esewa, PayPal)

All API endpoints are configured in `src/services/api.ts`.

## Production Deployment

### Docker Build

```bash
docker build -t travel-booking-frontend .
docker run -p 80:80 travel-booking-frontend
```

### Environment Configuration

For production, set `VITE_API_URL` to your production backend URL:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Nginx Configuration

Production build uses Nginx. Config in `nginx.conf`:

- Serves static files from `/usr/share/nginx/html`
- SPA fallback to `index.html` for all routes
- Gzip compression enabled
- Cache headers for static assets

## Support

For backend integration or deployment issues, refer to:
- Backend API documentation in `backend/README.md`
- Setup guide in root `SETUP_GUIDE.md`
- Docker setup in root `docker-compose.yml`
