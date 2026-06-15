#!/bin/bash
# TradePrompt AI — EK COMMAND, SAB KUCH AUTO (zero errors)
# Run: bash START_ALL.sh

BASE="https://raw.githubusercontent.com/Janhavi12800/ClipMInd-AI-extension/main"

for DIR in \
  "/home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension/ClipMInd-AI-extension-main" \
  "$HOME/ClipMInd-AI-extension" \
  "$(cd "$(dirname "$0")" 2>/dev/null && pwd)" \
  "$(pwd)"; do
  [ -f "$DIR/backend/package.json" ] && PROJECT="$DIR" && break
done

if [ -z "$PROJECT" ]; then
  PROJECT="$HOME/ClipMInd-AI-extension"
  git clone --depth 1 https://github.com/Janhavi12800/ClipMInd-AI-extension.git "$PROJECT" 2>/dev/null || true
fi

cd "$PROJECT" || exit 1
echo ""
echo "⚡ TradePrompt AI — Auto Start"
echo "📁 $PROJECT"
echo ""

echo "📥 Syncing latest code..."
mkdir -p backend/src backend/public extension/lib extension/background extension/sidepanel extension/assets/icons
FILES=(
  backend/src/server.js backend/src/ai-service.js backend/src/smart-analysis.js backend/src/market-data.js
  backend/public/app.html backend/public/checkout.html
  extension/lib/ai-client.js extension/lib/license.js extension/lib/market-data.js extension/lib/messaging.js
  extension/background/service-worker.js extension/sidepanel/sidepanel.js extension/popup/popup.js extension/options/options.js
  extension/manifest.json START_ALL.sh
)
for f in "${FILES[@]}"; do
  curl -fsSL "$BASE/$f" -o "$f" 2>/dev/null || true
done

python3 -c "
from PIL import Image, ImageDraw
import os
d='extension/assets/icons'; os.makedirs(d, exist_ok=True)
for s in [16,32,48,128]:
 img=Image.new('RGBA',(s,s),(99,102,241,255))
 ImageDraw.Draw(img).polygon([(s//2,s//8),(s*3//4,s//2),(s//2,s*7//8)],fill=(250,204,21,255))
 img.save(f'{d}/icon{s}.png')
" 2>/dev/null || true

sed -i '/default_locale/d' extension/manifest.json 2>/dev/null || true

cd backend
npm install --silent 2>/dev/null || npm install
[ ! -f .env ] && npm run setup:demo
touch .env
grep -q '^DEMO_MODE=' .env && sed -i 's/^DEMO_MODE=.*/DEMO_MODE=true/' .env || echo 'DEMO_MODE=true' >> .env

fuser -k 3001/tcp 2>/dev/null || lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1
nohup node src/server.js > /tmp/tradeprompt.log 2>&1 &

for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf http://localhost:3001/api/health >/dev/null && OK=1 && break
  sleep 1
done

URL="http://127.0.0.1:3001/app.html"
echo ""
if [ "$OK" = "1" ]; then
  echo "✅ Backend ready!"
else
  echo "⚠️  Try: bash KHOLO.sh"
fi
echo ""
echo "  ══════════════════════════════════════"
echo "  BROWSER MEIN YE PASTE KARO:"
echo "  $URL"
echo "  ══════════════════════════════════════"
echo ""
for CMD in xdg-open google-chrome google-chrome-stable chromium firefox; do
  command -v $CMD &>/dev/null && $CMD "$URL" 2>/dev/null && break
done
