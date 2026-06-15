/**
 * Market Data Service — real-time quotes for prompt context
 */

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
  const clean = symbol.replace(/(NSE:|BSE:)/gi, '').replace(/\.(NS|BO)$/i, '');
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${clean}.NS?interval=1d&range=1d`
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
  if (!quote) return variables;

  return {
    ...variables,
    spotPrice: quote.price || variables.spotPrice,
    priceInr: quote.priceInr,
    change24h: quote.change24h || quote.change,
    dataSource: quote.source
  };
}
