/**
 * Cryptocurrency Market Configuration
 */

export const CRYPTO_MARKET = {
  id: 'crypto',
  name: 'Cryptocurrency',
  currency: 'USD',
  timezone: 'UTC',

  sessions: {
    note: '24/7 market - no session close',
    highVolatility: ['US market hours 14:00-22:00 UTC', 'Asian morning 00:00-04:00 UTC']
  },

  majorCoins: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX'],
  indianExchanges: ['WazirX', 'CoinDCX', 'ZebPay', 'Bitbns'],

  dataSources: {
    free: {
      coingecko: 'https://api.coingecko.com/api/v3',
      binance: 'https://api.binance.com/api/v3',
      coinmarketcap: 'https://pro-api.coinmarketcap.com/v1'
    },
    onChain: {
      glassnode: 'https://glassnode.com',
      cryptoQuant: 'https://cryptoquant.com',
      etherscan: 'https://api.etherscan.io'
    }
  },

  regulations: [
    '30% tax on crypto gains in India (Section 115BBH)',
    '1% TDS on crypto transfers (Section 194S)',
    'No offset of losses against other income',
    'VDA reporting required in ITR',
    'FEMA regulations may apply for offshore exchange usage'
  ],

  promptContext: {
    taxImpact: 'Factor 30% flat tax + 1% TDS in profit calculations',
    volatility: 'Crypto moves 3-10% daily - adjust position sizing',
    weekends: 'Often lower volume on weekends',
    events: 'Bitcoin halving, ETF approvals, regulatory news'
  }
};

export const CRYPTO_PROMPT_TEMPLATES = {
  technicalAnalysis: {
    id: 'crypto-ta',
    name: 'Crypto Technical Analysis',
    category: 'analysis',
    template: `Analyze {symbol} on {timeframe} for cryptocurrency market.

MARKET CONTEXT:
- BTC dominance: {btcDominance}%
- Fear & Greed Index: {fearGreed}
- 24h volume: {volume24h}
- Market cap rank: {marketCapRank}

TECHNICAL ANALYSIS:
1. Trend structure (HH/HL or LH/LL)
2. Key support/resistance (previous ATH, round numbers, weekly open)
3. RSI, MACD, Bollinger Bands squeeze/expansion
4. Volume analysis (accumulation vs distribution)
5. Funding rate sentiment (if perpetual futures)
6. On-chain metrics if available (exchange inflow/outflow)

CRYPTO SPECIFICS:
- Correlation with BTC (beta analysis)
- Liquidation levels and heatmap zones
- Upcoming token unlocks or events
- Indian tax impact: 30% on gains, 1% TDS

Provide: Bias, Entry zone, SL, TP levels with % targets.
Include position size for {riskPercent}% portfolio risk.`
  },

  btcDominance: {
    id: 'crypto-btc-d',
    name: 'BTC Dominance Analysis',
    category: 'macro',
    template: `Analyze current BTC dominance and altcoin implications.

BTC DOMINANCE: {btcDominance}%
TREND: {dominanceTrend}

ANALYZE:
1. Rising dominance = risk-off, altcoin weakness
2. Falling dominance = altseason potential
3. Historical dominance levels (40%, 50%, 60%)
4. ETH/BTC ratio implications
5. Sector rotation within crypto (DeFi, L1, Meme, AI)

Recommend: BTC-heavy, altcoin, or stablecoin allocation strategy.`
  },

  indianTax: {
    id: 'crypto-tax-in',
    name: 'Indian Crypto Tax-Aware Trade',
    category: 'tax',
    template: `Analyze {symbol} trade with Indian tax implications.

TRADE SETUP on {timeframe}:
[Standard technical analysis]

INDIAN TAX CALCULATION:
- Entry price: {entryPrice}
- Target price: {targetPrice}
- Gross profit: {grossProfit}%
- Tax @ 30%: {taxAmount}
- TDS @ 1%: {tdsAmount}
- Net profit after tax: {netProfit}%

Only recommend trade if net R:R after 30% tax is > 1:2.
Consider holding period - no long-term benefit in India for crypto.`
  }
};

export async function fetchCryptoData(symbol = 'bitcoin') {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd,inr&include_24hr_change=true&include_24hr_vol=true`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.value || null;
  } catch {
    return null;
  }
}
