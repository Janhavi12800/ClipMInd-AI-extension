#!/bin/bash
# Sab kuch download + fix + start
# Run: bash UPDATE_AND_START.sh

DIR="${1:-/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main}"
BASE="https://raw.githubusercontent.com/Janhavi12800/ClipMInd-AI-extension/main"

echo ""
echo "⚡ TradePrompt AI — Full Update + Start"
echo "======================================="
echo ""

if [ ! -d "$DIR/backend" ]; then
  echo "❌ Folder nahi mila: $DIR"
  echo "   Pehle ZIP download karo GitHub se"
  exit 1
fi

cd "$DIR"

# Download latest files
echo "📥 Latest files download ho rahe hain..."
mkdir -p backend/public extension/onboarding
curl -fsSL "$BASE/backend/public/app.html" -o backend/public/app.html
curl -fsSL "$BASE/FIX_NOW.sh" -o FIX_NOW.sh 2>/dev/null
chmod +x FIX_NOW.sh 2>/dev/null
bash FIX_NOW.sh 2>/dev/null

# Fix manifest
sed -i '/default_locale/d' extension/manifest.json
grep -q '"tabs"' extension/manifest.json || sed -i 's/"scripting"/"scripting",\n    "tabs"/' extension/manifest.json

# Remove broken onboarding auto-open
sed -i '/chrome.tabs.create.*onboarding/d' extension/background/service-worker.js 2>/dev/null

echo "✓ Files updated"

# Kill old backend on 3001
fuser -k 3001/tcp 2>/dev/null
sleep 1

# Install + start
cd backend
npm install --silent 2>/dev/null
[ ! -f .env ] && npm run setup:demo

echo ""
echo "============================================"
echo "  ✅ SAB TAYYAR! Backend start ho raha hai..."
echo "============================================"
echo ""
echo "  Browser mein kholo:"
echo ""
echo "  👉  http://localhost:3001/app.html"
echo ""
echo "  (Extension ki zaroorat NAHI — seedha web app)"
echo ""
echo "  1. API key paste karo"
echo "  2. Template select karo"
echo "  3. AI Analysis dabao"
echo ""
echo "  TradingView: https://www.tradingview.com/chart/"
echo "============================================"
echo ""

npm run dev
