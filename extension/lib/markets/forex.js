/**
 * Forex Market Configuration
 */

export const FOREX_MARKET = {
  id: 'forex',
  name: 'Forex (FX)',
  currency: 'USD',
  timezone: 'UTC',

  sessions: {
    sydney: { start: '22:00', end: '07:00', timezone: 'UTC', volatility: 'low' },
    tokyo: { start: '00:00', end: '09:00', timezone: 'UTC', volatility: 'medium' },
    london: { start: '08:00', end: '17:00', timezone: 'UTC', volatility: 'high' },
    newYork: { start: '13:00', end: '22:00', timezone: 'UTC', volatility: 'high' }
  },

  majorPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  inrPairs: ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR'],

  dataSources: {
    free: {
      tradingView: 'FX symbols on TradingView',
      frankfurter: 'https://api.frankfurter.app/latest',
      exchangerate: 'https://api.exchangerate-api.com/v4/latest/USD'
    },
    paid: {
      oanda: 'https://developer.oanda.com',
      fxcm: 'https://www.fxcm.com/uk/algorithmic-trading/api-trading',
      twelveData: 'https://twelvedata.com'
    }
  },

  regulations: [
    'RBI regulates INR pairs - retail forex trading restricted in India',
    'Only INR-based currency derivatives allowed on NSE/BSE/MCX',
    'International forex via offshore brokers - legal grey area for Indian residents',
    'Leverage limits vary by broker (typically 1:30 to 1:500)'
  ],

  promptContext: {
    bestSessions: 'London-NY overlap (13:00-17:00 UTC) has highest liquidity',
    newsEvents: 'NFP (1st Friday), FOMC, ECB, BOE, RBI policy dates',
    correlations: 'DXY inverse to EUR/USD, Gold correlation with USD/JPY'
  }
};

export const FOREX_PROMPT_TEMPLATES = {
  technicalAnalysis: {
    id: 'forex-ta',
    name: 'Forex Technical Analysis',
    category: 'analysis',
    template: `Analyze {symbol} on {timeframe} for Forex market.

SESSION CONTEXT:
- Active session: {activeSession}
- UTC time: {utcTime}
- Session overlap: {sessionOverlap}

TECHNICAL ANALYSIS:
1. Primary trend on H4/Daily
2. Key support/resistance (previous session high/low, round numbers)
3. RSI divergence, MACD crossover, EMA ribbon
4. Fibonacci retracement of last major swing
5. Candlestick patterns at key levels
6. ATR-based stop loss calculation

FOREX SPECIFICS:
- Spread consideration for entry timing
- News calendar impact (next 24h high-impact events)
- Correlation with DXY/Gold/Oil if relevant
- Session-based volatility expectation

Provide: Bias (Bullish/Bearish/Neutral), Entry, SL, TP1, TP2, TP3 with pips count.`
  },

  sessionStrategy: {
    id: 'forex-session',
    name: 'Session-Based Strategy',
    category: 'strategy',
    template: `Generate session-based trading plan for {symbol}.

CURRENT SESSION: {activeSession}
NEXT HIGH-IMPACT NEWS: {nextNews}

SESSION STRATEGY:
1. Asian range identification (for London breakout)
2. London open momentum plays
3. NY open reversal/continuation patterns
4. End-of-day positioning

Analyze:
- Previous session range and breakout levels
- Institutional order flow zones
- Fair value gaps (if applicable)
- Liquidity pools above/below key levels

Risk: Max 1% per trade, 3% daily drawdown limit.`
  },

  usdInr: {
    id: 'forex-usdinr',
    name: 'USD/INR Analysis (RBI Regulated)',
    category: 'inr',
    template: `Analyze USD/INR for Indian regulated trading context.

MARKET: {marketStatus} (IST: {istTime})
RBI REFERENCE RATE: Check latest RBI reference rate

ANALYSIS:
1. RBI intervention zones (psychological levels: 83, 84, 85)
2. FII flow correlation with INR movement
3. Crude oil price impact on INR
4. US Fed vs RBI rate differential
5. NSE currency derivatives (CDS segment) setup
6. Monthly RBI policy impact

Note: Only trade via NSE/BSE/MCX currency derivatives as Indian resident.
Provide CDS futures/options strategy if applicable.`
  }
};

export function getActiveForexSession() {
  const now = new Date();
  const utcHours = now.getUTCHours();

  if (utcHours >= 22 || utcHours < 7) return 'Sydney/Tokyo (Asian)';
  if (utcHours >= 8 && utcHours < 13) return 'London (European)';
  if (utcHours >= 13 && utcHours < 17) return 'London-NY Overlap (Highest Volatility)';
  if (utcHours >= 17 && utcHours < 22) return 'New York (American)';
  return 'Off-peak';
}

export function getSessionOverlap() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  if (utcHours >= 13 && utcHours < 17) return 'London-NY Overlap — HIGH liquidity';
  if (utcHours >= 8 && utcHours < 9) return 'Sydney-London transition';
  if (utcHours >= 0 && utcHours < 1) return 'Tokyo-Sydney overlap';
  return 'No major overlap';
}
