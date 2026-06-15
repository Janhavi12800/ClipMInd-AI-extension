/**
 * AI analysis service — OpenAI when configured, smart fallback with live data
 */

import { generateSmartAnalysis } from './smart-analysis.js';
import { fetchMarketData, fetchVolatilityMetrics } from './market-data.js';

export async function buildMarketMeta({ symbol, market, timeframe }) {
  if (!symbol || !market) return {};

  const [quote, metrics] = await Promise.all([
    fetchMarketData(market, symbol),
    fetchVolatilityMetrics(market, symbol, timeframe || '15m')
  ]);

  return {
    symbol: symbol.toUpperCase(),
    market,
    timeframe: timeframe || '15m',
    spotPrice: quote?.price || metrics?.spotPrice,
    change: quote?.change || quote?.change24h || metrics?.change,
    change24h: quote?.change24h || metrics?.change,
    currency: quote?.currency || (market === 'india' ? 'INR' : 'USD'),
    atr: metrics?.atr,
    recentRange: metrics?.recentRange,
    ivPercentile: metrics?.ivPercentile,
    source: quote?.source || metrics?.source || 'Yahoo Finance',
    session: getForexSession()
  };
}

function getForexSession() {
  const h = new Date().getUTCHours();
  if (h >= 13 && h < 17) return 'London-NY Overlap';
  if (h >= 8 && h < 13) return 'London';
  if (h >= 13 && h < 22) return 'New York';
  return 'Asian';
}

export async function runAnalysis({ system, user, image, apiKey, fast = false, symbol, market, timeframe }) {
  const key = apiKey || process.env.OPENAI_API_KEY || '';
  const meta = await buildMarketMeta({ symbol, market, timeframe });

  const enrichedUser = meta.spotPrice
    ? `${user}\n\n[LIVE DATA]\nSymbol: ${meta.symbol}\nTimeframe: ${meta.timeframe}\nSpot: ${meta.spotPrice}\nChange: ${meta.change || 'N/A'}\nATR: ${meta.atr || 'N/A'}\nRange: ${meta.recentRange || 'N/A'}\nMarket: ${meta.market}`
    : user;

  if (key && key.startsWith('sk-') && !image) {
    try {
      const result = await callOpenAI({ system, user: enrichedUser, key, fast });
      return { content: result, source: 'openai', demo: false, meta };
    } catch (err) {
      console.warn('OpenAI failed, using smart analysis:', err.message);
    }
  }

  if (key && key.startsWith('sk-') && image) {
    try {
      const result = await callOpenAIVision({ system, user: enrichedUser, image, key });
      return { content: result, source: 'openai-vision', demo: false, meta };
    } catch (err) {
      console.warn('Vision failed, using smart analysis:', err.message);
    }
  }

  const content = generateSmartAnalysis({ system, user }, meta);
  return {
    content,
    source: meta.spotPrice ? 'smart-engine+live' : 'smart-engine',
    demo: !key.startsWith('sk-'),
    meta
  };
}

async function callOpenAI({ system, user, key, fast }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system || 'You are TradePrompt AI, expert trading analyst. Educational only.' },
        { role: 'user', content: user }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenAI ${res.status}`);
  return data.choices[0].message.content;
}

async function callOpenAIVision({ system, user, image, key }) {
  const imageUrl = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system || 'You are TradePrompt AI chart analyst. Educational only.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: user },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenAI vision ${res.status}`);
  return data.choices[0].message.content;
}
