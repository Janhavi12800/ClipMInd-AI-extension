/**
 * Backend market data — Yahoo Finance + CoinGecko
 */

function calculateATR(highs, lows, closes, period = 14) {
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
  return +(trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period).toFixed(4);
}

export async function fetchMarketData(market, symbol) {
  switch (market) {
    case 'crypto': return fetchCryptoQuote(symbol);
    case 'india': return fetchIndiaQuote(symbol);
    case 'forex': return fetchForexQuote(symbol);
    default: return null;
  }
}

async function fetchCryptoQuote(symbol) {
  const coinId = symbolToCoinId(symbol);
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,inr&include_24hr_change=true`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coin = data[coinId];
    if (!coin) return null;
    return {
      price: coin.usd,
      priceInr: coin.inr,
      change24h: coin.usd_24h_change?.toFixed(2) + '%',
      change: coin.usd_24h_change?.toFixed(2) + '%',
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
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const prev = meta.chartPreviousClose || meta.previousClose;
    return {
      price: meta.regularMarketPrice,
      previousClose: prev,
      change: prev ? ((meta.regularMarketPrice - prev) / prev * 100).toFixed(2) + '%' : null,
      currency: 'INR',
      source: 'Yahoo Finance'
    };
  } catch {
    return null;
  }
}

async function fetchForexQuote(symbol) {
  const pair = symbol.replace(/[\/\s]/g, '').toUpperCase();
  const yahoo = `${pair}=X`;
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=1d&range=5d`
    );
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const prev = meta.chartPreviousClose || meta.previousClose;
        return {
          price: meta.regularMarketPrice,
          change: prev ? ((meta.regularMarketPrice - prev) / prev * 100).toFixed(2) + '%' : null,
          currency: meta.currency || 'USD',
          source: 'Yahoo Finance'
        };
      }
    }
  } catch { /* fallback */ }

  if (pair === 'USDINR' || pair.includes('INR')) {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
      if (!res.ok) return null;
      const data = await res.json();
      return { price: data.rates.INR, currency: 'INR', source: 'Frankfurter' };
    } catch {
      return null;
    }
  }
  return null;
}

function symbolToCoinId(symbol) {
  const map = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple' };
  const base = symbol.split(/[\/:]/)[0].replace(/USDT|USD|INR/gi, '').toUpperCase();
  return map[base] || 'bitcoin';
}

function toYahooSymbol(symbol, market) {
  if (!symbol) return '^NSEI';
  const s = symbol.toUpperCase().replace(/\s+/g, '');

  if (market === 'india') {
    const indexMap = { NIFTY: '^NSEI', NIFTY50: '^NSEI', BANKNIFTY: '^NSEBANK', SENSEX: '^BSESN' };
    if (indexMap[s]) return indexMap[s];
    const clean = symbol.replace(/(NSE:|BSE:)/gi, '').replace(/\.(NS|BO)$/i, '');
    if (clean.includes('NIFTY') && !clean.includes('BANK')) return '^NSEI';
    return `${clean}.NS`;
  }
  if (market === 'crypto') {
    const base = symbol.split(/[\/:]/)[0].replace(/USDT|USD|INR/gi, '').toUpperCase();
    return `${base}-USD`;
  }
  if (market === 'forex') {
    return `${symbol.replace(/[\/\s]/g, '').toUpperCase()}=X`;
  }
  return symbol;
}

function toYahooInterval(timeframe) {
  const map = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '1h', '1D': '1d', '1W': '1wk' };
  return map[timeframe] || '15m';
}

function toYahooRange(interval) {
  if (interval === '1d' || interval === '1wk') return '6mo';
  return '2mo';
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
    const quote = data?.chart?.result?.[0]?.indicators?.quote?.[0];
    if (!quote?.close?.length) return null;

    const highs = fillNulls(quote.high);
    const lows = fillNulls(quote.low);
    const closes = fillNulls(quote.close);
    const validCloses = closes.filter(v => v != null);
    if (validCloses.length < 5) return null;

    const atr = calculateATR(highs, lows, closes);
    const window = Math.min(20, validCloses.length);
    const recentHigh = Math.max(...highs.slice(-window));
    const recentLow = Math.min(...lows.slice(-window));
    const spotPrice = validCloses.at(-1);
    const prevClose = validCloses.at(-2);
    const change = prevClose ? ((spotPrice - prevClose) / prevClose * 100).toFixed(2) + '%' : null;

    let ivPercentile = null;
    if (market === 'india') ivPercentile = await fetchIndiaVixLabel();

    const dec = market === 'forex' ? 4 : 2;
    return {
      atr: atr ? `${atr.toFixed(dec)} (${timeframe})` : null,
      recentRange: `${recentLow.toFixed(dec)} - ${recentHigh.toFixed(dec)}`,
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
  return arr.map(v => { if (v != null) { last = v; return v; } return last; });
}

async function fetchIndiaVixLabel() {
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=3mo');
    if (!res.ok) return null;
    const closes = (await res.json())?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(v => v != null);
    if (!closes?.length) return null;
    const current = closes.at(-1);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pct = max > min ? Math.round((current - min) / (max - min) * 100) : 50;
    return `India VIX ${current.toFixed(2)} — ${pct}th percentile (3mo)`;
  } catch {
    return null;
  }
}
