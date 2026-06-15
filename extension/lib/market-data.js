/**
 * Market Data Service — real-time quotes and volatility metrics for prompt context
 */

import { calculateATR } from './indicators.js';

export async function fetchMarketData(market, symbol) {
  switch (market) {
    case 'crypto':
      return fetchCryptoQuote(symbol);
    case 'india':
      return fetchIndiaQuote(symbol);
    case 'forex':
      return fetchForexQuote(symbol);
    default:
      return null;
  }
}

async function fetchCryptoQuote(symbol) {
  const coinId = symbolToCoinId(symbol);
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,inr&include_24hr_change=true&include_24hr_vol=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coin = data[coinId];
    if (!coin) return null;
    return {
      price: coin.usd,
      priceInr: coin.inr,
      change24h: coin.usd_24h_change?.toFixed(2) + '%',
      source: 'CoinGecko'
    };
  } catch {
    return null;
  }
}

async function fetchIndiaQuote(symbol) {
  const yahooSymbol = toYahooSymbol(symbol, 'india');
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      price: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      change: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2) + '%',
      currency: 'INR',
      source: 'Yahoo Finance'
    };
  } catch {
    return null;
  }
}

async function fetchForexQuote(symbol) {
  const pair = symbol.replace(/[\/\s]/g, '').toUpperCase();
  if (pair === 'USDINR' || pair.includes('INR')) {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
      if (!res.ok) return null;
      const data = await res.json();
      return {
        price: data.rates.INR,
        currency: 'INR',
        source: 'Frankfurter (ECB)'
      };
    } catch {
      return null;
    }
  }
  return { symbol, note: 'Use TradingView chart for live forex quotes' };
}

function symbolToCoinId(symbol) {
  const map = {
    BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin',
    SOL: 'solana', XRP: 'ripple', ADA: 'cardano',
    DOGE: 'dogecoin', AVAX: 'avalanche-2'
  };
  const base = symbol.split(/[\/:]/)[0].replace(/USDT|USD|INR/gi, '').toUpperCase();
  return map[base] || 'bitcoin';
}

export async function enrichPromptVariables(market, variables) {
  const quote = await fetchMarketData(market, variables.symbol);
  const metrics = await fetchVolatilityMetrics(market, variables.symbol, variables.timeframe);

  return {
    ...variables,
    spotPrice: quote?.price || metrics?.spotPrice || variables.spotPrice,
    priceInr: quote?.priceInr,
    change24h: quote?.change24h || quote?.change || metrics?.change,
    dataSource: quote?.source || metrics?.source,
    atr: variables.atr || metrics?.atr,
    recentRange: variables.recentRange || metrics?.recentRange,
    ivPercentile: variables.ivPercentile || metrics?.ivPercentile
  };
}

function toYahooSymbol(symbol, market) {
  if (!symbol) return '^NSEI';
  const s = symbol.toUpperCase().replace(/\s+/g, '');

  if (market === 'india') {
    const indexMap = {
      NIFTY: '^NSEI',
      NIFTY50: '^NSEI',
      'NIFTY50': '^NSEI',
      BANKNIFTY: '^NSEBANK',
      BANK_NIFTY: '^NSEBANK',
      SENSEX: '^BSESN',
      FINNIFTY: 'NIFTY_FIN_SERVICE.NS'
    };
    if (indexMap[s]) return indexMap[s];
    const clean = symbol.replace(/(NSE:|BSE:)/gi, '').replace(/\.(NS|BO)$/i, '');
    if (clean.includes('NIFTY') && !clean.includes('BANK')) return '^NSEI';
    if (clean.includes('BANK') && clean.includes('NIFTY')) return '^NSEBANK';
    return `${clean}.NS`;
  }

  if (market === 'crypto') {
    const base = symbol.split(/[\/:]/)[0].replace(/USDT|USD|INR/gi, '').toUpperCase();
    return `${base}-USD`;
  }

  if (market === 'forex') {
    const pair = symbol.replace(/[\/\s]/g, '').toUpperCase();
    return `${pair}=X`;
  }

  return symbol;
}

function toYahooInterval(timeframe) {
  const map = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '1h', '1D': '1d', '1W': '1wk' };
  return map[timeframe] || '15m';
}

function toYahooRange(interval) {
  if (interval === '1d' || interval === '1wk') return '6mo';
  if (interval === '1h') return '1mo';
  return '1mo';
}

export async function fetchVolatilityMetrics(market, symbol, timeframe = '15m') {
  const yahooSymbol = toYahooSymbol(symbol, market);
  const interval = toYahooInterval(timeframe);
  const range = toYahooRange(interval);

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    if (!quote?.close?.length) return null;

    const highs = quote.high.map(v => v ?? null);
    const lows = quote.low.map(v => v ?? null);
    const closes = quote.close.map(v => v ?? null);

    const validHighs = highs.filter(v => v != null);
    const validLows = lows.filter(v => v != null);
    const validCloses = closes.filter(v => v != null);
    if (validCloses.length < 5) return null;

    const filledHighs = fillNulls(highs);
    const filledLows = fillNulls(lows);
    const filledCloses = fillNulls(closes);

    const atr = calculateATR(filledHighs, filledLows, filledCloses);
    const window = Math.min(20, validHighs.length);
    const recentHigh = Math.max(...validHighs.slice(-window));
    const recentLow = Math.min(...validLows.slice(-window));
    const spotPrice = validCloses.at(-1);
    const prevClose = validCloses.at(-2);
    const change = prevClose
      ? ((spotPrice - prevClose) / prevClose * 100).toFixed(2) + '%'
      : null;

    let ivPercentile = null;
    if (market === 'india') {
      ivPercentile = await fetchIndiaVixLabel();
    }

    return {
      atr: atr ? `${atr} (${timeframe})` : null,
      recentRange: `${recentLow.toFixed(2)} - ${recentHigh.toFixed(2)}`,
      ivPercentile,
      spotPrice,
      change,
      source: 'Yahoo Finance'
    };
  } catch {
    return null;
  }
}

function fillNulls(arr) {
  let last = arr.find(v => v != null) || 0;
  return arr.map(v => {
    if (v != null) { last = v; return v; }
    return last;
  });
}

async function fetchIndiaVixLabel() {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=3mo'
    );
    if (!res.ok) return null;
    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(v => v != null);
    if (!closes?.length) return null;

    const current = closes.at(-1);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const percentile = max > min ? Math.round((current - min) / (max - min) * 100) : 50;
    const label = percentile >= 70 ? 'High fear' : percentile <= 30 ? 'Low fear' : 'Moderate';

    return `India VIX ${current.toFixed(2)} — ${percentile}th percentile (3mo) — ${label}`;
  } catch {
    return null;
  }
}
