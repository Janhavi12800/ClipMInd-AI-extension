#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  TradePrompt AI — EK COMMAND, SAB KUCH AUTO
#  Run: bash START_ALL.sh
# ═══════════════════════════════════════════════════════════════

set -e
BASE="https://raw.githubusercontent.com/Janhavi12800/ClipMInd-AI-extension/main"

# Auto-detect project folder
for DIR in \
  "/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension" \
  "$(cd "$(dirname "$0")" 2>/dev/null && pwd)" \
  "$(pwd)"; do
  if [ -f "$DIR/backend/package.json" ]; then
    PROJECT="$DIR"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  echo "📥 Project download ho raha hai..."
  PROJECT="$HOME/ClipMInd-AI-extension"
  git clone --depth 1 https://github.com/Janhavi12800/ClipMInd-AI-extension.git "$PROJECT" 2>/dev/null || {
    mkdir -p "$PROJECT"
    curl -fsSL "$BASE/backend/package.json" -o /tmp/tp-check.json 2>/dev/null
  }
fi

cd "$PROJECT"
echo ""
echo "⚡ TradePrompt AI — Auto Start"
echo "=============================="
echo "📁 Folder: $PROJECT"
echo ""

# Download latest critical files (works even without git)
echo "📥 Latest code sync..."
mkdir -p backend/src backend/public extension/lib extension/background extension/sidepanel extension/content
for f in \
  backend/src/server.js \
  backend/src/ai-service.js \
  backend/src/smart-analysis.js \
  backend/public/app.html \
  backend/public/checkout.html \
  extension/lib/ai-client.js \
  extension/lib/license.js \
  extension/lib/market-data.js \
  extension/background/service-worker.js \
  extension/sidepanel/sidepanel.js \
  extension/manifest.json; do
  curl -fsSL "$BASE/$f" -o "$f" 2>/dev/null || true
done

# Fix extension manifest
sed -i '/default_locale/d' extension/manifest.json 2>/dev/null || true
grep -q '"tabs"' extension/manifest.json 2>/dev/null || \
  sed -i 's/"scripting"/"scripting",\n    "tabs"/' extension/manifest.json 2>/dev/null || true

# Backend setup
echo "📦 Backend install..."
cd backend
npm install --silent 2>/dev/null || npm install

# Force demo .env
if [ ! -f .env ]; then
  npm run setup:demo
fi
touch .env
grep -q '^DEMO_MODE=' .env && sed -i 's/^DEMO_MODE=.*/DEMO_MODE=true/' .env || echo 'DEMO_MODE=true' >> .env
grep -q '^OPENAI_API_KEY=' .env || echo 'OPENAI_API_KEY=' >> .env

# Kill old process
echo "🛑 Purana backend band..."
fuser -k 3001/tcp 2>/dev/null || lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend in background
echo "🚀 Backend start..."
nohup npm run dev > /tmp/tradeprompt.log 2>&1 &
sleep 3

# Test backend
if curl -sf http://localhost:3001/api/health > /dev/null; then
  echo "✅ Backend chal raha hai!"
else
  echo "⚠️  Backend slow start — 5 sec wait..."
  sleep 5
fi

# Open browser
URL="http://localhost:3001/app.html"
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           ✅ SAB TAYYAR — KOI ERROR NAHI           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  🌐 App:      $URL"
echo "  💳 Checkout: http://localhost:3001/checkout.html"
echo ""
echo "  Extension (optional):"
echo "    chrome://extensions → Reload TradePrompt AI"
echo ""
echo "  TradingView: https://www.tradingview.com/chart/"
echo ""

xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || echo "Browser mein kholo: $URL"
