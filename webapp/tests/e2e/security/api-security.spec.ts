import { test, expect } from "../fixtures";

/**
 * Security & API Protection Tests (adapted from WorkOver)
 *
 * Validates that security measures are in place:
 * - Webhook routes reject unauthenticated requests
 * - API routes have proper error handling
 * - No sensitive data exposure
 * - HTTPS enforcement
 * - Security headers present
 *
 * Run: npx playwright test tests/e2e/security/api-security.spec.ts --project=chromium
 */

test.describe("🛡️ Atena Security Tests", () => {
  test.describe("Stripe Webhook Security", () => {
    test("webhook should reject requests without signature", async ({ request }) => {
      const response = await request.post("/api/webhook/stripe", {
        data: JSON.stringify({ type: "test" }),
        headers: { "Content-Type": "application/json" },
      });

      // Should return 400 (missing signature) — NOT 200
      expect(response.status()).toBe(400);
    });

    test("webhook should reject requests with invalid signature", async ({ request }) => {
      const response = await request.post("/api/webhook/stripe", {
        data: JSON.stringify({ type: "test" }),
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "t=1234567890,v1=invalid_signature_value",
        },
      });

      // Should return 400 (invalid signature)
      expect(response.status()).toBe(400);
    });
  });

  test.describe("Checkout API Security", () => {
    test("checkout should reject GET requests", async ({ request }) => {
      const response = await request.get("/api/checkout");

      // Should not return 200 or 500
      const status = response.status();
      expect(status).not.toBe(200);
      expect(status).not.toBe(500);
    });

    test("checkout should reject requests without required fields", async ({ request }) => {
      const response = await request.post("/api/checkout", {
        data: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      // API should respond (not hang). Status 400/401/405/500 are all acceptable
      // as the request lacks auth tokens and required fields.
      // Key security check: it must NOT return 200 (unauthorized checkout success).
      const status = response.status();
      expect(status).not.toBe(200);
      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe("HTTPS & SSL", () => {
    test("should enforce HTTPS", async ({ page }) => {
      await page.goto("/");
      const url = page.url();
      expect(url).toMatch(/^https:\/\//);
    });

    test("should not expose server version headers", async ({ request }) => {
      const response = await request.get("/");
      const headers = response.headers();

      // Should not expose sensitive server info
      expect(headers["x-powered-by"]).toBeUndefined();
      expect(headers["server"]).not.toContain("Express");
    });
  });

  test.describe("No Sensitive Data Exposure", () => {
    test("env variables should not be exposed in page source", async ({ page }) => {
      await page.goto("/");

      const html = await page.content();
      const lowerHTML = html.toLowerCase();

      // Should NOT contain any API keys
      expect(lowerHTML).not.toContain("sk_live");
      expect(lowerHTML).not.toContain("sk_test");
      expect(lowerHTML).not.toContain("whsec_");
      expect(lowerHTML).not.toContain("re_rs");
      expect(lowerHTML).not.toContain("service_role");
    });

    test("legal pages should not expose API keys", async ({ page }) => {
      const pages = ["/legal/privacy", "/legal/terms", "/legal/cookies"];

      for (const path of pages) {
        await page.goto(path);
        const html = await page.content();
        expect(html).not.toContain("sk_live");
        expect(html).not.toContain("RESEND_API_KEY");
      }
    });
  });

  test.describe("Authentication Protection", () => {
    test("Atena chat should require authentication", async ({ page }) => {
      await page.goto("/atena");

      // Should redirect to login or show auth-required message
      const url = page.url();
      const bodyText = await page.textContent("body");
      const lowerBody = bodyText?.toLowerCase() || "";

      const isProtected =
        url.includes("login") ||
        url.includes("auth") ||
        lowerBody.includes("accedi") ||
        lowerBody.includes("login") ||
        lowerBody.includes("registra");

      expect(isProtected, "Atena chat should require auth").toBeTruthy();
    });
  });

  test.describe("Rate Limiting & Input Validation", () => {
    test("API should handle malformed JSON gracefully", async ({ request }) => {
      const response = await request.post("/api/webhook/stripe", {
        data: "this is not json {{{",
        headers: { "Content-Type": "application/json" },
      });

      // Should not crash (500)
      expect(response.status()).not.toBe(500);
    });

    test("API should handle oversized payloads", async ({ request }) => {
      const largePayload = "x".repeat(1000000); // 1MB
      const response = await request.post("/api/webhook/stripe", {
        data: largePayload,
        headers: { "Content-Type": "application/json" },
      });

      // Should reject — not crash
      expect(response.status()).not.toBe(500);
    });
  });
});
