/**
 * Technical Indicators Library
 * Calculation helpers and analysis prompts
 */

export const INDICATORS = {
  RSI: {
    name: 'Relative Strength Index',
    defaultPeriod: 14,
    overbought: 70,
    oversold: 30,
    description: 'Momentum oscillator measuring speed and magnitude of price changes'
  },
  MACD: {
    name: 'Moving Average Convergence Divergence',
    defaultFast: 12,
    defaultSlow: 26,
    defaultSignal: 9,
    description: 'Trend-following momentum indicator showing relationship between two EMAs'
  },
  EMA: {
    name: 'Exponential Moving Average',
    commonPeriods: [9, 21, 50, 100, 200],
    description: 'Weighted moving average giving more weight to recent prices'
  },
  SMA: {
    name: 'Simple Moving Average',
    commonPeriods: [20, 50, 100, 200],
    description: 'Average price over a specified period'
  },
  BOLLINGER: {
    name: 'Bollinger Bands',
    defaultPeriod: 20,
    defaultStdDev: 2,
    description: 'Volatility bands placed above and below a moving average'
  },
  VWAP: {
    name: 'Volume Weighted Average Price',
    description: 'Average price weighted by volume — key institutional level for intraday'
  },
  ATR: {
    name: 'Average True Range',
    defaultPeriod: 14,
    description: 'Measures market volatility — used for stop loss placement'
  },
  STOCHASTIC: {
    name: 'Stochastic Oscillator',
    defaultK: 14,
    defaultD: 3,
    overbought: 80,
    oversold: 20,
    description: 'Compares closing price to price range over a period'
  },
  ICHIMOKU: {
    name: 'Ichimoku Cloud',
    tenkan: 9,
    kijun: 26,
    senkouB: 52,
    description: 'Comprehensive indicator showing support/resistance, trend, and momentum'
  },
  FIBONACCI: {
    name: 'Fibonacci Retracement',
    levels: [0.236, 0.382, 0.5, 0.618, 0.786],
    extensions: [1.272, 1.618, 2.0, 2.618],
    description: 'Key retracement and extension levels based on Fibonacci ratios'
  },
  PIVOT: {
    name: 'Pivot Points',
    types: ['Standard', 'Fibonacci', 'Camarilla', 'Woodie'],
    description: 'Calculated support/resistance levels from previous period OHLC'
  }
};

export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

export function calculateEMA(data, period) {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return +ema.toFixed(4);
}

export function calculateATR(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null;

  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return +atr.toFixed(4);
}

export function calculatePivotPoints(high, low, close, type = 'standard') {
  const p = (high + low + close) / 3;

  if (type === 'standard') {
    return {
      P: +p.toFixed(2),
      R1: +(2 * p - low).toFixed(2),
      R2: +(p + (high - low)).toFixed(2),
      R3: +(high + 2 * (p - low)).toFixed(2),
      S1: +(2 * p - high).toFixed(2),
      S2: +(p - (high - low)).toFixed(2),
      S3: +(low - 2 * (high - p)).toFixed(2)
    };
  }

  if (type === 'camarilla') {
    const range = high - low;
    return {
      R4: +(close + range * 1.1 / 2).toFixed(2),
      R3: +(close + range * 1.1 / 4).toFixed(2),
      R2: +(close + range * 1.1 / 6).toFixed(2),
      R1: +(close + range * 1.1 / 12).toFixed(2),
      S1: +(close - range * 1.1 / 12).toFixed(2),
      S2: +(close - range * 1.1 / 6).toFixed(2),
      S3: +(close - range * 1.1 / 4).toFixed(2),
      S4: +(close - range * 1.1 / 2).toFixed(2)
    };
  }

  return { P: +p.toFixed(2) };
}

export function getIndicatorList() {
  return Object.entries(INDICATORS).map(([key, val]) => ({
    id: key,
    name: val.name,
    description: val.description
  }));
}

export const CONFLUENCE_STRATEGIES = {
  trendFollowing: {
    name: 'Trend Following',
    indicators: ['EMA', 'MACD', 'RSI'],
    rules: 'EMA alignment + MACD crossover + RSI 40-60 zone for pullback entry'
  },
  meanReversion: {
    name: 'Mean Reversion',
    indicators: ['RSI', 'BOLLINGER', 'STOCHASTIC'],
    rules: 'RSI extreme + Bollinger band touch + Stochastic crossover'
  },
  breakout: {
    name: 'Breakout',
    indicators: ['VWAP', 'ATR', 'VOLUME'],
    rules: 'Price breaks key level + Volume spike + ATR expansion'
  },
  swingTrade: {
    name: 'Swing Trade',
    indicators: ['EMA', 'FIBONACCI', 'RSI', 'MACD'],
    rules: 'Higher TF trend + Fib retracement + RSI divergence + MACD confirmation'
  }
};
