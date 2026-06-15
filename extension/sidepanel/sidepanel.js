import { PromptEngine, buildMultiIndicatorPrompt } from '../lib/prompt-engine.js';
import { createAIClient } from '../lib/ai-client.js';
import { fetchVolatilityMetrics } from '../lib/market-data.js';
import { sendMessage } from '../lib/messaging.js';
import { getApiBaseUrl } from '../lib/config.js';

let currentMarket = 'india';
let lastPrompt = null;
let lastResult = null;
const engine = new PromptEngine();

const $ = (sel) => document.querySelector(sel);

async function init() {
  const settings = await sendMessage('GET_SETTINGS');
  currentMarket = settings.tp_market || 'india';
  engine.settings.market = currentMarket;
  engine.settings.riskPercent = settings.tp_riskPercent || 1;
  engine.settings.capital = settings.tp_capital || 100000;

  await updateLicenseUI();
  await refreshChartContext();
  await loadApiKey();
  setupMarketTabs();
  renderTemplates();
  setupEventListeners();
}

async function updateLicenseUI() {
  const status = await sendMessage('GET_LICENSE_STATUS');
  const badge = $('#licenseBadge');
  const bar = $('#licenseBar');

  if (status.status === 'trial') {
    badge.textContent = 'Trial';
    bar.className = 'tp-license-bar trial';
    bar.textContent = status.message;
  } else if (status.status === 'active') {
    badge.textContent = 'Pro';
    bar.className = 'tp-license-bar active';
    bar.textContent = `✓ ${status.plan}`;
  } else {
    badge.textContent = 'Expired';
    bar.className = 'tp-license-bar expired';
    bar.textContent = status.message;
  }
}

async function refreshChartContext() {
  try {
    const ctx = await sendMessage('GET_CHART_CONTEXT');
    if (ctx?.symbol) {
      $('#chartInfo').innerHTML = `
        <span class="tp-tag">${ctx.symbol}</span>
        <span class="tp-tag">${ctx.timeframe || '?'}</span>
        <span class="tp-tag">${ctx.exchange || '?'}</span>
        ${ctx.indicators?.length ? `<span class="tp-tag">${ctx.indicators.length} indicators</span>` : ''}
      `;
      $('#inputSymbol').value = ctx.symbol;
      if (ctx.timeframe) {
        const tf = $('#inputTimeframe');
        for (const opt of tf.options) {
          if (opt.value === ctx.timeframe || opt.text === ctx.timeframe) {
            opt.selected = true;
            break;
          }
        }
      }
      if (ctx.market) {
        currentMarket = ctx.market;
        engine.settings.market = currentMarket;
        document.querySelectorAll('.tp-market-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.market === currentMarket);
        });
        renderTemplates();
      }
    }
  } catch { /* ignore */ }
}

function setupMarketTabs() {
  document.querySelectorAll('.tp-market-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tp-market-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMarket = tab.dataset.market;
      engine.settings.market = currentMarket;
      renderTemplates();
    });
  });
}

function renderTemplates() {
  const templates = engine.listTemplates(currentMarket);
  const icons = { analysis: '📊', setup: '🎯', derivatives: '📈', swing: '🔄', strategy: '⚡', macro: '🌐', tax: '💰', inr: '🇮🇳' };

  $('#templateList').innerHTML = templates.map(t => `
    <button class="tp-template-btn" data-template="${t.id}">
      <span class="icon">${icons[t.category] || '📋'}</span>
      <span class="info">
        <div class="name">${t.name}</div>
        <div class="cat">${t.category}</div>
      </span>
    </button>
  `).join('');

  $('#templateList').querySelectorAll('.tp-template-btn').forEach(btn => {
    btn.addEventListener('click', () => runTemplate(btn.dataset.template));
  });
}

async function loadApiKey() {
  const settings = await sendMessage('GET_SETTINGS');
  if (settings.apiKey) {
    $('#inputApiKey').value = settings.apiKey;
    $('#apiKeyStatus').textContent = '✓ API key saved';
  } else {
    $('#apiKeyStatus').textContent = 'Backend handles AI — key optional';
  }
}

async function saveApiKey() {
  const key = $('#inputApiKey').value.trim();
  if (!key) return;
  await sendMessage('SAVE_SETTINGS', { settings: { apiKey: key, aiProvider: 'openai' } });
  $('#apiKeyStatus').textContent = '✓ API key saved!';
  showToast('API key saved ✓');
}


async function getChartContextSafe() {
  try {
    return await sendMessage('GET_CHART_CONTEXT') || {};
  } catch {
    return {};
  }
}

async function buildVolatilityData() {
  const vars = getVariables();
  const chartContext = await getChartContextSafe();
  const metrics = await fetchVolatilityMetrics(currentMarket, vars.symbol, vars.timeframe);

  return {
    symbol: vars.symbol,
    timeframe: vars.timeframe,
    market: currentMarket,
    atr: chartContext.atr ? `${chartContext.atr} (chart)` : metrics?.atr,
    recentRange: chartContext.priceRange || metrics?.recentRange,
    ivPercentile: metrics?.ivPercentile,
    spotPrice: metrics?.spotPrice,
    change: metrics?.change,
    priceRange: chartContext.priceRange,
    indicators: chartContext.indicators?.slice(0, 5).join(', ')
  };
}

function getVariables() {
  return {
    symbol: $('#inputSymbol').value || 'NIFTY',
    timeframe: $('#inputTimeframe').value
  };
}

async function runTemplate(templateId) {
  setLoading('Generating analysis...');
  lastPrompt = await engine.buildPrompt(templateId, getVariables(), { market: currentMarket });
  await runAI(lastPrompt);
  await sendMessage('INCREMENT_USAGE');
}

async function runQuickTA() {
  const templateMap = { india: 'india-ta', forex: 'forex-ta', crypto: 'crypto-ta' };
  await runTemplate(templateMap[currentMarket]);
}

async function runVision() {
  setLoading('Analyzing chart...');
  const chartContext = await getChartContextSafe();
  const vars = { ...chartContext, ...getVariables(), market: currentMarket };
  const capture = await sendMessage('CAPTURE_CHART');
  lastPrompt = engine.buildVisionPrompt(vars);
  if (capture?.screenshot) {
    await runAI(lastPrompt, { vision: true, image: capture.screenshot });
  } else {
    await runAI(lastPrompt);
  }
  await sendMessage('INCREMENT_USAGE');
}

async function runVolatility() {
  setLoading('Fetching volatility data...');
  const marketData = await buildVolatilityData();
  lastPrompt = engine.buildVolatilityPrompt(marketData);
  await runAI(lastPrompt);
  await sendMessage('INCREMENT_USAGE');
}

async function runMultiIndicator() {
  setLoading('Running multi-indicator confluence...');
  const vars = getVariables();
  lastPrompt = buildMultiIndicatorPrompt(['RSI', 'MACD', 'EMA', 'VWAP', 'ATR'], vars.symbol, vars.timeframe);
  await runAI(lastPrompt);
  await sendMessage('INCREMENT_USAGE');
}

async function runBuyAdvice() {
  setLoading('Buy advice la rahe hain...');
  const vars = getVariables();
  try {
    const base = await getApiBaseUrl();
    const res = await fetch(`${base}/api/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: vars.symbol, market: currentMarket, timeframe: vars.timeframe })
    });
    const data = await res.json();
    if (data.verdict) showVerdict(data.verdict);
    lastResult = data.content || '';
    setOutput(lastResult);
    showToast(data.verdict?.actionHi || 'Advice ready ✓');
  } catch {
    await runTemplate(currentMarket === 'india' ? 'india-buy' : `${currentMarket}-ta`);
  }
  await sendMessage('INCREMENT_USAGE');
}

function showVerdict(v) {
  const el = $('#verdictBanner');
  if (!v) { el.style.display = 'none'; return; }
  const cls = v.action === 'BUY' ? 'buy' : v.action === 'BUY ON DIP' ? 'dip' : v.action === 'AVOID' ? 'avoid' : v.action === 'SELL / EXIT' ? 'sell' : 'hold';
  el.className = `tp-verdict ${cls}`;
  el.style.display = 'block';
  el.innerHTML = `<div class="title">${v.emoji} ${v.actionHi}</div><div class="sub">${v.action} | ${v.confidence}/10</div><div>${v.actionDetail}</div>`;
}

async function runAI(prompt, options = {}) {
  setLoading('AI analyze kar raha hai...');
  const ai = await createAIClient();
  const result = await ai.analyze(prompt, {
    ...options,
    symbol: getVariables().symbol,
    market: currentMarket,
    timeframe: getVariables().timeframe
  });
  lastResult = result.content;
  if (result.verdict) showVerdict(result.verdict);
  setOutput(result.content);
  showToast(result.verdict?.actionHi || 'Analysis ready ✓');
}

function setLoading(msg) {
  $('#analysisOutput').innerHTML = `<span class="tp-spinner"></span>${msg}`;
  $('#analysisOutput').classList.add('loading');
}

function setOutput(text) {
  $('#analysisOutput').classList.remove('loading');
  $('#analysisOutput').textContent = text;
}

function setupEventListeners() {
  $('#btnSaveApiKey').addEventListener('click', saveApiKey);
  $('#btnRefreshContext').addEventListener('click', refreshChartContext);
  $('#btnBuyAdvice').addEventListener('click', runBuyAdvice);
  $('#btnQuickTA').addEventListener('click', runQuickTA);
  $('#btnVision').addEventListener('click', runVision);
  $('#btnVolatility').addEventListener('click', runVolatility);
  $('#btnMultiIndicator').addEventListener('click', runMultiIndicator);

  $('#btnCopyResult').addEventListener('click', () => {
    if (lastResult) {
      navigator.clipboard.writeText(lastResult);
      showToast('Copied! ✓');
    }
  });

  $('#btnCopyPrompt').addEventListener('click', () => {
    if (lastPrompt) {
      navigator.clipboard.writeText(lastPrompt.user);
      showToast('Prompt copied! ✓');
    }
  });
}

function showToast(msg) {
  const existing = document.querySelector('.tp-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'tp-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

init();
