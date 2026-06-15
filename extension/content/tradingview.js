/**
 * TradingView Content Script
 * Extracts chart context for prompt generation
 */

(function () {
  'use strict';

  function extractChartContext() {
    const context = {
      platform: 'TradingView',
      symbol: null,
      timeframe: null,
      exchange: null,
      priceRange: null,
      indicators: [],
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    try {
      const titleEl = document.querySelector('[data-name="legend-source-title"]');
      if (titleEl) {
        context.symbol = titleEl.textContent?.trim();
      }

      if (!context.symbol) {
        const symbolEl = document.querySelector('.chart-markup-table .titleWrapper-g1QqbKb7, [class*="symbolTitle"]');
        context.symbol = symbolEl?.textContent?.trim() || extractSymbolFromUrl();
      }

      const intervalBtn = document.querySelector('[data-name="legend-source-interval"], [class*="interval"]');
      if (intervalBtn) {
        context.timeframe = intervalBtn.textContent?.trim();
      }

      if (!context.timeframe) {
        context.timeframe = extractTimeframeFromUrl();
      }

      const legendItems = document.querySelectorAll('[data-name="legend-source-item"]');
      legendItems.forEach(item => {
        const name = item.textContent?.trim();
        if (name && !name.includes(context.symbol)) {
          context.indicators.push(name);
        }
      });

      const indicatorValues = extractIndicatorValues();
      if (indicatorValues.atr) context.atr = indicatorValues.atr;
      if (indicatorValues.rsi) context.rsi = indicatorValues.rsi;

      const priceEls = document.querySelectorAll('[class*="price"], [data-name="legend-source-value"]');
      const prices = [];
      priceEls.forEach(el => {
        const val = parseFloat(el.textContent?.replace(/,/g, ''));
        if (!isNaN(val)) prices.push(val);
      });
      if (prices.length >= 2) {
        context.priceRange = `${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)}`;
      }

      context.exchange = detectExchange(context.symbol);
      context.market = detectMarket(context.symbol, context.exchange);
    } catch (e) {
      console.warn('[TradePrompt] Context extraction error:', e);
    }

    return context;
  }

  function extractIndicatorValues() {
    const values = {};
    document.querySelectorAll('[data-name="legend-source-item"], [class*="legend"]').forEach(item => {
      const text = (item.textContent || '').replace(/\s+/g, ' ');
      const atr = text.match(/ATR[^0-9]*([\d,.]+)/i);
      const rsi = text.match(/RSI[^0-9]*([\d,.]+)/i);
      if (atr) values.atr = atr[1].replace(/,/g, '');
      if (rsi) values.rsi = rsi[1].replace(/,/g, '');
    });
    return values;
  }

  function extractSymbolFromUrl() {
    const match = window.location.pathname.match(/\/chart\/[^/]+\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function extractTimeframeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('interval') || null;
  }

  function detectExchange(symbol) {
    if (!symbol) return 'Unknown';
    const s = symbol.toUpperCase();
    if (s.includes('NSE:') || s.endsWith('.NS')) return 'NSE';
    if (s.includes('BSE:') || s.endsWith('.BO')) return 'BSE';
    if (s.includes('BINANCE:') || s.includes('BTC') || s.includes('ETH')) return 'Crypto';
    if (s.includes('FX:') || s.includes('OANDA:')) return 'Forex';
    if (s.includes('NASDAQ:') || s.includes('NYSE:')) return 'US';
    return 'Unknown';
  }

  function detectMarket(symbol, exchange) {
    if (exchange === 'NSE' || exchange === 'BSE') return 'india';
    if (exchange === 'Crypto') return 'crypto';
    if (exchange === 'Forex') return 'forex';
    return 'india';
  }

  window.__tradePromptContext = extractChartContext();

  const observer = new MutationObserver(() => {
    window.__tradePromptContext = extractChartContext();
  });

  const chartContainer = document.querySelector('.chart-container, [class*="chart-page"]');
  if (chartContainer) {
    observer.observe(chartContainer, { childList: true, subtree: true, characterData: true });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CONTEXT') {
      sendResponse(extractChartContext());
    }
    if (message.type === 'PING') {
      sendResponse({ alive: true, context: extractChartContext() });
    }
    return true;
  });

  function injectQuickButton() {
    if (document.getElementById('tradeprompt-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'tradeprompt-fab';
    fab.innerHTML = '⚡ AI';
    fab.title = 'TradePrompt AI — Quick Analysis';
    fab.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    });

    document.body.appendChild(fab);
  }

  if (document.readyState === 'complete') {
    setTimeout(injectQuickButton, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(injectQuickButton, 2000));
  }
})();
