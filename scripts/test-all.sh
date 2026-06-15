#!/bin/bash
# TradePrompt AI — Full E2E test suite
# Exit 0 = all pass (APPROVED)

set -e
FAIL=0
PASS=0
BASE="http://127.0.0.1:3001"

pass() { PASS=$((PASS+1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

echo ""
echo "═══════════════════════════════════════"
echo "  TradePrompt AI — Full Test Suite"
echo "═══════════════════════════════════════"
echo ""

# --- 1. Files exist ---
echo "[1] Required files"
for f in \
  backend/src/server.js backend/src/ai-service.js backend/src/market-data.js backend/src/smart-analysis.js \
  backend/public/app.html backend/public/checkout.html backend/public/open.html \
  extension/manifest.json extension/lib/ai-client.js extension/lib/messaging.js \
  KHOLO.sh START_ALL.sh \
  extension/assets/icons/icon48.png; do
  [ -f "$f" ] && pass "$f" || fail "MISSING: $f"
done

# --- 2. Extension icons ---
echo ""
echo "[2] Extension icons"
for s in 16 32 48 128; do
  [ -f "extension/assets/icons/icon${s}.png" ] && pass "icon${s}.png" || fail "icon${s}.png"
done

# --- 3. Manifest valid JSON ---
echo ""
echo "[3] Manifest"
node -e "JSON.parse(require('fs').readFileSync('extension/manifest.json'))" 2>/dev/null && pass "manifest.json valid" || fail "manifest.json invalid"

# --- 4. Start server ---
echo ""
echo "[4] Backend server"
fuser -k 3001/tcp 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1
cd backend
[ -d node_modules ] || npm install --silent
[ -f .env ] || npm run setup:demo --silent
node src/server.js &
SERVER_PID=$!
cd ..
sleep 3

for i in 1 2 3 4 5 6 7 8 9 10; do
  curl -sf "$BASE/api/health" >/dev/null && break
  sleep 1
done

HEALTH=$(curl -sf "$BASE/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  pass "GET /api/health"
else
  fail "GET /api/health"
fi

# --- 5. Pages load ---
echo ""
echo "[5] HTML pages"
for page in /app.html /checkout.html /open.html /; do
  CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE$page" 2>/dev/null)
  [ "$CODE" = "200" ] || [ "$CODE" = "302" ] && pass "$page ($CODE)" || fail "$page ($CODE)"
done

# --- 6. Analyze API ---
echo ""
echo "[6] Analyze API (live data)"
ANALYZE=$(curl -sf -X POST "$BASE/api/analyze" \
  -H 'Content-Type: application/json' \
  -d '{"user":"Analyze RELIANCE on 15m","symbol":"RELIANCE","market":"india","timeframe":"15m"}')

echo "$ANALYZE" | grep -q '"success":true' && pass "analyze success=true" || fail "analyze success"
echo "$ANALYZE" | grep -q 'RELIANCE' && pass "analyze correct symbol" || fail "analyze symbol"
echo "$ANALYZE" | grep -q '15m' && pass "analyze correct timeframe" || fail "analyze timeframe"
echo "$ANALYZE" | grep -q 'Spot' && pass "analyze has spot price" || fail "analyze spot"
echo "$ANALYZE" | grep -q 'AI Error' && fail "analyze contains error text" || pass "no error in output"
echo "$ANALYZE" | grep -q 'API key not configured' && fail "api key error in output" || pass "no api key error"

# BTC test
BTC=$(curl -sf -X POST "$BASE/api/analyze" \
  -H 'Content-Type: application/json' \
  -d '{"user":"Analyze BTC/USDT on 15m","symbol":"BTC/USDT","market":"crypto","timeframe":"15m"}')
echo "$BTC" | grep -q 'BTC/USDT' && pass "crypto symbol" || fail "crypto symbol"
echo "$BTC" | grep -q 'Crypto' && pass "crypto market label" || fail "crypto market"

# EUR/USD test
FX=$(curl -sf -X POST "$BASE/api/analyze" \
  -H 'Content-Type: application/json' \
  -d '{"user":"Analyze EUR/USD on 4h","symbol":"EUR/USD","market":"forex","timeframe":"4h"}')
echo "$FX" | grep -q 'EUR/USD' && pass "forex symbol" || fail "forex symbol"
echo "$FX" | grep -q 'Forex' && pass "forex market" || fail "forex market"

# --- 7. Subscribe (never fail) ---
echo ""
echo "[7] Subscribe / checkout"
SUB=$(curl -sf -X POST "$BASE/api/subscribe" \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@approved.com"}')
echo "$SUB" | grep -q '"success":true' && pass "subscribe success" || fail "subscribe"
echo "$SUB" | grep -q 'licenseKey' && pass "subscribe licenseKey" || fail "subscribe licenseKey"
echo "$SUB" | grep -q 'failed' && fail "subscribe contains failed" || pass "subscribe no failure text"

DEMO=$(curl -sf -X POST "$BASE/api/demo-activate" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@approved.com"}')
echo "$DEMO" | grep -q 'licenseKey' && pass "demo-activate" || fail "demo-activate"

# --- 8. Market data ---
echo ""
echo "[8] Market context"
CTX=$(curl -sf -X POST "$BASE/api/market-context" \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"RELIANCE","market":"india","timeframe":"15m"}')
echo "$CTX" | grep -q 'spotPrice' && pass "market-context spotPrice" || fail "market-context"

# --- Cleanup ---
kill $SERVER_PID 2>/dev/null || fuser -k 3001/tcp 2>/dev/null || true

echo ""
echo "═══════════════════════════════════════"
echo "  RESULT: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
  echo ""
  echo "  ✅ APPROVED — ready for user"
  echo ""
  exit 0
else
  echo ""
  echo "  ❌ NOT APPROVED — fix $FAIL issue(s)"
  echo ""
  exit 1
fi
