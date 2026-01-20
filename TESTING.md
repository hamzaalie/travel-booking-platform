# Testing Documentation

This document provides comprehensive information about testing in the Travel Booking Platform.

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Component Tests](#component-tests)
3. [E2E Tests](#e2e-tests)
4. [Payment Integration Tests](#payment-integration-tests)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [CI/CD Integration](#cicd-integration)

## Testing Stack

### Frontend Testing
- **Vitest**: Fast unit test framework for Vite projects
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

### E2E Testing
- **Playwright**: Cross-browser end-to-end testing
- **Chromium**: Primary browser for E2E tests

### Backend Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **ts-jest**: TypeScript preprocessor for Jest

## Component Tests

### Location
`frontend/src/tests/components/`

### Available Tests

#### Header Component
**File**: `Header.test.tsx`

Tests:
- ✓ Renders logo and site name
- ✓ Shows navigation links when not authenticated
- ✓ Shows user menu when authenticated

#### SearchForm Component
**File**: `SearchForm.test.tsx`

Tests:
- ✓ Renders all search tabs (Flights, Hotels, Car Rentals)
- ✓ Switches between tabs correctly
- ✓ Shows appropriate form fields for each tab
- ✓ Validates required fields on submit

#### LoginPage Component
**File**: `LoginPage.test.tsx`

Tests:
- ✓ Renders login form with all fields
- ✓ Shows link to register page
- ✓ Validates email format
- ✓ Handles authentication errors

#### FlightSearchPage Component
**File**: `FlightSearchPage.test.tsx`

Tests:
- ✓ Renders search page heading
- ✓ Displays search form
- ✓ Shows loading state during search
- ✓ Displays "no results" message when appropriate

#### PaymentPage Component
**File**: `PaymentPage.test.tsx`

Tests:
- ✓ Renders payment methods
- ✓ Displays booking summary
- ✓ Handles wallet payment selection
- ✓ Shows insufficient balance warning

## E2E Tests

### Location
`e2e/`

### Available Test Suites

#### Authentication Flow
**File**: `auth.spec.ts`

Tests:
- ✓ Register a new customer
- ✓ Login with valid credentials
- ✓ Show error for invalid credentials
- ✓ Logout successfully

#### Flight Booking Flow
**File**: `flight-booking.spec.ts`

Tests:
- ✓ Search for flights
- ✓ Complete flight booking
- ✓ View booking history

#### Hotel Booking Flow
**File**: `hotel-booking.spec.ts`

Tests:
- ✓ Search for hotels
- ✓ View hotel details
- ✓ Complete hotel booking

#### Car Rental Flow
**File**: `car-rental.spec.ts`

Tests:
- ✓ Search for car rentals
- ✓ Complete car rental booking

#### Payment Integration
**File**: `payment.spec.ts`

Tests:
- ✓ Display payment methods
- ✓ Process wallet payment
- ✓ Process Stripe payment
- ✓ Show payment confirmation
- ✓ Handle insufficient wallet balance

## Payment Integration Tests

### Backend Location
`backend/tests/integration/payment.test.ts`

### Test Coverage

#### Wallet Payment
- ✓ Process payment successfully with sufficient balance
- ✓ Fail with insufficient balance error

#### Stripe Integration
- ✓ Create payment intent

#### eSewa Integration
- ✓ Initialize payment

#### Khalti Integration
- ✓ Initialize payment

#### Payment Operations
- ✓ Get payment details
- ✓ Process refund

## Running Tests

### Component Tests (Frontend)

```bash
# Run all component tests
npm run test:component

# Run tests in watch mode
cd frontend
npm run test

# Run with coverage
cd frontend
npm run test -- --coverage

# Run specific test file
cd frontend
npm run test Header.test.tsx
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test auth.spec.ts

# Run specific test by name
npx playwright test -g "should login"

# Debug tests
npx playwright test --debug
```

### Backend Tests

```bash
# Run all backend tests
npm run test:backend

# Run with coverage
cd backend
npm run test:coverage

# Run in watch mode
cd backend
npm run test:watch

# Run specific test file
cd backend
npm test payment.test.ts
```

### Run All Tests

```bash
# Run all unit tests (frontend + backend)
npm run test:unit

# Run everything
npm test
npm run test:e2e
```

## Writing Tests

### Component Test Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const mockFn = vi.fn();
    render(<YourComponent onAction={mockFn} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup (e.g., login)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should do something', async ({ page }) => {
    await page.goto('/feature');
    
    // Interact with page
    await page.click('button:has-text("Action")');
    
    // Assert result
    await expect(page).toHaveURL(/\/expected-url/);
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Backend Integration Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server';

describe('API Endpoint', () => {
  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', 'Bearer token')
      .send({ data: 'value' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
```

## Best Practices

### Component Tests
1. **Test behavior, not implementation**: Focus on what the user sees and does
2. **Use accessible queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies**: Mock API calls, router, etc.
4. **Test user interactions**: Simulate real user behavior
5. **Keep tests isolated**: Each test should be independent

### E2E Tests
1. **Test critical user paths**: Focus on main booking flows
2. **Use data-testid for complex selectors**: When semantic queries aren't enough
3. **Wait for elements**: Use `waitFor` to handle async operations
4. **Handle flaky tests**: Add proper waits and retries
5. **Clean up data**: Reset state between tests

### Payment Tests
1. **Use test credentials**: Never use real payment data
2. **Mock external services**: Mock Stripe, eSewa, Khalti in tests
3. **Test error scenarios**: Insufficient funds, network errors, etc.
4. **Verify database state**: Check payment records are created correctly
5. **Test refunds**: Ensure refund logic works properly

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Coverage Reports

### Frontend Coverage
```bash
cd frontend
npm run test -- --coverage
```

Coverage reports will be generated in `frontend/coverage/`

### Backend Coverage
```bash
cd backend
npm run test:coverage
```

Coverage reports will be generated in `backend/coverage/`

## Debugging Tests

### Component Tests
```bash
# Use Vitest UI
cd frontend
npx vitest --ui
```

### E2E Tests
```bash
# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright show-trace trace.zip
```

### Backend Tests
```bash
# Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Data

### Seed Data for Testing
Create test users in development:

```bash
cd backend
npm run prisma:studio
```

Test credentials:
- **Customer**: customer@example.com / Customer@123
- **Agent**: agent@example.com / Agent@123
- **Admin**: admin@example.com / Admin@123

## Continuous Improvement

### Adding New Tests
1. Identify critical user flows
2. Write E2E test first (test-driven development)
3. Add component tests for complex components
4. Add integration tests for API endpoints
5. Update this documentation

### Maintenance
- Review and update tests when features change
- Remove obsolete tests
- Keep test data fresh
- Monitor test execution time
- Fix flaky tests immediately

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For questions or issues with tests:
1. Check test output for detailed error messages
2. Review this documentation
3. Check Playwright traces for E2E failures
4. Contact the development team
