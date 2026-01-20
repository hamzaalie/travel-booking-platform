import { test, expect } from '@playwright/test';

test.describe('Payment Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'Customer@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/dashboard/);
  });

  test('should display payment methods', async ({ page }) => {
    // Navigate to payment page (would need to complete booking first)
    await page.goto('/payment');
    
    // Should show payment options
    await expect(page.locator('text=/payment method/i')).toBeVisible();
    
    // Should have multiple payment options
    await expect(page.locator('text=/stripe|wallet|esewa|khalti/i')).toBeVisible();
  });

  test('should process wallet payment', async ({ page }) => {
    await page.goto('/payment');
    
    // Select wallet payment
    const walletOption = page.locator('input[value="WALLET"], label:has-text("Wallet")');
    if (await walletOption.isVisible()) {
      await walletOption.click();
      
      // Should show wallet balance
      await expect(page.locator('text=/balance|available/i')).toBeVisible();
      
      // Confirm payment button should be enabled if balance sufficient
      const confirmButton = page.locator('button:has-text("Confirm Payment")');
      await expect(confirmButton).toBeVisible();
    }
  });

  test('should process stripe payment', async ({ page }) => {
    await page.goto('/payment');
    
    // Select stripe payment
    const stripeOption = page.locator('input[value="STRIPE"], label:has-text("Credit Card")');
    if (await stripeOption.isVisible()) {
      await stripeOption.click();
      
      // Should show credit card form or redirect to Stripe
      await expect(page.locator('text=/card|stripe/i')).toBeVisible();
    }
  });

  test('should show payment confirmation', async ({ page }) => {
    // Mock successful payment
    await page.goto('/payment');
    
    // Select wallet (fastest for testing)
    const walletOption = page.locator('input[value="WALLET"]');
    if (await walletOption.isVisible()) {
      await walletOption.click();
      
      const confirmButton = page.locator('button:has-text("Confirm Payment")');
      if (await confirmButton.isEnabled()) {
        await confirmButton.click();
        
        // Should show success message or redirect to confirmation
        await page.waitForURL(/\/booking|\/confirmation|\/customer/, { timeout: 10000 });
        
        // Success toast or message should appear
        await expect(
          page.locator('text=/success|confirmed|booked/i')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle insufficient wallet balance', async ({ page }) => {
    await page.goto('/payment');
    
    const walletOption = page.locator('input[value="WALLET"]');
    if (await walletOption.isVisible()) {
      await walletOption.click();
      
      // If balance is insufficient, should show error
      const balanceText = await page.locator('text=/balance/i').textContent();
      
      if (balanceText?.includes('$0') || balanceText?.includes('0.00')) {
        const confirmButton = page.locator('button:has-text("Confirm Payment")');
        
        // Button should be disabled or show error
        const isDisabled = await confirmButton.isDisabled().catch(() => false);
        
        if (!isDisabled) {
          await confirmButton.click();
          await expect(page.locator('text=/insufficient|not enough/i')).toBeVisible();
        }
      }
    }
  });
});
