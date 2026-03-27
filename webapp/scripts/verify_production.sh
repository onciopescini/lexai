#!/bin/bash
echo "=========================================="
echo "🚀 LexAI Vercel Pre-Flight Check"
echo "=========================================="

cd "$(dirname "$0")/.."

echo "\n[1] Clean cache..."
rm -rf .next

echo "\n[2] Install dependencies..."
npm install

echo "\n[3] Production Build (Next.js)..."
npm run build

if [ $? -eq 0 ]; then
    echo "\n✅ BUILD PASSED: The application is structurally ready for Vercel production deployment."
else
    echo "\n❌ BUILD FAILED: Check the logs above for TypeScript, ESLint, or Hydration errors."
    exit 1
fi
