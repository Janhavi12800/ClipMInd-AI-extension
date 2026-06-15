/**
 * Smart analysis — uses real market data when available
 */

function fmtPrice(price, market, currency) {
  if (!price && price !== 0) return 'N/A';
  if (market === 'forex') return Number(price).toFixed(4);
  if (market === 'crypto') return '$' + Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return '₹' + Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function calcLevels(spot, atrRaw, market) {
  const atr = parseFloat(String(atrRaw).replace(/[^\d.]/g, '')) || spot * (market === 'forex' ? 0.003 : 0.02);
  const dec = market === 'forex' ? 4 : 2;
  const s = Number(spot);
  return {
    support: (s - atr).toFixed(dec),
    resistance: (s + atr).toFixed(dec),
    sl: (s - atr * 1.2).toFixed(dec),
    target1: (s + atr * 1.5).toFixed(dec),
    target2: (s + atr * 2.5).toFixed(dec),
    atr: atr.toFixed(dec)
  };
}

export function generateSmartAnalysis(prompt = {}, meta = {}) {
  const user = prompt.user || '';
  const symbol = meta.symbol || extractSymbol(user) || 'NIFTY';
  const timeframe = meta.timeframe || extractTimeframe(user) || '15m';
  const market = meta.market || detectMarket(user) || 'india';
  const spot = meta.spotPrice;
  const spotStr = fmtPrice(spot, market, meta.currency);
  const change = meta.change || meta.change24h || 'N/A';
  const atr = meta.atr ? String(meta.atr).replace(/\s*\(.*\)/, '') : null;
  const range = meta.recentRange || 'N/A';
  const iv = meta.ivPercentile || (market === 'india' ? 'Check India VIX' : 'N/A');
  const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const marketLabel = { india: '🇮🇳 India NSE/BSE', forex: '💱 Forex', crypto: '₿ Crypto' }[market] || market;

  const levels = spot ? calcLevels(spot, atr, market) : null;
  const isVolatility = /volatility/i.test(user);

  if (isVolatility) {
    return `📊 VOLATILITY ANALYSIS — ${symbol} (${timeframe})
🕐 IST: ${ist} | Market: ${marketLabel}
💰 Spot: ${spotStr} | Change: ${change}

📈 BIAS: ${spot ? 'Analyze breakout vs range-bound' : 'Neutral — confirm on chart'}

DATA:
• ATR (14): ${atr || levels?.atr || 'add ATR indicator on chart'} ${timeframe}
• 20-bar range: ${range}
• IV / Fear: ${iv}

WHEN: Session open 9:15–10:00 IST | Close 3:00–3:30 IST
HOW MUCH: Expected move ≈ 0.8–1.5× ATR (${levels?.atr || 'see chart'})
STRATEGY: Breakout if close outside ${range} with volume | Fade if rejection at extremes

📉 CONFIDENCE: 7/10
💡 Plan before market open. No setup = no trade.

⚠️ Educational only. Data: ${meta.source || 'Yahoo Finance'}`;
  }

  const sLine = levels
    ? `• Support: ${levels.support} (recent low zone)
• Resistance: ${levels.resistance} (recent high zone)
• Entry: ${spotStr} pullback to EMA21 OR breakout above ${levels.resistance}
• Stop Loss: ${levels.sl} (1.2× ATR)
• Target 1: ${levels.target1} (R:R 1:1.5)
• Target 2: ${levels.target2} (R:R 1:2.5)`
    : `• Support: previous day low / recent swing low
• Resistance: previous day high / recent swing high
• Entry: pullback to EMA21 on ${timeframe}
• Stop Loss: 1× ATR below entry
• Target 1 & 2: 1.5× and 2.5× risk`;

  const marketTips = {
    india: '• NSE session 9:15–3:30 IST | Square intraday before 3:20 PM\n• Check FII/DII flow & sector trend',
    forex: `• Active session: ${meta.session || 'check London/NY overlap'}\n• Use pip-based stops | Watch USD strength`,
    crypto: '• 24/7 market | Watch BTC correlation\n• India: 30% tax + 1% TDS on gains'
  };

  const changeStr = String(change || 'N/A');
  const bias = changeStr.includes('-') ? 'Bearish lean'
    : changeStr.includes('+') || (parseFloat(changeStr) > 0) ? 'Bullish lean' : 'Neutral';

  return `📊 TECHNICAL ANALYSIS — ${symbol} (${timeframe})
🕐 IST: ${ist} | Market: ${marketLabel}
💰 Spot: ${spotStr} | Change: ${changeStr}
📏 ATR: ${atr || levels?.atr || 'N/A'} | Range: ${range}

📈 BIAS: ${bias} — confirm on chart

🎯 LEVELS:
${sLine}

📉 TREND (${timeframe}):
• Higher TF (1H/1D): trade with dominant trend
• RSI 40–60 pullback zone | MACD histogram direction
• VWAP: intraday bias anchor

${marketTips[market] || ''}

⚠️ INVALIDATION: ${levels ? `Close below ${levels.support} on ${timeframe}` : `Break of key support on ${timeframe}`}

📉 CONFIDENCE: ${spot ? '7' : '6'}/10
💡 Trade with trend. Risk max 1% per trade.

⚠️ Educational only. Live data: ${meta.source || 'Yahoo Finance'}${meta.demo ? ' | Add OPENAI_API_KEY for GPT analysis' : ''}`;
}

function extractSymbol(user) {
  const m = user.match(/Analyze\s+([A-Z0-9./\-]+)\s+on/i);
  if (m) return m[1];
  const m2 = user.match(/(?:setup|analysis|trade)\s+for\s+([A-Z0-9./\-]+)\s+on/i);
  if (m2) return m2[1];
  return null;
}

function extractTimeframe(user) {
  const m = user.match(/\bon\s+(\d+[mhdw]|\d+\s*min|1D|4h|1h|15m|5m)\b/i);
  return m ? m[1] : null;
}

function detectMarket(user) {
  if (/forex|EUR|USD\/|GBP|pip/i.test(user)) return 'forex';
  if (/crypto|BTC|ETH|USDT/i.test(user)) return 'crypto';
  if (/NSE|BSE|IST|Indian|₹|F&O|intraday.*3:20/i.test(user)) return 'india';
  return null;
}
