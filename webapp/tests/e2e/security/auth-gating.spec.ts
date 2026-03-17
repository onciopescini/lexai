import { test, expect } from '@playwright/test';

test.describe('Security — Auth Gating', () => {
  // Use a completely empty state to simulate an unauthenticated user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated user cannot access the main /atena page', async ({ page }) => {
    await page.goto('/atena');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Should redirect to auth or show the Auth modal
    await page.waitForURL('**/');
    const currentUrl = page.url();
    const isRedirectedToHome = currentUrl.endsWith('/');
    
    // Check if the Auth Modal is visible
    const authModalHeading = page.locator('h1, h2, h3').filter({ hasText: /accedi|login|registrati/i });
    const isAuthModalVisible = await authModalHeading.first().isVisible().catch(() => false);
    
    expect(isRedirectedToHome || isAuthModalVisible).toBe(true);
  });

  test('unauthenticated user cannot access checkout api directly through UI navigation', async ({ page }) => {
    await page.goto('/api/checkout');
    // It should throw a 405 Method Not Allowed or similar because GET is forbidden
    const content = await page.textContent('body');
    expect(content).not.toContain('checkout_session_id');
  });
});
