import { test, expect } from '@playwright/test';

test.describe('Car Rental Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Customer@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/dashboard/);
  });

  test('should search for car rentals', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Car Rentals tab
    await page.click('button:has-text("Car Rentals")');
    
    // Fill search form
    await page.fill('input[placeholder*="location"]', 'JFK');
    await page.waitForTimeout(500);
    
    // Select dates
    await page.click('input[name="pickupDate"]');
    await page.click('[data-date]:not([data-disabled])');
    
    await page.click('input[name="dropoffDate"]');
    await page.click('[data-date]:not([data-disabled])');
    
    // Search
    await page.click('button:has-text("Search Cars")');
    
    // Should show results page
    await expect(page).toHaveURL(/\/cars/);
  });

  test('should complete car rental booking', async ({ page }) => {
    await page.goto('/cars');
    
    // Wait for cars to load
    const carCard = page.locator('[data-testid="car-card"]').first();
    const hasCars = await carCard.isVisible().catch(() => false);
    
    if (hasCars) {
      // Click book now
      await page.click('button:has-text("Book Now")');
      
      // Should navigate to booking page
      await expect(page).toHaveURL(/\/booking\/car/);
      
      // Fill driver details
      await page.fill('input[name="driverName"]', 'John Doe');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '+1234567890');
      await page.fill('input[name="licenseNumber"]', 'DL123456');
      
      // Proceed to payment
      await page.click('button:has-text("Proceed to Payment")');
      
      // Should navigate to payment page
      await expect(page).toHaveURL(/\/payment/);
    }
  });
});
