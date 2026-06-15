#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0; PASS=0; BASE="http://127.0.0.1:3001"
pass(){ PASS=$((PASS+1)); echo "  ✓ $1"; }
fail(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }

echo "[test] Starting server..."
fuser -k 3001/tcp 2>/dev/null || true
cd backend
[ -d node_modules ] || npm install --silent
node src/server.js &
cd ..
sleep 3

ANALYZE=$(curl -sf -X POST "$BASE/api/analyze" -H 'Content-Type: application/json' \
  -d '{"user":"Should I buy YESBANK?","symbol":"YESBANK","market":"india","timeframe":"1D"}')

echo "$ANALYZE" | grep -q '"success":true' && pass "analyze ok" || fail "analyze"
echo "$ANALYZE" | grep -q 'ADVICE:' && pass "advice block" || fail "advice block"
echo "$ANALYZE" | grep -q '"actionHi"' && pass "verdict json" || fail "verdict json"
echo "$ANALYZE" | grep -q 'KHAREED' && pass "hindi advice" || fail "hindi advice"

fuser -k 3001/tcp 2>/dev/null || true
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
