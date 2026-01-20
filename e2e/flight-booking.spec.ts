import { test, expect } from '@playwright/test';

test.describe('Flight Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Customer@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/dashboard/);
  });

  test('should search for flights', async ({ page }) => {
    await page.goto('/');
    
    // Fill search form
    await page.fill('input[placeholder*="From"]', 'NEW');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    await page.fill('input[placeholder*="To"]', 'LON');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Select dates
    await page.click('input[name="departureDate"]');
    await page.click('[data-date]:not([data-disabled])');
    
    // Select passengers
    await page.selectOption('select[name="adults"]', '2');
    
    // Search
    await page.click('button:has-text("Search Flights")');
    
    // Should show results page
    await expect(page).toHaveURL(/\/flights/);
    await expect(page.locator('text=/flight/i')).toBeVisible();
  });

  test('should complete flight booking', async ({ page }) => {
    // Navigate to flights page
    await page.goto('/flights');
    
    // Assume we have search results
    const firstFlight = page.locator('[data-testid="flight-card"]').first();
    
    // If no flights, perform search first
    const flightExists = await firstFlight.isVisible().catch(() => false);
    
    if (!flightExists) {
      await page.goto('/');
      await page.fill('input[placeholder*="From"]', 'JFK');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      
      await page.fill('input[placeholder*="To"]', 'LAX');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      
      await page.click('input[name="departureDate"]');
      await page.click('[data-date]:not([data-disabled])');
      
      await page.click('button:has-text("Search Flights")');
      await page.waitForURL(/\/flights/);
    }
    
    // Click book now on first available flight
    await page.click('button:has-text("Book Now")');
    
    // Should navigate to booking page
    await expect(page).toHaveURL(/\/booking\/flight/);
    
    // Fill passenger details
    await page.fill('input[name="passengers[0].firstName"]', 'John');
    await page.fill('input[name="passengers[0].lastName"]', 'Doe');
    await page.fill('input[name="passengers[0].dateOfBirth"]', '1990-01-01');
    await page.fill('input[name="passengers[0].passportNumber"]', 'AB123456');
    
    await page.fill('input[name="contact.email"]', 'test@example.com');
    await page.fill('input[name="contact.phone"]', '+1234567890');
    
    // Proceed to payment
    await page.click('button:has-text("Proceed to Payment")');
    
    // Should navigate to payment page
    await expect(page).toHaveURL(/\/payment/);
  });

  test('should view booking history', async ({ page }) => {
    await page.goto('/customer/bookings');
    
    // Should show my bookings page
    await expect(page.locator('h1:has-text("My Bookings")')).toBeVisible();
    
    // Should show bookings or empty state
    const hasBookings = await page.locator('[data-testid="booking-card"]').count() > 0;
    
    if (hasBookings) {
      await expect(page.locator('[data-testid="booking-card"]')).toBeVisible();
    } else {
      await expect(page.locator('text=/no bookings/i')).toBeVisible();
    }
  });
});
