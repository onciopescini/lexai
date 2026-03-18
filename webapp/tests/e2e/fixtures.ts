/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from "@playwright/test";

/**
 * Extended test fixtures for Atena E2E tests.
 * Adapted from WorkOver's test architecture.
 */
export const test = base.extend<{
  dismissDisclaimer: () => Promise<void>;
}>({
  dismissDisclaimer: async ({ page }, use) => {
    const dismiss = async () => {
      try {
        const btn = page.getByRole("button", { name: /ho compreso|accetto/i }).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click();
          // Wait for disclaimer to disappear
          await page.waitForTimeout(500);
        }
      } catch {
        // No disclaimer visible, continue
      }
    };
    await use(dismiss);
  },
});

export { expect };
