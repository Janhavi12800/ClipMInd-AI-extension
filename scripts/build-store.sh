#!/bin/bash
# Build Chrome Web Store zip with your deployed API URL baked in.
# Usage: bash scripts/build-store.sh https://tradeprompt-api.onrender.com
set -e

API_URL="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_FILE="$ROOT/extension/lib/deploy-config.js"
VERSION=$(node -p "require('$ROOT/extension/manifest.json').version")
OUTPUT="$ROOT/dist/tradeprompt-ai-store-v${VERSION}.zip"

if [ -z "$API_URL" ]; then
  echo "Usage: bash scripts/build-store.sh https://YOUR-API.onrender.com"
  echo ""
  echo "Deploy backend first (free):"
  echo "  1. https://render.com → New Web Service → connect GitHub repo"
  echo "  2. Root directory: backend"
  echo "  3. Copy your Render URL and run this script again"
  exit 1
fi

API_URL="${API_URL%/}"
echo "⚡ Building store zip with API: $API_URL"

cat > "$DEPLOY_FILE" << EOF
/**
 * Baked at build time — $(date -Iseconds)
 */
export const DEPLOY_API_URL = '$API_URL';
EOF

mkdir -p "$ROOT/dist"
rm -f "$OUTPUT"

cd "$ROOT/extension"
zip -r "$OUTPUT" . -x "*.DS_Store" -x "__MACOSX/*" >/dev/null

# Reset deploy config for local dev
cat > "$DEPLOY_FILE" << 'EOF'
/**
 * Baked at build time by scripts/build-store.sh
 */
export const DEPLOY_API_URL = '';
EOF

echo "✓ Store zip: $OUTPUT"
echo "  Upload: https://chrome.google.com/webstore/devconsole"
echo "  Privacy URL: $API_URL/privacy.html"
echo "  Checkout URL: $API_URL/checkout.html"
