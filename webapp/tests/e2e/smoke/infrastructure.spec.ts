import { test, expect } from "../fixtures";

/**
 * Infrastructure Health — Smoke Test (adapted from WorkOver)
 *
 * Validates that critical infrastructure endpoints are healthy:
 * - Critical pages return 200
 * - API routes respond (not 500)
 * - No critical console errors on homepage
 *
 * Run: npx playwright test tests/e2e/smoke/infrastructure.spec.ts --project=chromium
 */

test.describe("🏗️ Atena Infrastructure Health", () => {
  test("critical pages should return 200", async ({ page }) => {
    const criticalPages = [
      { path: "/", label: "Homepage / Ricerca" },
      { path: "/legal/privacy", label: "Privacy Policy" },
      { path: "/legal/terms", label: "Termini di Servizio" },
      { path: "/legal/cookies", label: "Cookie Policy" },
      { path: "/legal/disclaimer", label: "Disclaimer Legale" },
      { path: "/legal/about", label: "About / Chi siamo" },
    ];

    for (const { path, label } of criticalPages) {
      const response = await page.goto(path);
      expect(response?.status(), `${label} (${path}) should return 200`).toBe(200);
    }
  });

  test("API routes should respond (not crash)", async ({ page }) => {
    const apiRoutes = [
      { path: "/api/webhook/stripe", method: "GET", label: "Stripe Webhook" },
      { path: "/api/checkout", method: "GET", label: "Checkout API" },
    ];

    for (const { path, label } of apiRoutes) {
      const response = await page.goto(path);
      const status = response?.status() || 0;
      // API may return 405 (Method Not Allowed for GET) or 400 — but NOT 500
      expect(status, `${label} (${path}) should not return 500`).not.toBe(500);
    }
  });

  test("homepage should not have critical console errors", async ({ page, dismissDisclaimer }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await dismissDisclaimer();
    await page.waitForLoadState("networkidle");

    // Filter out known third-party and framework errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.match(/favicon|posthog|google|sentry|net::ERR|ResizeObserver|404|401|hydrat/i)
    );

    expect(
      criticalErrors,
      `Found ${criticalErrors.length} critical console errors: ${criticalErrors.join(", ")}`
    ).toHaveLength(0);
  });

  test("Atena AI chat page should not have critical console errors", async ({
    page,
    dismissDisclaimer,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/atena");
    await dismissDisclaimer();
    // Wait briefly for client-side rendering
    await page.waitForTimeout(3000);

    // Filter known errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.match(
          /favicon|posthog|google|sentry|net::ERR|ResizeObserver|404|401|hydrat|auth|login/i
        )
    );

    expect(
      criticalErrors,
      `Found ${criticalErrors.length} critical console errors: ${criticalErrors.join(", ")}`
    ).toHaveLength(0);
  });

  test("should handle 404 gracefully", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-12345");

    // Should not crash — show error page or redirect
    await expect(page.locator("body")).toBeVisible();

    // Should show a recognizable 404 message
    const bodyText = await page.textContent("body");
    expect(
      bodyText?.toLowerCase().includes("404") || bodyText?.toLowerCase().includes("non trovata")
    ).toBeTruthy();
  });
});
