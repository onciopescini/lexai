import { test, expect } from "../fixtures";

/**
 * Legal Pages — Smoke Test (adapted from WorkOver)
 *
 * Verifies mandatory legal pages load with expected GDPR content:
 * - /legal/privacy → GDPR terms
 * - /legal/terms → Terms of Service
 * - /legal/cookies → Cookie categories
 * - /legal/disclaimer → AI disclaimer
 *
 * Run: npx playwright test tests/e2e/smoke/legal-pages.spec.ts --project=chromium
 */

test.describe("📄 Atena Legal Pages — GDPR Compliance", () => {
  test("should display privacy policy with GDPR content", async ({ page }) => {
    const response = await page.goto("/legal/privacy");
    expect(response?.status()).toBe(200);

    // Should have a heading
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Content should mention GDPR-related terms (Italian)
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    const gdprTerms = ["dati personali", "dati", "trattamento", "diritti", "titolare", "privacy", "informativa", "responsabile"];
    const lowerBody = bodyText!.toLowerCase();
    const foundTerms = gdprTerms.filter((term) => lowerBody.includes(term));
    expect(
      foundTerms.length,
      `Expected ≥2 GDPR terms, found: ${foundTerms.join(", ")}`
    ).toBeGreaterThanOrEqual(2);
  });

  test("should display terms of service with substantial content", async ({ page }) => {
    const response = await page.goto("/legal/terms");
    expect(response?.status()).toBe(200);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Content should be substantial (real terms, not a stub)
    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(500);

    // Should mention key terms concepts
    const lowerBody = bodyText!.toLowerCase();
    expect(lowerBody).toContain("servizio");
  });

  test("should display cookie policy with categories", async ({ page }) => {
    const response = await page.goto("/legal/cookies");
    expect(response?.status()).toBe(200);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    const bodyText = await page.textContent("body");
    const lowerBody = bodyText!.toLowerCase();

    // Must mention cookie-related terms
    expect(lowerBody).toContain("cookie");
  });

  test("should display AI disclaimer", async ({ page }) => {
    const response = await page.goto("/legal/disclaimer");
    expect(response?.status()).toBe(200);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    const bodyText = await page.textContent("body");
    const lowerBody = bodyText!.toLowerCase();

    // Must warn that Atena is not legal advice
    const disclaimerTerms = ["intelligenza artificiale", "consulenza legale", "avvocato"];
    const found = disclaimerTerms.filter((t) => lowerBody.includes(t));
    expect(
      found.length,
      `Expected ≥2 disclaimer terms, found: ${found.join(", ")}`
    ).toBeGreaterThanOrEqual(2);
  });

  test("should display About page", async ({ page }) => {
    const response = await page.goto("/legal/about");
    expect(response?.status()).toBe(200);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    const bodyText = await page.textContent("body");
    expect(bodyText!.length).toBeGreaterThan(200);
  });

  test("footer should link to all legal pages", async ({ page, dismissDisclaimer }) => {
    await page.goto("/");
    await dismissDisclaimer();

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check for legal link presence
    const legalLinks = [
      { text: /privacy/i, label: "Privacy Policy" },
      { text: /disclaimer/i, label: "Disclaimer" },
      { text: /cookie/i, label: "Cookie Policy" },
    ];

    for (const { text, label } of legalLinks) {
      const link = page.locator("footer").getByText(text).first();
      const visible = await link.isVisible({ timeout: 3000 }).catch(() => false);
      expect(visible, `Footer should contain ${label} link`).toBeTruthy();
    }
  });
});
