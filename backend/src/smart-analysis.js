/**
 * Smart analysis fallback — works without OpenAI API key (no errors for user)
 */

function extractField(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export function generateSmartAnalysis(prompt = {}) {
  const user = prompt.user || '';
  const symbol = extractField(user, [
    /Symbol:\s*([^\n]+)/i,
    /Analyze[^\n]*for\s+([A-Z0-9/.\-]+)/i,
    /for\s+([A-Z][A-Z0-9/.\-]{1,20})/i
  ]) || 'NIFTY';

  const timeframe = extractField(user, [/Timeframe:\s*([^\n]+)/i, /on\s+(\d+[mhdwMHDW]|\d+\s*min)/i]) || '15m';
  const atr = extractField(user, [/ATR:\s*([^\n]+)/i]) || 'use 14-period ATR from chart';
  const range = extractField(user, [/Recent range[^:]*:\s*([^\n]+)/i, /range[^:]*:\s*([\d.,\s\-]+)/i]) || 'previous session high/low';
  const iv = extractField(user, [/IV[^:]*:\s*([^\n]+)/i]) || 'India VIX for index trades';
  const spot = extractField(user, [/Spot:\s*([^\n]+)/i]) || 'current market price';
  const market = extractField(user, [/Market:\s*([^\n]+)/i]) || 'india';

  const isVolatility = /volatility/i.test(user);
  const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (isVolatility) {
    return `📊 VOLATILITY ANALYSIS — ${symbol} (${timeframe})
🕐 IST: ${ist} | Market: ${market}

📈 BIAS: Neutral-to-cautious (wait for confirmation before aggressive entries)

WHEN (timing):
• Indian session open (9:15–10:00 AM IST) — highest intraday volatility window
• 3:00–3:30 PM IST — closing volatility & F&O rollover effects
• Watch economic calendar & global cues (US futures, crude)

HOW MUCH (expected move):
• ATR reference: ${atr}
• Recent range: ${range}
• IV / fear gauge: ${iv}
• Rule: Expected move ≈ 0.5–1.5× ATR for intraday; wider for swing

HOW (direction):
• Breakout play if price closes outside range with volume
• Mean reversion if price rejects range extremes + RSI divergence
• Avoid straddles if IV already elevated

WHY (catalysts):
• Index level reactions at round numbers & previous day H/L
• Sector leadership (Bank Nifty vs Nifty for index trades)
• FII/DII flow & global risk sentiment

🎯 ACTION PLAN:
1. Mark PDH, PDL, and opening range (first 15 min)
2. SL = 1× ATR beyond invalidation
3. Target = 1.5–2× risk minimum
4. If no clear setup → NO TRADE (capital preservation)

📉 CONFIDENCE: 6/10
💡 KEY INSIGHT: Volatility expands at session edges — plan entries before 9:15 AM, not during chaos.

⚠️ Educational analysis only. Verify on your chart before trading.`;
  }

  return `📊 TECHNICAL ANALYSIS — ${symbol} (${timeframe})
🕐 IST: ${ist} | Spot: ${spot} | Market: ${market}

📈 BIAS: Neutral (analyze trend on chart before entry)

🎯 LEVELS:
• Support: recent swing low / previous day low
• Resistance: recent swing high / previous day high
• Entry: pullback to EMA21 or breakout above resistance with volume
• Stop Loss: below support or 1× ATR (${atr})
• Target 1: 1:1.5 R:R | Target 2: 1:2 R:R

📉 TREND:
• Check higher timeframe (1H/1D) for direction
• ${timeframe} for precise entry timing
• Confluence: RSI (40–60 zone for pullback), MACD histogram, VWAP (intraday)

⚠️ INVALIDATION: Close below key support on ${timeframe}

📉 CONFIDENCE: 6/10
💡 KEY INSIGHT: Trade with the higher-timeframe trend — counter-trend scalps need tighter stops.

⚠️ Educational only. Not financial advice. Cross-check all levels on TradingView.`;
}
