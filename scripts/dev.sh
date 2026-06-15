#!/bin/bash
# One-command dev environment for TradePrompt AI
set -e

echo ""
echo "⚡ TradePrompt AI — Starting Dev Environment"
echo "============================================"
echo ""

# Backend setup
cd "$(dirname "$0")/../backend"
if [ ! -d node_modules ]; then
  echo "📦 Installing backend dependencies..."
  npm install --silent
fi

if [ ! -f .env ]; then
  echo "🔧 Running first-time setup (demo mode)..."
  npm run setup:demo
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "  Landing page:  http://localhost:3001"
echo "  Checkout:      http://localhost:3001/checkout.html"
echo "  Admin:         http://localhost:3001/admin"
echo ""
echo "  Extension:     chrome://extensions → Load unpacked → extension/"
echo ""
echo "Starting backend..."
echo ""

npm run dev
