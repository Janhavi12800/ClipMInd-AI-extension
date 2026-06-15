#!/bin/bash
# Checkout fix — ek command mein sab theek
# Run: bash FIX_CHECKOUT.sh

DIR="${1:-/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main}"
BASE="https://raw.githubusercontent.com/Janhavi12800/ClipMInd-AI-extension/main"

echo ""
echo "🔧 TradePrompt — Checkout Fix"
echo "=============================="
echo ""

if [ ! -d "$DIR/backend" ]; then
  echo "❌ Folder nahi mila: $DIR"
  exit 1
fi

cd "$DIR"

echo "📥 Latest files download..."
curl -fsSL "$BASE/backend/src/server.js" -o backend/src/server.js
curl -fsSL "$BASE/backend/public/checkout.html" -o backend/public/checkout.html
curl -fsSL "$BASE/backend/public/app.html" -o backend/public/app.html

cd backend

# Force demo mode on localhost
touch .env
grep -q '^DEMO_MODE=' .env && sed -i 's/^DEMO_MODE=.*/DEMO_MODE=true/' .env || echo 'DEMO_MODE=true' >> .env

echo "🛑 Purana backend band..."
fuser -k 3001/tcp 2>/dev/null
sleep 1

echo ""
echo "✅ Fix ho gaya! Backend start ho raha hai..."
echo ""
echo "  Browser mein kholo:"
echo "  👉 http://localhost:3001/checkout.html"
echo "  👉 http://localhost:3001/app.html"
echo ""

npm run dev
