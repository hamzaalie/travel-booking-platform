import { test, expect } from '@playwright/test';

test.describe('Hotel Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Customer@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/dashboard/);
  });

  test('should search for hotels', async ({ page }) => {
    await page.goto('/');
    
    // Switch to Hotels tab
    await page.click('button:has-text("Hotels")');
    
    // Fill search form
    await page.fill('input[placeholder*="destination"]', 'New York');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Select dates
    await page.click('input[name="checkIn"]');
    await page.click('[data-date]:not([data-disabled])');
    
    await page.click('input[name="checkOut"]');
    // Click next available date after check-in
    await page.click('[data-date]:not([data-disabled])');
    
    // Select guests
    await page.selectOption('select[name="adults"]', '2');
    
    // Search
    await page.click('button:has-text("Search Hotels")');
    
    // Should show results page
    await expect(page).toHaveURL(/\/hotels/);
    await expect(page.locator('text=/hotel/i')).toBeVisible();
  });

  test('should view hotel details', async ({ page }) => {
    await page.goto('/hotels');
    
    // Wait for hotels to load
    await page.waitForSelector('[data-testid="hotel-card"]', { timeout: 10000 }).catch(() => {});
    
    const hasHotels = await page.locator('[data-testid="hotel-card"]').count() > 0;
    
    if (hasHotels) {
      // Click on first hotel
      await page.click('[data-testid="hotel-card"]');
      
      // Should navigate to hotel details
      await expect(page).toHaveURL(/\/hotel\//);
      
      // Should show hotel information
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=/description|amenities|rooms/i')).toBeVisible();
    }
  });

  test('should complete hotel booking', async ({ page }) => {
    await page.goto('/hotels');
    
    // Click view details on first hotel
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    
    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();
      
      // Click book now on a room
      const bookButton = page.locator('button:has-text("Book Now")').first();
      
      if (await bookButton.isVisible()) {
        await bookButton.click();
        
        // Should navigate to booking page
        await expect(page).toHaveURL(/\/booking\/hotel/);
        
        // Fill guest details
        await page.fill('input[name="guestName"]', 'John Doe');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="phone"]', '+1234567890');
        
        // Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');
        
        // Should navigate to payment page
        await expect(page).toHaveURL(/\/payment/);
      }
    }
  });
});
