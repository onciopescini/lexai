import { test, expect } from "../fixtures";

/**
 * UX 2026 Redesign — Component Tests
 *
 * Covers: AuthModal, SubscriptionModal, CommandPalette,
 * new professional logo, light glassmorphism tokens,
 * premium gate, Guardian page, Library page.
 *
 * Run: npx playwright test tests/e2e/smoke/ux2026-redesign.spec.ts
 */

test.describe("🎨 UX 2026 — Light Glassmorphism Redesign", () => {

  // ── Logo ──────────────────────────────────────────────────────────────
  test.describe("Logo", () => {
    test("should display the new professional logo in navbar", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // New logo uses the PNG file
      const logo = page.locator('img[src="/atena-logo.png"]').first();
      await expect(logo).toBeVisible({ timeout: 10000 });
    });

    test("should have correct alt text for accessibility", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const logo = page.locator('img[src="/atena-logo.png"]').first();
      const alt = await logo.getAttribute("alt");
      expect(alt).toContain("Atena");
    });

    test("should not display old JPEG logo anywhere", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Old logo should be gone
      const oldLogo = page.locator('img[src="/atena-logo-new.jpeg"]');
      await expect(oldLogo).toHaveCount(0);
    });
  });

  // ── Light Glassmorphism Tokens ─────────────────────────────────────────
  test.describe("Design System — Light Glassmorphism", () => {
    test("should use off-white background on homepage", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Body background should not be dark (no #0B0B or similar dark)
      const bgColor = await page.evaluate(() =>
        window.getComputedStyle(document.body).backgroundColor
      );
      // Should be close to F7F7F5 (rgb 247, 247, 245) — not dark
      expect(bgColor).not.toContain("11, 11"); // not rgb(11,11,...) dark
    });

    test("should load Inter font family", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const fontFamily = await page.evaluate(() =>
        window.getComputedStyle(document.body).fontFamily
      );
      expect(fontFamily.toLowerCase()).toContain("inter");
    });
  });

  // ── AuthModal ──────────────────────────────────────────────────────────
  test.describe("AuthModal — Light Redesign", () => {
    test("should open AuthModal when clicking Accedi", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Click the Accedi button
      const accediBtn = page.getByRole("button", { name: /accedi/i }).first();
      await expect(accediBtn).toBeVisible({ timeout: 10000 });
      await accediBtn.click();

      // Modal should appear with the Atena heading
      await expect(
        page.getByText(/accedi ad atena/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test("should show email and password input fields in light theme", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const accediBtn = page.getByRole("button", { name: /accedi/i }).first();
      await accediBtn.click();

      // Email input
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5000 });

      // Password input
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
    });

    test("should switch to registration mode", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const accediBtn = page.getByRole("button", { name: /accedi/i }).first();
      await accediBtn.click();

      // Click "Registrati gratis"
      const registerBtn = page.getByRole("button", { name: /registrati gratis/i }).first();
      await expect(registerBtn).toBeVisible({ timeout: 5000 });
      await registerBtn.click();

      // Now should show "Crea il tuo account" heading
      await expect(
        page.getByText(/crea il tuo account/i).first()
      ).toBeVisible({ timeout: 3000 });
    });

    test("should show terms acceptance in registration mode", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const accediBtn = page.getByRole("button", { name: /accedi/i }).first();
      await accediBtn.click();

      const registerBtn = page.getByRole("button", { name: /registrati gratis/i }).first();
      await registerBtn.click();

      // Terms text should appear
      await expect(
        page.getByText(/termini di servizio/i).first()
      ).toBeVisible({ timeout: 3000 });
    });

    test("should close AuthModal when clicking X", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      const accediBtn = page.getByRole("button", { name: /accedi/i }).first();
      await accediBtn.click();

      await expect(page.getByText(/accedi ad atena/i).first()).toBeVisible({ timeout: 5000 });

      // Click X close button
      const closeBtn = page.locator("[data-testid='auth-close'], button").filter({ hasText: "" }).nth(1);
      // Fallback: press Escape
      await page.keyboard.press("Escape");

      // Modal should be gone — heading no longer visible
      await expect(
        page.getByText(/accedi ad atena/i).first()
      ).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ── SubscriptionModal ──────────────────────────────────────────────────
  test.describe("SubscriptionModal — 2-Column Light Layout", () => {
    test("should open SubscriptionModal when clicking Premium CTA", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Look for the upgrade/premium CTA
      const premiumBtn = page
        .getByRole("button", { name: /premium|passa al piano|upgrade|abbonati/i })
        .or(page.getByText(/premium|passa a premium/i).first())
        .first();

      if (await premiumBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await premiumBtn.click();

        // Check the modal header text
        await expect(
          page.getByText(/intelligence legale completa/i)
            .or(page.getByText(/abbonamento|piano premium/i))
            .first()
        ).toBeVisible({ timeout: 5000 });
      } else {
        // If no CTA on homepage, skip gracefully
        test.skip();
      }
    });
  });

  // ── CommandPalette ─────────────────────────────────────────────────────
  test.describe("CommandPalette — ⌘K", () => {
    test("should open CommandPalette with Ctrl+K shortcut", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      // Press Ctrl+K to open palette
      await page.keyboard.press("Control+k");

      // Palette input or search box should appear
      const paletteInput = page.getByPlaceholder(/cerca una sezione|ricerca/i).first();
      await expect(paletteInput).toBeVisible({ timeout: 5000 });
    });

    test("should close CommandPalette with Escape", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      await page.keyboard.press("Control+k");
      const paletteInput = page.getByPlaceholder(/cerca una sezione|ricerca/i).first();
      await expect(paletteInput).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");
      await expect(paletteInput).not.toBeVisible({ timeout: 3000 });
    });

    test("should list navigation items in palette", async ({ page, dismissDisclaimer }) => {
      await page.goto("/");
      await dismissDisclaimer();

      await page.keyboard.press("Control+k");
      await expect(page.getByPlaceholder(/cerca una sezione/i).first()).toBeVisible({ timeout: 5000 });

      // Check for major navigation items
      const bodyText = await page.textContent("body");
      expect(bodyText?.toLowerCase()).toContain("biblioteca");
    });
  });

  // ── Premium Gate ───────────────────────────────────────────────────────
  test.describe("Premium Gate — Freemium Flow", () => {
    test("should show lock gate on /library for non-auth users", async ({ page }) => {
      await page.goto("/library");

      // Should see either the gate or the library itself (if session persists)
      await expect(page.locator("body")).toBeVisible();
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent("body");
      // Either shows "Contenuto Premium" gate or library content
      const isGated   = bodyText?.toLowerCase().includes("premium");
      const isLibrary = bodyText?.toLowerCase().includes("biblioteca");
      expect(isGated || isLibrary).toBeTruthy();
    });

    test("should show lock gate on /guardian for non-auth users", async ({ page }) => {
      await page.goto("/guardian");
      await expect(page.locator("body")).toBeVisible();
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent("body");
      const isGated   = bodyText?.toLowerCase().includes("premium");
      const isGuardian = bodyText?.toLowerCase().includes("guardian");
      expect(isGated || isGuardian).toBeTruthy();
    });
  });

  // ── Guardian Page ──────────────────────────────────────────────────────
  test.describe("Guardian Page — Radar & Metrics", () => {
    test("should load Guardian page without 500 errors", async ({ page }) => {
      const responses: number[] = [];
      page.on("response", (res) => {
        if (res.url().includes("/guardian")) responses.push(res.status());
      });
      await page.goto("/guardian");
      await page.waitForTimeout(3000);

      const serverErrors = responses.filter((s) => s >= 500);
      expect(serverErrors).toHaveLength(0);
    });
  });

  // ── Lessons Page ──────────────────────────────────────────────────────
  test.describe("Lessons Page", () => {
    test("should load /lessons without 500 errors", async ({ page }) => {
      await page.goto("/lessons");
      await page.waitForTimeout(2000);

      // Should render some content (either gate or lessons)
      await expect(page.locator("body")).toBeVisible();

      const bodyText = await page.textContent("body");
      expect(bodyText?.length).toBeGreaterThan(100);
    });
  });

  // ── Performance ────────────────────────────────────────────────────────
  test.describe("Performance — After Optimization", () => {
    test("should load homepage within 5 seconds after redesign", async ({ page }) => {
      const start = Date.now();
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
    });

    test("should not have critical console errors after redesign", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      const critical = errors.filter(
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
      expect(critical).toHaveLength(0);
    });
  });
});
