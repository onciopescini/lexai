import { test, expect } from "../fixtures";

/**
 * Critical Path Smoke Tests (adapted from WorkOver)
 *
 * Fast, focused tests covering primary user journeys on Atena.
 * Run: npx playwright test tests/e2e/smoke/critical-paths.spec.ts
 */

test.describe("🚀 Atena Critical Paths — Smoke Tests", () => {
  test.describe("Landing / Search Page", () => {
    test("should load and display search interface", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Atena's hero uses styled text — check for heading or "Atena" branding
      await expect(
        page.locator("h1, h2, [class*='hero'], [class*='title']")
          .or(page.getByText("Atena"))
          .first()
      ).toBeVisible({ timeout: 15000 });

      // Search input or textarea should be present
      const searchBox = page
        .getByPlaceholder(/domanda giuridica|cerca|chiedi|cita/i)
        .or(page.locator("textarea").first())
        .or(page.locator('input[type="text"]').first())
        .first();
      await expect(searchBox).toBeVisible({ timeout: 15000 });
    });

    test("should display source filter tabs", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Should have source filter buttons (Tutte, Costituzione, Codice Civile, etc.)
      const bodyText = await page.textContent("body");
      const lowerBody = bodyText!.toLowerCase();

      expect(lowerBody).toContain("tutte");
      expect(lowerBody).toContain("costituzione");
    });

    test("should display legal disclaimer banner", async ({ page }) => {
      await page.goto("/");

      // Should show the "Avviso Legale Importante" disclaimer
      const disclaimer = page.getByText(/avviso legale|non fornisce consulenza/i).first();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Navigation", () => {
    test("should have working navigation links", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Check for nav element with Atena branding
      const nav = page.locator("nav, header").first();
      await expect(nav).toBeVisible();

      // Should have key navigation items
      const bodyText = await page.textContent("nav, header");
      expect(bodyText).toBeTruthy();
    });

    test("should display Guardian Alerts in navigation", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Guardian Alerts link should be visible
      const guardianLink = page.getByText(/guardian/i).first();
      await expect(guardianLink).toBeVisible({ timeout: 5000 });
    });

    test("should have Version Diff feature", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const versionDiff = page.getByText(/version diff/i).first();
      await expect(versionDiff).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Atena AI Chat", () => {
    test("should load Atena chat interface", async ({ page }) => {
      await page.goto("/atena");

      // Should redirect to login or show chat
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("Performance", () => {
    test("should load landing page within 5 seconds", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test("should not have console errors on landing", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("posthog") &&
          !e.includes("google") &&
          !e.includes("sentry") &&
          !e.includes("net::ERR") &&
          !e.includes("ResizeObserver") &&
          !e.includes("404") &&
          !e.includes("Failed to load resource") &&
          !e.includes("hydrat") &&
          !e.includes("chunk")
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe("Responsive", () => {
    test("should render correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      // Atena uses styled headings — check for any visible heading or main content
      await expect(
        page.locator("h1, h2, [class*='hero'], [class*='title']").first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("should render correctly on tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/");

      await expect(
        page.locator("h1, h2, [class*='hero'], [class*='title']").first()
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
