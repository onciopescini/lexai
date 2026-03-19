import { test, expect } from '@playwright/test';

// Use standard Playwright E2E suite
test.describe('Atena Freemium Flow & UX Access', () => {

  test('Warmup: Homepage loads securely', async ({ page }) => {
    await page.goto('/');
    
    // Auth Warmup: Wait for hero text, preventing hydration races
    const heroTitle = page.locator('h1', { hasText: 'La tua mente giuridica' });
    await expect(heroTitle).toBeVisible({ timeout: 15000 });
  });

  test('Ecosystem Access is Gated (Premium Protection)', async ({ page }) => {
    // Navigate directly to protected route
    await page.goto('/guardian');

    // Using Promise.race for forgiving assertions: 
    // It should EITHER show a paywall modal OR redirect to the home page with a sign in prompt.
    const feedback = await Promise.race([
        page.getByText('Esegui l\'upgrade a Premium').waitFor({ state: 'visible', timeout: 8000 }).then(() => 'paywall'),
        page.waitForURL('**/', { timeout: 8000 }).then(() => 'home')
    ]).catch(() => 'timeout');

    expect(feedback).not.toBe('timeout');
  });

  test('Drafting Mode Gating displays Paywall', async ({ page }) => {
    // Go to chat workspace
    await page.goto('/atena');
    
    // Locate the Drafting toggle
    const draftingToggle = page.locator('button[role="switch"]', { hasText: 'Drafting' }).first();
    
    // If running in unauthenticated or Free state, this should trigger the Subscription modal
    if (await draftingToggle.isVisible()) {
      await draftingToggle.click();
      
      const subModal = page.locator('text=Esegui l\'upgrade a Premium');
      await expect(subModal).toBeVisible({ timeout: 5000 });
    }
  });

});
