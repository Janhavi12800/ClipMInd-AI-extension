/**
 * Backtesting utilities for prompt performance evaluation
 */

export const BACKTEST_SCENARIOS = [
  {
    id: 'india-bull-trend',
    name: 'India Bull Trend (RELIANCE Daily)',
    market: 'india',
    template: 'india-ta',
    variables: { symbol: 'RELIANCE', timeframe: '1D', exchange: 'NSE' },
    expectedBias: 'bullish',
    description: 'Strong uptrend with EMA alignment'
  },
  {
    id: 'india-intraday-range',
    name: 'India Intraday Range (NIFTY 15m)',
    market: 'india',
    template: 'india-intraday',
    variables: { symbol: 'NIFTY', timeframe: '15m' },
    expectedBias: 'neutral',
    description: 'Range-bound intraday, should suggest NO TRADE or fade'
  },
  {
    id: 'india-fno-expiry',
    name: 'F&O Expiry Week (BANKNIFTY)',
    market: 'india',
    template: 'india-fno',
    variables: { symbol: 'BANKNIFTY', timeframe: '1h' },
    expectedBias: 'neutral',
    description: 'Expiry week theta decay focus'
  },
  {
    id: 'forex-london-breakout',
    name: 'Forex London Breakout (EUR/USD)',
    market: 'forex',
    template: 'forex-session',
    variables: { symbol: 'EUR/USD', timeframe: '1h' },
    expectedBias: 'bullish',
    description: 'Asian range breakout at London open'
  },
  {
    id: 'forex-usdinr',
    name: 'USD/INR RBI Context',
    market: 'forex',
    template: 'forex-usdinr',
    variables: { symbol: 'USDINR', timeframe: '1D' },
    expectedBias: 'neutral',
    description: 'RBI intervention zone analysis'
  },
  {
    id: 'crypto-btc-trend',
    name: 'BTC Trend Analysis',
    market: 'crypto',
    template: 'crypto-ta',
    variables: { symbol: 'BTC/USDT', timeframe: '4h' },
    expectedBias: 'bullish',
    description: 'BTC in established uptrend'
  },
  {
    id: 'crypto-tax-trade',
    name: 'Crypto Tax-Aware Trade',
    market: 'crypto',
    template: 'crypto-tax-in',
    variables: { symbol: 'ETH/USDT', timeframe: '1D', entryPrice: 3500, targetPrice: 4000 },
    expectedBias: 'bullish',
    description: 'Should factor 30% tax in R:R calculation'
  },
  {
    id: 'volatility-high',
    name: 'High Volatility Event',
    market: 'india',
    template: 'volatility-analysis',
    variables: { symbol: 'NIFTY', timeframe: '15m' },
    expectedBias: 'neutral',
    description: 'Pre-RBI policy volatility analysis'
  }
];

export function evaluatePromptOutput(output, scenario) {
  const results = {
    scenarioId: scenario.id,
    passed: true,
    checks: []
  };

  const lower = output.toLowerCase();

  if (lower.includes('bias') || lower.includes('bullish') || lower.includes('bearish') || lower.includes('neutral')) {
    results.checks.push({ name: 'Has bias declaration', passed: true });
  } else {
    results.checks.push({ name: 'Has bias declaration', passed: false });
    results.passed = false;
  }

  if (lower.includes('stop loss') || lower.includes('stop-loss') || lower.includes('sl:')) {
    results.checks.push({ name: 'Includes stop loss', passed: true });
  } else {
    results.checks.push({ name: 'Includes stop loss', passed: false });
    results.passed = false;
  }

  if (lower.includes('target') || lower.includes('tp')) {
    results.checks.push({ name: 'Includes targets', passed: true });
  } else {
    results.checks.push({ name: 'Includes targets', passed: false });
    results.passed = false;
  }

  if (lower.includes('confidence') || lower.includes('/10')) {
    results.checks.push({ name: 'Includes confidence score', passed: true });
  } else {
    results.checks.push({ name: 'Includes confidence score', passed: false });
    results.passed = false;
  }

  if (lower.includes('risk') || lower.includes('r:r') || lower.includes('risk:reward')) {
    results.checks.push({ name: 'Includes risk metrics', passed: true });
  } else {
    results.checks.push({ name: 'Includes risk metrics', passed: false });
    results.passed = false;
  }

  if (scenario.expectedBias !== 'neutral') {
    const hasExpected = lower.includes(scenario.expectedBias);
    results.checks.push({
      name: `Expected ${scenario.expectedBias} bias`,
      passed: hasExpected,
      optional: true
    });
  }

  return results;
}

export async function runBacktestSuite(engine, aiClient, scenarios = BACKTEST_SCENARIOS) {
  const results = [];

  for (const scenario of scenarios) {
    try {
      let prompt;
      if (scenario.template === 'volatility-analysis') {
        prompt = engine.buildVolatilityPrompt(scenario.variables);
      } else {
        prompt = await engine.buildPrompt(
          scenario.template,
          scenario.variables,
          { market: scenario.market }
        );
      }

      const aiResult = await aiClient.analyze(prompt, { fast: true });
      const evaluation = evaluatePromptOutput(aiResult.content, scenario);

      results.push({
        scenario: scenario.name,
        ...evaluation,
        outputLength: aiResult.content.length,
        model: aiResult.model
      });
    } catch (error) {
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }
  }

  const passed = results.filter(r => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: ((passed / results.length) * 100).toFixed(1) + '%',
    results
  };
}
