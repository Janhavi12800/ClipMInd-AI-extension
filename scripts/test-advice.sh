#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0; PASS=0; BASE="http://127.0.0.1:3001"
pass(){ PASS=$((PASS+1)); echo "  ✓ $1"; }
fail(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }

fuser -k 3001/tcp 2>/dev/null || true
cd backend && [ -d node_modules ] || npm install --silent
node src/server.js &
cd ..
sleep 3

# Symbol alias
ALIAS=$(curl -sf -X POST "$BASE/api/advice" -H 'Content-Type: application/json' \
  -d '{"symbol":"yes bank","market":"india","timeframe":"1D"}')
echo "$ALIAS" | grep -q '"symbol":"YESBANK"' && pass "yes bank → YESBANK" || fail "symbol alias"

# Advice endpoint
echo "$ALIAS" | grep -q '"actionHi"' && pass "advice verdict" || fail "advice verdict"
echo "$ALIAS" | grep -q 'multiTimeframe' && pass "multi-timeframe" || fail "multi-timeframe"

# Quote API
QUOTE=$(curl -sf "$BASE/api/quote?symbol=RELIANCE&market=india")
echo "$QUOTE" | grep -q '"price"' && pass "live quote" || fail "live quote"

# Analyze still works
AN=$(curl -sf -X POST "$BASE/api/analyze" -H 'Content-Type: application/json' \
  -d '{"user":"buy?","symbol":"YESBANK","market":"india","timeframe":"1D"}')
echo "$AN" | grep -q 'ADVICE:' && pass "analyze advice block" || fail "analyze block"

fuser -k 3001/tcp 2>/dev/null || true
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "✅ APPROVED" && exit 0 || exit 1
