#!/bin/bash
# Sab kuch ek saath fix + setup karo
# Run: bash scripts/fix-all.sh

set -e
PROJECT="/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main"

echo ""
echo "⚡ TradePrompt AI — Auto Fix + Setup"
echo "===================================="
echo ""

# Check folder
if [ ! -d "$PROJECT" ]; then
  echo "❌ Folder nahi mila: $PROJECT"
  echo "   Apna folder path check karo"
  exit 1
fi
cd "$PROJECT"
echo "✓ Folder OK"

# Fix manifest.json
if grep -q "default_locale" extension/manifest.json 2>/dev/null; then
  sed -i '/default_locale/d' extension/manifest.json
  echo "✓ manifest.json fixed"
else
  echo "✓ manifest.json already OK"
fi

# Check Node.js
if ! command -v node &>/dev/null; then
  echo ""
  echo "❌ Node.js installed nahi hai!"
  echo ""
  echo "   YE KARO:"
  echo "   1. Browser kholo: https://nodejs.org"
  echo "   2. 'LTS' version download karo"
  echo "   3. Install karo (Next Next Finish)"
  echo "   4. Terminal BAND karke dubara kholo"
  echo "   5. Ye script dubara chalao"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# Install backend
echo ""
echo "Installing backend..."
cd backend
npm install --silent 2>/dev/null || npm install

# Create .env if missing
if [ ! -f .env ]; then
  npm run setup:demo
fi
echo "✓ Backend ready"

echo ""
echo "============================================"
echo "  ✅ FIX COMPLETE!"
echo "============================================"
echo ""
echo "AB YE 3 KAAM KARO:"
echo ""
echo "─── KAAM 1: Backend start (is terminal mein) ───"
echo "  cd $PROJECT/backend"
echo "  npm run dev"
echo ""
echo "─── KAAM 2: Chrome extension load ───"
echo "  1. chrome://extensions"
echo "  2. Developer mode ON"
echo "  3. Load unpacked"
echo "  4. Select folder:"
echo "     $PROJECT/extension"
echo ""
echo "─── KAAM 3: OpenAI key ───"
echo "  platform.openai.com/api-keys"
echo "  Extension → Settings → AI Provider → paste key"
echo ""
echo "─── KAAM 4: Test ───"
echo "  tradingview.com/chart → ⚡ AI button"
echo ""
