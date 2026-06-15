#!/bin/bash
# TradePrompt AI — Laptop पर install (बिना sudo/password)
# Usage: bash scripts/install-local.sh

set -e
echo ""
echo "⚡ TradePrompt AI — Local Install"
echo "================================"
echo ""

# Node.js check
if ! command -v node &>/dev/null; then
  echo "📦 Node.js install ho raha hai (nvm se — password nahi lagega)..."
  export NVM_DIR="$HOME/.nvm"
  if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

echo "✓ Node.js: $(node -v)"
echo "✓ npm: $(npm -v)"
echo ""

# Project folder check
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f "backend/package.json" ]; then
  echo "❌ Project folder sahi nahi hai."
  echo ""
  echo "Pehle ye karo:"
  echo "  cd ~"
  echo "  git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git"
  echo "  cd ClipMInd-AI-extension"
  echo "  bash scripts/install-local.sh"
  exit 1
fi

# Backend setup
echo "📦 Backend setup..."
cd backend
npm install --silent 2>/dev/null || npm install

if [ ! -f .env ]; then
  echo "🔧 .env bana rahe hain (demo mode)..."
  npm run setup:demo
fi

cd ..

# Build extension zip
echo "📦 Extension zip bana rahe hain..."
bash scripts/build-extension.sh 2>/dev/null || true

# Store assets
if command -v python3 &>/dev/null; then
  python3 scripts/generate-store-assets.py 2>/dev/null || true
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              ✅ INSTALL COMPLETE!                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Ab ye 3 kaam KHUD karo (5 minute):"
echo ""
echo "  1️⃣  Backend start:"
echo "      cd backend && npm run dev"
echo ""
echo "  2️⃣  Chrome extension load:"
echo "      chrome://extensions → Developer Mode ON"
echo "      → Load unpacked → ye folder:"
echo "      $PROJECT_DIR/extension"
echo ""
echo "  3️⃣  OpenAI API key add karo:"
echo "      Extension → Settings → AI Provider → key paste"
echo "      Key yahan se: https://platform.openai.com/api-keys"
echo ""
echo "  4️⃣  TradingView test:"
echo "      https://www.tradingview.com/chart/"
echo "      → ⚡ button click → template select"
echo ""
echo "Backend URL: http://localhost:3001"
echo "Extension zip: dist/tradeprompt-ai-v1.0.0.zip"
echo ""
