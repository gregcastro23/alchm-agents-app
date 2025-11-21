#!/bin/bash
set -e

echo "🧹 Vercel Pre-build: Aggressive cache clearing"
echo "=============================================="

# Remove any old swisseph packages
echo "Removing old swisseph if present..."
rm -rf node_modules/swisseph 2>/dev/null || true

# Clear all caches
echo "Clearing all cache directories..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -rf .vercel/cache 2>/dev/null || true

# Verify swisseph-v2 is in package.json
echo "Verifying swisseph-v2 in package.json..."
if grep -q '"swisseph-v2"' package.json; then
    echo "✅ swisseph-v2 found in package.json"
else
    echo "❌ ERROR: swisseph-v2 not found in package.json!"
    exit 1
fi

# Check for old swisseph references
if grep -q '"swisseph":' package.json; then
    echo "❌ ERROR: Old swisseph found in package.json!"
    exit 1
fi

echo "✅ Pre-build checks passed"
echo "=============================================="
