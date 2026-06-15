/**
 * Symbol resolver — "YES BANK", "yash bank" → YESBANK
 */

const ALIASES = {
  'yes bank': 'YESBANK',
  yesbank: 'YESBANK',
  'yash bank': 'YESBANK',
  yashbank: 'YESBANK',
  reliance: 'RELIANCE',
  'tata motors': 'TATAMOTORS',
  tatamotors: 'TATAMOTORS',
  'hdfc bank': 'HDFCBANK',
  hdfcbank: 'HDFCBANK',
  'icici bank': 'ICICIBANK',
  icicibank: 'ICICIBANK',
  'sbi': 'SBIN',
  'state bank': 'SBIN',
  infosys: 'INFY',
  infy: 'INFY',
  tcs: 'TCS',
  wipro: 'WIPRO',
  'axis bank': 'AXISBANK',
  axisbank: 'AXISBANK',
  'bajaj finance': 'BAJFINANCE',
  nifty: 'NIFTY',
  nifty50: 'NIFTY',
  banknifty: 'BANKNIFTY',
  'btc usdt': 'BTC/USDT',
  btcusdt: 'BTC/USDT',
  bitcoin: 'BTC/USDT',
  ethereum: 'ETH/USDT',
  ethusdt: 'ETH/USDT',
  'eur usd': 'EUR/USD',
  eurusd: 'EUR/USD',
  'usd inr': 'USD/INR',
  usdinr: 'USD/INR'
};

export function resolveSymbol(input, market = 'india') {
  if (!input) return input;
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  const compact = lower.replace(/\s+/g, '');

  if (ALIASES[lower]) return ALIASES[lower];
  if (ALIASES[compact]) return ALIASES[compact];

  if (market === 'forex' && !raw.includes('/') && raw.length === 6) {
    return `${raw.slice(0, 3).toUpperCase()}/${raw.slice(3).toUpperCase()}`;
  }

  return raw
    .replace(/(NSE:|BSE:)/gi, '')
    .replace(/\.(NS|BO)$/i, '')
    .toUpperCase()
    .replace(/\s+/g, '');
}

export const POPULAR_STOCKS = {
  india: [
    { sym: 'YESBANK', label: 'YES Bank' },
    { sym: 'RELIANCE', label: 'Reliance' },
    { sym: 'TCS', label: 'TCS' },
    { sym: 'HDFCBANK', label: 'HDFC Bank' },
    { sym: 'INFY', label: 'Infosys' },
    { sym: 'TATAMOTORS', label: 'Tata Motors' },
    { sym: 'SBIN', label: 'SBI' },
    { sym: 'ICICIBANK', label: 'ICICI' }
  ],
  forex: [
    { sym: 'EUR/USD', label: 'EUR/USD' },
    { sym: 'GBP/USD', label: 'GBP/USD' },
    { sym: 'USD/JPY', label: 'USD/JPY' },
    { sym: 'USD/INR', label: 'USD/INR' }
  ],
  crypto: [
    { sym: 'BTC/USDT', label: 'Bitcoin' },
    { sym: 'ETH/USDT', label: 'Ethereum' },
    { sym: 'SOL/USDT', label: 'Solana' },
    { sym: 'BNB/USDT', label: 'BNB' }
  ]
};
