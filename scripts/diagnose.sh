#!/bin/bash
# TradePrompt AI — Problem Finder Script
# Run: bash scripts/diagnose.sh

echo ""
echo "=========================================="
echo "  TradePrompt AI — DIAGNOSTIC REPORT"
echo "=========================================="
echo ""

PROJECT="/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main"

# 1. Folder check
echo ">>> STEP 1: Folder Check"
if [ -d "$PROJECT" ]; then
  echo "  OK  Project folder found"
  echo "      $PROJECT"
else
  echo "  FAIL  Project folder NOT found!"
  echo "      Expected: $PROJECT"
  echo ""
  echo "  Try:"
  echo "    ls ~/ClipMInd-AI-extension/"
  exit 1
fi

# 2. Important files
echo ""
echo ">>> STEP 2: Important Files"
for f in backend/package.json extension/manifest.json extension/popup/popup.html; do
  if [ -f "$PROJECT/$f" ]; then
    echo "  OK  $f"
  else
    echo "  FAIL  $f MISSING"
  fi
done

# 3. Manifest fix check
echo ""
echo ">>> STEP 3: Extension Manifest Fix"
if grep -q "default_locale" "$PROJECT/extension/manifest.json" 2>/dev/null; then
  echo "  FAIL  manifest.json still has 'default_locale' — FIX NEEDED!"
  echo ""
  echo "  Run this command to auto-fix:"
  echo "    sed -i '/default_locale/d' $PROJECT/extension/manifest.json"
else
  echo "  OK  manifest.json is fine (no default_locale)"
fi

# 4. Node.js
echo ""
echo ">>> STEP 4: Node.js"
if command -v node &>/dev/null; then
  echo "  OK  Node.js: $(node -v)"
  echo "  OK  npm: $(npm -v)"
else
  echo "  FAIL  Node.js NOT installed!"
  echo ""
  echo "  FIX: Download from https://nodejs.org (LTS version)"
  echo "       Install it, restart terminal, run this script again"
fi

# 5. Backend .env
echo ""
echo ">>> STEP 5: Backend Config"
if [ -f "$PROJECT/backend/.env" ]; then
  echo "  OK  .env file exists"
else
  echo "  WARN  .env missing — will create now..."
  cd "$PROJECT/backend" && npm run setup:demo 2>/dev/null
  if [ -f "$PROJECT/backend/.env" ]; then
    echo "  OK  .env created"
  else
    echo "  FAIL  Could not create .env"
  fi
fi

# 6. Backend running?
echo ""
echo ">>> STEP 6: Backend Server"
if curl -s http://localhost:3001/api/health &>/dev/null; then
  echo "  OK  Backend is RUNNING at http://localhost:3001"
else
  echo "  FAIL  Backend is NOT running"
  echo ""
  echo "  FIX: Open terminal and run:"
  echo "    cd $PROJECT/backend"
  echo "    npm run dev"
fi

# 7. Backend node_modules
echo ""
echo ">>> STEP 7: Backend Dependencies"
if [ -d "$PROJECT/backend/node_modules" ]; then
  echo "  OK  node_modules installed"
else
  echo "  FAIL  Dependencies not installed"
  echo ""
  echo "  FIX: Run:"
  echo "    cd $PROJECT/backend && npm install"
fi

echo ""
echo "=========================================="
echo "  SUMMARY"
echo "=========================================="
echo ""
echo "  If all OK above, do this:"
echo ""
echo "  1. Terminal:"
echo "     cd $PROJECT/backend"
echo "     npm run dev"
echo ""
echo "  2. Chrome:"
echo "     chrome://extensions"
echo "     Developer mode ON"
echo "     Load unpacked → select:"
echo "     $PROJECT/extension"
echo ""
echo "  3. OpenAI key:"
echo "     Extension → Settings → AI Provider → paste key"
echo ""
echo "  4. Test:"
echo "     https://www.tradingview.com/chart/"
echo "     Click ⚡ AI button"
echo ""
echo "=========================================="
