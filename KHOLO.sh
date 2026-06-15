#!/bin/bash
# ═══════════════════════════════════════════════════
#  TradePrompt AI — APP KHOLO (sabse simple)
#  Run: bash KHOLO.sh
# ═══════════════════════════════════════════════════

echo ""
echo "⚡ TradePrompt AI — App khol rahe hain..."
echo ""

# --- folder dhundo ---
PROJECT=""
for DIR in \
  "/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension" \
  "$(dirname "$0")" \
  "$(pwd)"; do
  if [ -f "$DIR/backend/package.json" ]; then
    PROJECT="$DIR"
    break
  fi
done

if [ -z "$PROJECT" ]; then
  echo "❌ Project folder nahi mila!"
  echo ""
  echo "Pehle ye chalao (ek baar):"
  echo "  cd ~ && git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git"
  echo "  bash ClipMInd-AI-extension/KHOLO.sh"
  exit 1
fi

echo "📁 Folder: $PROJECT"
cd "$PROJECT/backend" || exit 1

# --- node check ---
if ! command -v node &>/dev/null; then
  echo "❌ Node.js nahi hai. Install karo:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt install -y nodejs"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# --- install if needed ---
if [ ! -d node_modules ]; then
  echo "📦 npm install (pehli baar)..."
  npm install
fi
[ ! -f .env ] && npm run setup:demo 2>/dev/null

# --- purana band, naya start ---
echo "🛑 Purana server band..."
fuser -k 3001/tcp 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

echo "🚀 Server start..."
nohup node src/server.js > /tmp/tradeprompt.log 2>&1 &
SERVER_PID=$!
sleep 3

# --- check ---
URL1="http://127.0.0.1:3001/app.html"
URL2="http://localhost:3001/app.html"

if curl -sf "$URL1/api/health" >/dev/null 2>&1 || curl -sf "$URL2/api/health" >/dev/null 2>&1; then
  echo "✅ Server chal raha hai!"
else
  echo "⚠️  Server slow start ho raha hai... 5 sec wait"
  sleep 5
  if ! curl -sf "$URL1/api/health" >/dev/null 2>&1; then
    echo "❌ Server start nahi hua. Log dekho:"
    echo "   tail -20 /tmp/tradeprompt.log"
    tail -10 /tmp/tradeprompt.log 2>/dev/null
    exit 1
  fi
fi

# --- browser kholo ---
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  BROWSER MEIN YE ADDRESS BAR MEIN LIKHO (copy):      ║"
echo "║                                                      ║"
echo "║    http://127.0.0.1:3001/app.html                    ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# try every browser
for CMD in xdg-open google-chrome google-chrome-stable chromium chromium-browser firefox sensible-browser; do
  if command -v $CMD &>/dev/null; then
    $CMD "$URL1" 2>/dev/null && echo "✓ Browser khul gaya!" && break
  fi
done

echo ""
echo "Agar browser khud na khule → address copy karo ↑ aur Chrome mein paste karo"
echo "Server band karne ke liye: fuser -k 3001/tcp"
echo ""
