#!/usr/bin/env ts-node

/**
 * 🛡️ Atena Security Test Runner
 * Adapted from WorkOver's security testing architecture.
 *
 * Runs all security and smoke tests in sequence, reporting pass/fail status.
 * Usage: npx ts-node scripts/run-security-tests.ts
 */

import { execSync } from "child_process";

interface TestSuite {
  name: string;
  command: string;
  description: string;
  critical: boolean;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: "Infrastructure Health",
    command: "npx playwright test tests/e2e/smoke/infrastructure.spec.ts --project=chromium --reporter=list",
    description: "Tests critical pages return 200, API routes respond, no console errors",
    critical: true,
  },
  {
    name: "Legal Pages GDPR",
    command: "npx playwright test tests/e2e/smoke/legal-pages.spec.ts --project=chromium --reporter=list",
    description: "Tests GDPR privacy, terms, cookies, AI disclaimer pages",
    critical: true,
  },
  {
    name: "Critical Paths",
    command: "npx playwright test tests/e2e/smoke/critical-paths.spec.ts --project=chromium --reporter=list",
    description: "Tests landing page, navigation, search, performance, responsive",
    critical: true,
  },
  {
    name: "API Security",
    command: "npx playwright test tests/e2e/security/api-security.spec.ts --project=chromium --reporter=list",
    description: "Tests webhook auth, HTTPS, no secret exposure, input validation",
    critical: true,
  },
];

interface TestResult {
  suite: TestSuite;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now();

  console.log(`\n🧪 Running: ${suite.name}`);
  console.log(`   ${suite.description}`);

  try {
    execSync(suite.command, {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test" },
    });

    const duration = Date.now() - startTime;
    console.log(`✅ ${suite.name} passed (${duration}ms)\n`);

    return { suite, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${suite.name} failed (${duration}ms)\n`);

    return {
      suite,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("\n🛡️  ATENA SECURITY TESTING SUITE\n");
  console.log("Running comprehensive security & smoke tests...\n");
  console.log("─".repeat(60));

  const results: TestResult[] = [];
  let criticalFailures = 0;

  for (const suite of TEST_SUITES) {
    const result = await runTestSuite(suite);
    results.push(result);

    if (!result.passed && suite.critical) {
      criticalFailures++;
    }
  }

  // Print summary
  console.log("\n\n📊 TEST SUMMARY\n");
  console.log("─".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms\n`);

  // Detailed results
  console.log("Detailed Results:\n");
  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    const status = result.passed ? "PASS" : "FAIL";
    const critical = result.suite.critical ? " [CRITICAL]" : "";

    console.log(`${icon} ${result.suite.name}${critical}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${result.duration}ms`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log("");
  });

  // Critical failures warning
  if (criticalFailures > 0) {
    console.log("\n⚠️  CRITICAL SECURITY TESTS FAILED\n");
    console.log(
      `${criticalFailures} critical security test(s) failed. These MUST be fixed before going live.`
    );
    console.log("\nCritical tests ensure that:");
    console.log("  • All pages load correctly (200 status)");
    console.log("  • Legal GDPR pages have required content");
    console.log("  • Webhook rejects unauthenticated requests");
    console.log("  • No API keys exposed in page source");
    console.log("  • Atena chat requires authentication\n");

    process.exit(1);
  }

  // Success
  console.log("\n✨ ALL SECURITY TESTS PASSED!\n");
  console.log("Atena's security layer has been validated. Safe to go live. 🏛️ ⚖️\n");

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("\n❌ Security test runner failed:");
    console.error(error);
    process.exit(1);
  });
}

export { runTestSuite, TEST_SUITES };
