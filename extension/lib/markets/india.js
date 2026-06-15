/**
 * Indian Stock Market (NSE/BSE) Configuration
 * Market hours, rules, data sources, and prompt templates
 */

export const INDIA_MARKET = {
  id: 'india',
  name: 'Indian Stock Market',
  exchanges: ['NSE', 'BSE', 'NFO', 'BFO', 'CDS', 'MCX'],
  currency: 'INR',
  timezone: 'Asia/Kolkata',

  sessions: {
    preOpen: { start: '09:00', end: '09:08' },
    normal: { start: '09:15', end: '15:30' },
    postClose: { start: '15:40', end: '16:00' },
    muhurat: { note: 'Diwali special session - check NSE calendar' }
  },

  segments: {
    equity: { lotSize: 1, tickSize: 0.05, settlement: 'T+1' },
    fno: { lotSize: 'contract-specific', expiry: 'last Thursday of month' },
    currency: { pairs: ['USDINR', 'EURINR', 'GBPINR', 'JPYINR'] }
  },

  circuitLimits: {
    equity: { upper: 20, lower: 20, note: 'Daily price band varies by stock' },
    index: { upper: 10, lower: 10 }
  },

  dataSources: {
    primary: {
      nse: 'https://www.nseindia.com/api',
      bse: 'https://api.bseindia.com',
      tradingView: 'NSE/BSE symbols via TradingView'
    },
    free: {
      yahoo: 'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}.NS',
      nsePython: 'nsetools / nsepy libraries'
    },
    paid: {
      trueData: 'https://truedata.in',
      globalDataFeeds: 'https://globaldatafeeds.in',
      upstox: 'https://upstox.com/developer/api-documentation'
    }
  },

  regulations: [
    'SEBI margin requirements apply for F&O',
    'Peak margin reporting mandatory',
    'ASM/GSM stocks have restricted trading',
    'T+1 settlement for equity',
    'STT, GST, and stamp duty on trades'
  ],

  keyIndices: ['NIFTY 50', 'NIFTY BANK', 'SENSEX', 'NIFTY IT', 'NIFTY MIDCAP'],

  promptContext: {
    marketOpen: 'Indian market operates 9:15 AM - 3:30 PM IST (Mon-Fri)',
    volatility: 'Higher volatility during first/last 30 minutes',
    events: 'RBI policy, Union Budget, earnings season (Jan-Mar, Jul-Sep)',
    fiiDii: 'Track FII/DII flow data for market direction'
  }
};

export const INDIA_PROMPT_TEMPLATES = {
  technicalAnalysis: {
    id: 'india-ta',
    name: 'NSE/BSE Technical Analysis',
    category: 'analysis',
    template: `Analyze this {symbol} chart on {timeframe} for Indian market (NSE/BSE).

MARKET CONTEXT:
- Current IST time: {currentTime}
- Market status: {marketStatus}
- Exchange: {exchange}
- Segment: {segment}

TECHNICAL ANALYSIS REQUIRED:
1. Trend direction (primary & secondary)
2. Key support/resistance levels (use previous day high/low, pivot points)
3. RSI, MACD, EMA(9,21,50,200) analysis
4. Volume profile and delivery percentage significance
5. FII/DII sentiment impact if relevant
6. Circuit limit proximity check

INDIAN MARKET SPECIFICS:
- Check for ASM/GSM restrictions
- Consider T+1 settlement impact
- Factor in STT cost for trade viability
- Note any corporate actions (bonus, split, dividend)

Provide: Entry zone, Stop Loss, Target levels with Risk:Reward ratio.
Include confidence level (1-10) and key invalidation level.`
  },

  intradaySetup: {
    id: 'india-intraday',
    name: 'Intraday Setup Scanner',
    category: 'setup',
    template: `Scan {symbol} for intraday trading setup on Indian market.

SESSION: {sessionPhase} (IST: {currentTime})
TIMEFRAME: {timeframe}

SCAN FOR:
1. Opening range breakout/breakdown (9:15-9:30 AM setup)
2. VWAP position and deviation
3. Previous day high/low respect
4. Gap up/down analysis and gap fill probability
5. Volume spike confirmation (>1.5x average)
6. Sector strength vs Nifty correlation

RISK RULES (Indian Intraday):
- Max risk per trade: 1-2% of capital
- Avoid last 15 minutes unless strong momentum
- Square off MIS positions before 3:20 PM
- Check for illiquid strikes in options

Output: LONG/SHORT/NO TRADE with precise levels.`
  },

  fnoAnalysis: {
    id: 'india-fno',
    name: 'F&O Options Analysis',
    category: 'derivatives',
    template: `Analyze F&O setup for {symbol} on NSE.

DERIVATIVES DATA:
- Spot price: {spotPrice}
- Futures price & premium: {futuresPremium}
- Max Pain strike: {maxPain}
- PCR (Put-Call Ratio): {pcr}
- OI buildup at key strikes: {oiData}

ANALYSIS:
1. Trend based on futures premium/discount
2. Options chain OI analysis (support/resistance from OI)
3. IV percentile and IV rank
4. Theta decay impact for current expiry
5. SEBI lot size and margin requirements
6. Expiry week behavior patterns

Provide strategy: Directional/Non-directional with specific strikes.`
  },

  swingTrade: {
    id: 'india-swing',
    name: 'Swing Trade Analysis',
    category: 'swing',
    template: `Swing trade analysis for {symbol} (NSE/BSE) on {timeframe}.

MULTI-TIMEFRAME:
- Weekly trend: {weeklyTrend}
- Daily setup: {dailySetup}
- Entry timeframe: {timeframe}

ANALYZE:
1. Higher timeframe trend alignment
2. Chart patterns (cup-handle, flag, H&S, double top/bottom)
3. Fibonacci retracement levels
4. Earnings calendar proximity
5. Sector rotation and relative strength vs Nifty
6. Delivery volume trend (accumulation/distribution)

HOLD PERIOD: 3-15 days
Provide: Entry, SL, T1, T2, T3 with position sizing for ₹{capital} capital.`
  }
};

export function getMarketStatus() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const time = hours * 60 + minutes;

  if (day === 0 || day === 6) return 'CLOSED (Weekend)';

  const preOpen = 9 * 60;
  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;

  if (time < preOpen) return 'PRE-MARKET';
  if (time >= preOpen && time < marketOpen) return 'PRE-OPEN SESSION';
  if (time >= marketOpen && time < marketClose) return 'OPEN';
  if (time >= marketClose) return 'CLOSED';
  return 'UNKNOWN';
}

export function getSessionPhase() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const time = hours * 60 + minutes;

  if (time >= 9 * 60 + 15 && time < 9 * 60 + 45) return 'OPENING RANGE';
  if (time >= 9 * 60 + 45 && time < 11 * 60) return 'MORNING SESSION';
  if (time >= 11 * 60 && time < 13 * 60) return 'MIDDAY (Low Volume)';
  if (time >= 13 * 60 && time < 14 * 60 + 30) return 'AFTERNOON SESSION';
  if (time >= 14 * 60 + 30 && time < 15 * 60 + 15) return 'POWER HOUR';
  if (time >= 15 * 60 + 15) return 'CLOSING SESSION';
  return 'OFF HOURS';
}

export function formatISTTime() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}
