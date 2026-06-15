#!/bin/bash
# Build extension zip for Chrome Web Store submission
set -e

VERSION=$(node -p "require('./extension/manifest.json').version" 2>/dev/null || echo "1.0.0")
OUTPUT="dist/tradeprompt-ai-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUTPUT"

cd extension
zip -r "../$OUTPUT" . \
  -x "*.DS_Store" \
  -x "__MACOSX/*"

cd ..
echo "✓ Built: $OUTPUT"
echo "  Upload to: https://chrome.google.com/webstore/devconsole"
