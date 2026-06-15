#!/bin/bash
# TradePrompt AI — Ek command mein sab fix
# Run: bash FIX_NOW.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "⚡ TradePrompt AI — Fixing..."
echo "   Folder: $DIR"
echo ""

# 1. Fix manifest.json — remove default_locale
MANIFEST="$DIR/extension/manifest.json"
if [ -f "$MANIFEST" ]; then
  sed -i '/default_locale/d' "$MANIFEST"
  # Add tabs permission if missing
  if ! grep -q '"tabs"' "$MANIFEST"; then
    sed -i 's/"scripting"/"scripting",\n    "tabs"/' "$MANIFEST"
  fi
  echo "✓ manifest.json fixed"
else
  echo "✗ manifest.json not found!"
  exit 1
fi

# 2. Fix onboarding.html — write fixed version
cat > "$DIR/extension/onboarding/onboarding.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome — TradePrompt AI</title>
  <link rel="stylesheet" href="../assets/styles.css">
  <style>
    body { max-width: 520px; margin: 0 auto; min-height: 100vh; }
    .hero { text-align: center; padding: 32px 24px 16px; }
    .hero .logo { font-size: 56px; margin-bottom: 8px; }
    .hero h1 { font-size: 26px; margin-bottom: 8px; }
    .hero p { color: var(--tp-text-muted); font-size: 14px; }
    .step { display: flex; gap: 14px; padding: 14px 24px; align-items: flex-start; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .step h3 { font-size: 15px; margin-bottom: 4px; }
    .step p { font-size: 13px; color: #94a3b8; }
    .cta { padding: 24px; }
    .trial-box { background: rgba(99,102,241,0.1); border: 1px solid #6366f1; border-radius: 10px; padding: 16px; text-align: center; margin: 0 24px 16px; }
    .trial-box strong { color: #6366f1; font-size: 18px; }
    .status { text-align: center; font-size: 13px; color: #10b981; min-height: 20px; margin-top: 10px; }
    .tp-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; margin-bottom: 8px; text-decoration: none; }
    .tp-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    .tp-btn-secondary { background: #334155; color: #f1f5f9; border: 1px solid #475569; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="logo">⚡</div>
    <h1>Welcome to TradePrompt AI</h1>
    <p>Professional AI trading prompts for Indian stocks, Forex & Crypto</p>
  </div>
  <div class="trial-box">
    <strong>🎉 3-Day Free Trial Activated!</strong>
    <p style="font-size:13px;color:#94a3b8;margin-top:6px">All Pro features unlocked. No credit card needed.</p>
  </div>
  <div class="step"><div class="step-num">1</div><div><h3>Add Your AI API Key</h3><p>Settings → AI Provider → OpenAI or Claude key</p></div></div>
  <div class="step"><div class="step-num">2</div><div><h3>Open TradingView</h3><p>Any chart — NSE, BSE, Forex, Crypto</p></div></div>
  <div class="step"><div class="step-num">3</div><div><h3>Click ⚡ AI Button</h3><p>Select template for 1-click analysis</p></div></div>
  <div class="step"><div class="step-num">4</div><div><h3>Get Analysis</h3><p>AI gives Entry, SL, Targets</p></div></div>
  <div class="cta">
    <button type="button" class="tp-btn tp-btn-primary" id="btnSettings">⚙️ Open Settings & Add API Key</button>
    <a class="tp-btn tp-btn-secondary" id="btnTV" href="https://www.tradingview.com/chart/" target="_blank">📊 Open TradingView</a>
    <button type="button" class="tp-btn tp-btn-secondary" id="btnSkip">✓ Done — Close This Tab</button>
    <div class="status" id="status"></div>
  </div>
  <script>
    const s = document.getElementById('status');
    function done(msg) { chrome.storage.local.set({tp_onboardingComplete:true}); if(msg) s.textContent=msg; }
    document.getElementById('btnSettings').onclick = function() {
      done('✓ Settings khul gayi — API key paste karo');
      chrome.runtime.openOptionsPage(function(){
        if(chrome.runtime.lastError) window.open(chrome.runtime.getURL('options/options.html#ai'),'_blank');
      });
    };
    document.getElementById('btnTV').onclick = function() { done('✓ TradingView khula — ⚡ AI button dhundo'); };
    document.getElementById('btnSkip').onclick = function() { done('✓ Extension toolbar mein ⚡ icon dabao'); };
  </script>
</body>
</html>
HTMLEOF
echo "✓ onboarding.html fixed (buttons ab kaam karenge)"

# 3. Backend check
if curl -s http://localhost:3001/api/health &>/dev/null; then
  echo "✓ Backend already running (localhost:3001)"
else
  echo "→ Backend start karo: cd $DIR/backend && npm run dev"
fi

echo ""
echo "============================================"
echo "  ✅ FIX COMPLETE!"
echo "============================================"
echo ""
echo "AB SIRF YE 2 KAAM:"
echo ""
echo "  1. Chrome → chrome://extensions"
echo "     TradePrompt AI → 🔄 RELOAD dabao"
echo ""
echo "  2. Puzzle icon 🧩 → TradePrompt AI → Options"
echo "     AI Provider → OpenAI key paste → Save"
echo ""
echo "  3. tradingview.com/chart → ⚡ AI button"
echo ""
