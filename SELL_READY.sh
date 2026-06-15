#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  TradePrompt AI — SELL READY (ek command mein sab)
#  Run: bash SELL_READY.sh
# ═══════════════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ⚡ TradePrompt AI — SELL READY Setup               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# --- project folder dhundo ---
PROJECT=""
for DIR in \
  "$(dirname "$0")" \
  "$HOME/ClipMInd-AI-extension" \
  "$HOME/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "/home/blocksone/ClipMInd-AI-extension" \
  "/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$(pwd)"; do
  if [ -f "$DIR/backend/package.json" ] && [ -f "$DIR/extension/manifest.json" ]; then
    PROJECT="$DIR"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  echo "❌ Project nahi mila. Pehle clone karo:"
  echo "   cd ~ && git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git"
  echo "   bash ClipMInd-AI-extension/SELL_READY.sh"
  exit 1
fi

echo "📁 Project: $PROJECT"
cd "$PROJECT"

# --- node check ---
if ! command -v node &>/dev/null; then
  echo "❌ Node.js install karo: https://nodejs.org"
  exit 1
fi
echo "✓ Node $(node -v)"

# --- backend setup ---
echo ""
echo "── Step 1/5: Backend setup ──"
cd backend
[ ! -d node_modules ] && npm install
[ ! -f .env ] && npm run setup:demo
npm run verify
cd ..

# --- extension zip ---
echo ""
echo "── Step 2/5: Extension zip (Chrome Store) ──"
if ! command -v zip &>/dev/null; then
  echo "Installing zip..."
  sudo apt-get update -qq && sudo apt-get install -y zip 2>/dev/null || true
fi
bash scripts/build-extension.sh
ZIP=$(ls -1 dist/tradeprompt-ai-*.zip 2>/dev/null | head -1)
echo "✓ Zip: $ZIP"

# --- store assets check ---
echo ""
echo "── Step 3/5: Store assets ──"
if [ ! -f store-assets/generated/screenshot-1-popup.png ]; then
  python3 scripts/generate-store-assets.py 2>/dev/null || echo "⚠ Assets script skipped (Pillow fallback OK)"
fi
ls store-assets/generated/*.png 2>/dev/null | wc -l | xargs -I{} echo "✓ {} store images ready"

# --- start server ---
echo ""
echo "── Step 4/5: Server start + test ──"
fuser -k 3001/tcp 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

cd backend
nohup node src/server.js > /tmp/tradeprompt-sell.log 2>&1 &
sleep 3
cd ..

node scripts/sell-ready-test.mjs http://127.0.0.1:3001

# --- summary ---
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ SELL READY (Demo/Local)               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "AB YE KARO (sell karne ke liye):"
echo ""
echo "  A) LOCAL TEST / MANUAL SELL:"
echo "     • Chrome → chrome://extensions → Load unpacked → extension/"
echo "     • App: http://127.0.0.1:3001/app.html"
echo "     • Checkout: http://127.0.0.1:3001/checkout.html"
echo ""
echo "  B) CHROME WEB STORE UPLOAD:"
echo "     • Zip upload: $ZIP"
echo "     • Dev console: https://chrome.google.com/webstore/devconsole"
echo "     • Listing text: docs/CHROME_WEB_STORE_LISTING.md"
echo "     • Screenshots: store-assets/generated/"
echo "     • Fee: \$5 one-time"
echo ""
echo "  C) LIVE ₹ PAYMENTS (Razorpay):"
echo "     • cd backend && npm run setup"
echo "     • Razorpay LIVE keys + KYC"
echo "     • Deploy backend (Railway/Render) — docs/LAUNCH_CHECKLIST.md"
echo "     • Webhook: YOUR_URL/api/webhook/razorpay"
echo ""
echo "Full Hindi guide: docs/SELL_NOW_HINDI.md"
echo ""
