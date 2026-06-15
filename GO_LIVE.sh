#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  GO LIVE — Production sell-ready
#  Run: bash GO_LIVE.sh
#  Or:  bash GO_LIVE.sh https://your-api.onrender.com
# ═══════════════════════════════════════════════════════════════
set -e

API_URL="${1:-}"
API_URL="${API_URL%/}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ⚡ TradePrompt AI — GO LIVE (Production Sell Ready)      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PROJECT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT"

echo "── 1/3 Sell-ready baseline ──"
cd backend
[ ! -d node_modules ] && npm install
[ ! -f .env ] && npm run setup:demo
npm run verify
cd ..
bash scripts/build-extension.sh

echo ""
echo "── 2/3 Store assets ──"
[ -f store-assets/generated/screenshot-1-popup.png ] || python3 scripts/generate-store-assets.py 2>/dev/null || true

if [ -z "$API_URL" ] && [ -t 0 ]; then
  read -r -p "Deployed API URL (Enter = skip): " API_URL || true
  API_URL="${API_URL%/}"
fi

if [ -n "$API_URL" ]; then
  echo ""
  echo "── 3/3 Production build ──"
  node scripts/generate-production-env.mjs "$API_URL"
  bash scripts/build-store.sh "$API_URL"
  node scripts/sell-ready-test.mjs "$API_URL" 2>/dev/null || echo "⚠ Remote test failed — deploy backend first, then re-run"
else
  echo ""
  echo "── 3/3 Skipped production zip (no API URL) ──"
  echo "After Render deploy run:"
  echo "  bash GO_LIVE.sh https://YOUR-APP.onrender.com"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  NEXT: Deploy + Chrome Store (docs/GO_LIVE_HINDI.md)     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Render:  dashboard.render.com → Web Service → root: backend"
echo "  Store:   chrome.google.com/webstore/devconsole"
echo "  Razorpay: dashboard.razorpay.com → LIVE keys"
echo ""
if [ -n "$API_URL" ]; then
  echo "  Privacy:  $API_URL/privacy.html"
  echo "  Checkout: $API_URL/checkout.html"
  echo "  Store zip: dist/tradeprompt-ai-store-v1.0.3.zip"
fi
echo ""
