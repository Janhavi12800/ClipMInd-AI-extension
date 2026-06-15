/**
 * TradePrompt AI — Predictive Prompt Architecture
 * Multi-layer prompt engineering system for trading analysis
 */

import { INDIA_PROMPT_TEMPLATES, getMarketStatus, getSessionPhase, formatISTTime } from './markets/india.js';
import { FOREX_PROMPT_TEMPLATES, getActiveForexSession, getSessionOverlap } from './markets/forex.js';
import { CRYPTO_PROMPT_TEMPLATES, fetchFearGreed } from './markets/crypto.js';
import { enrichPromptVariables } from './market-data.js';

// Fix typo - I used INDIA_PROMET_TEMPLATES by mistake, should be INDIA_PROMPT_TEMPLATES only

export const PROMPT_LAYERS = {
  SYSTEM: 'system',
  MARKET_CONTEXT: 'market_context',
  TECHNICAL: 'technical',
  RISK: 'risk',
  OUTPUT_FORMAT: 'output_format'
};

export const ANALYSIS_MODES = {
  QUICK_SCAN: { id: 'quick', name: 'Quick Scan', tokens: 500 },
  DEEP_ANALYSIS: { id: 'deep', name: 'Deep Analysis', tokens: 2000 },
  TRADE_SETUP: { id: 'setup', name: 'Trade Setup', tokens: 1500 },
  VISION_CHART: { id: 'vision', name: 'Chart Vision Analysis', tokens: 3000 },
  BACKTEST_REVIEW: { id: 'backtest', name: 'Backtest Review', tokens: 2500 }
};

const SYSTEM_PROMPT = `You are TradePrompt AI, an expert trading analysis assistant specializing in Indian stock markets (NSE/BSE), Forex, and Cryptocurrency.

CORE PRINCIPLES:
1. Provide objective, data-driven technical analysis
2. Always include risk management parameters (SL, position sizing)
3. Never guarantee profits - use probability language
4. Consider market-specific regulations and costs
5. Adapt analysis to the specified timeframe and market session

OUTPUT DISCIPLINE:
- Be concise but thorough
- Use bullet points for key levels
- Always end with Risk:Reward ratio
- Include confidence score (1-10)
- State key invalidation level

DISCLAIMER: This is educational analysis, not financial advice.`;

const RISK_LAYER = `
RISK MANAGEMENT RULES (MANDATORY):
- Maximum risk per trade: {riskPercent}% of capital
- Minimum Risk:Reward ratio: 1:{minRR}
- Position sizing formula: (Capital × Risk%) / (Entry - SL)
- Never recommend averaging down on losing positions
- Include trailing stop strategy for swing trades

CAPITAL: ₹{capital} | RISK PER TRADE: {riskPercent}%`;

const OUTPUT_FORMAT = `
RESPONSE FORMAT:
📊 BIAS: [Bullish/Bearish/Neutral]
📈 TREND: [Primary trend description]
🎯 LEVELS:
  • Entry: [price/zone]
  • Stop Loss: [price] ({slPercent}% risk)
  • Target 1: [price] (R:R 1:{rr1})
  • Target 2: [price] (R:R 1:{rr2})
⚠️ INVALIDATION: [level that negates thesis]
📉 CONFIDENCE: [X/10]
💡 KEY INSIGHT: [One-line actionable takeaway]`;

const MARKET_TEMPLATES = {
  india: INDIA_PROMPT_TEMPLATES,
  forex: FOREX_PROMPT_TEMPLATES,
  crypto: CRYPTO_PROMPT_TEMPLATES
};

export class PromptEngine {
  constructor(settings = {}) {
    this.settings = {
      market: 'india',
      riskPercent: 1,
      capital: 100000,
      minRR: 2,
      analysisMode: 'deep',
      aiProvider: 'openai',
      ...settings
    };
  }

  getTemplates(market = this.settings.market) {
    return MARKET_TEMPLATES[market] || MARKET_TEMPLATES.india;
  }

  listTemplates(market) {
    const templates = this.getTemplates(market);
    return Object.values(templates).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category
    }));
  }

  async buildPrompt(templateId, variables = {}, options = {}) {
    const market = options.market || this.settings.market;
    const templates = this.getTemplates(market);
    const template = Object.values(templates).find(t => t.id === templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const contextVars = await this._gatherMarketContext(market, variables);
    const enrichedVars = await enrichPromptVariables(market, { ...variables, ...contextVars });
    const allVars = { ...this._getDefaultVars(), ...enrichedVars };

    let userPrompt = this._interpolate(template.template, allVars);
    const mode = ANALYSIS_MODES[options.mode?.toUpperCase()] || ANALYSIS_MODES.DEEP_ANALYSIS;

    if (mode.id !== 'quick') {
      userPrompt += '\n\n' + this._interpolate(RISK_LAYER, allVars);
      userPrompt += '\n\n' + OUTPUT_FORMAT;
    }

    return {
      system: SYSTEM_PROMPT,
      user: userPrompt,
      metadata: {
        templateId,
        market,
        mode: mode.id,
        timestamp: new Date().toISOString(),
        estimatedTokens: mode.tokens
      }
    };
  }

  buildVisionPrompt(chartContext = {}) {
    const vars = {
      symbol: chartContext.symbol || 'Unknown',
      timeframe: chartContext.timeframe || 'Unknown',
      market: chartContext.market || this.settings.market,
      ...chartContext
    };

    const userPrompt = `Analyze this trading chart screenshot for ${vars.symbol} on ${vars.timeframe} timeframe.

VISION ANALYSIS REQUIRED:
1. Identify all visible technical indicators and their readings
2. Detect chart patterns (triangles, flags, H&S, double tops/bottoms, etc.)
3. Mark key support/resistance levels visible on chart
4. Analyze candlestick formations at critical levels
5. Assess volume bars if visible
6. Identify trend lines and channels drawn on chart
7. Note any divergences between price and indicators

CHART CONTEXT:
- Platform: ${chartContext.platform || 'TradingView'}
- Market: ${vars.market}
- Current price area: ${chartContext.priceRange || 'visible on chart'}

${this._interpolate(RISK_LAYER, this._getDefaultVars())}

${OUTPUT_FORMAT}

Be specific with price levels read from the chart. If uncertain about a level, state the approximate range.`;

    return {
      system: SYSTEM_PROMPT + '\n\nYou have vision capabilities. Analyze chart images with precision, reading exact price levels from the Y-axis.',
      user: userPrompt,
      metadata: {
        templateId: 'vision-chart',
        market: vars.market,
        mode: 'vision',
        requiresImage: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  buildVolatilityPrompt(marketData = {}) {
    return {
      system: SYSTEM_PROMPT,
      user: `Analyze market volatility for ${marketData.symbol || 'the market'}:

VOLATILITY ANALYSIS FRAMEWORK:
1. WHEN: Identify timing of expected volatility spikes
   - Session opens/closes
   - Economic event calendar
   - Earnings/results dates
   - Options expiry (for F&O)

2. HOW MUCH: Quantify expected move
   - ATR (Average True Range) analysis
   - Historical volatility percentile
   - Implied volatility (if options available)
   - Bollinger Band width

3. HOW: Direction and nature of move
   - Breakout vs mean reversion probability
   - Gap fill probability
   - Trend continuation vs reversal signals

4. WHY: Catalysts driving volatility
   - News events
   - Institutional positioning
   - Technical levels being tested
   - Sector/market correlation

CURRENT DATA:
- Symbol: ${marketData.symbol || 'N/A'}
- ATR: ${marketData.atr || 'Calculate from chart'}
- IV Percentile: ${marketData.ivPercentile || 'N/A'}
- Recent range: ${marketData.recentRange || 'N/A'}
- Market: ${this.settings.market}

Provide actionable volatility-based strategy (straddle, breakout, fade, or wait).`,
      metadata: {
        templateId: 'volatility-analysis',
        mode: 'deep',
        timestamp: new Date().toISOString()
      }
    };
  }

  async _gatherMarketContext(market, variables) {
    const context = {};

    if (market === 'india') {
      context.currentTime = formatISTTime();
      context.marketStatus = getMarketStatus();
      context.sessionPhase = getSessionPhase();
      context.exchange = variables.exchange || 'NSE';
      context.segment = variables.segment || 'Equity';
    }

    if (market === 'forex') {
      context.activeSession = getActiveForexSession();
      context.sessionOverlap = getSessionOverlap();
      context.utcTime = new Date().toUTCString();
      context.istTime = formatISTTime();
    }

    if (market === 'crypto') {
      const fearGreed = await fetchFearGreed();
      context.fearGreed = fearGreed || 'N/A';
      context.btcDominance = variables.btcDominance || 'N/A';
    }

    return context;
  }

  _getDefaultVars() {
    return {
      symbol: 'RELIANCE',
      timeframe: '15m',
      riskPercent: this.settings.riskPercent,
      capital: this.settings.capital,
      minRR: this.settings.minRR,
      exchange: 'NSE',
      segment: 'Equity'
    };
  }

  _interpolate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? String(vars[key]) : match;
    });
  }
}

export const INDICATOR_PROMPTS = {
  rsi: 'Analyze RSI({period}) — overbought/oversold, divergences, failure swings',
  macd: 'Analyze MACD({fast},{slow},{signal}) — crossovers, histogram momentum, divergences',
  ema: 'Analyze EMA ribbon ({periods}) — alignment, crossovers, dynamic support/resistance',
  bollinger: 'Analyze Bollinger Bands({period},{stdDev}) — squeeze, walk, mean reversion',
  vwap: 'Analyze VWAP — price position, deviation bands, institutional levels',
  volume: 'Analyze volume profile — climax, dry-up, confirmation, divergence',
  ichimoku: 'Analyze Ichimoku Cloud — TK cross, cloud break, future cloud color',
  pivot: 'Calculate and analyze Pivot Points (Standard/Fibonacci/Camarilla)',
  fibonacci: 'Draw Fibonacci retracement — key levels 38.2%, 50%, 61.8%, extensions',
  atr: 'Calculate ATR({period}) — stop loss placement, position sizing, volatility regime'
};

export function buildMultiIndicatorPrompt(indicators = [], symbol, timeframe) {
  const indicatorAnalysis = indicators
    .map(ind => INDICATOR_PROMPTS[ind] || `Analyze ${ind}`)
    .join('\n');

  return {
    system: SYSTEM_PROMPT,
    user: `Multi-indicator confluence analysis for ${symbol} on ${timeframe}:

INDICATORS TO ANALYZE:
${indicatorAnalysis}

CONFLUENCE RULES:
- 3+ indicators agreeing = High confidence setup
- 2 indicators agreeing = Moderate confidence
- Conflicting signals = NO TRADE or reduce size
- Weight higher timeframe indicator signals more

Provide confluence score (0-100%) and unified trade recommendation.`,
    metadata: { templateId: 'multi-indicator', mode: 'deep' }
  };
}
