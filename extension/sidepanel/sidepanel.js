import { PromptEngine, buildMultiIndicatorPrompt } from '../lib/prompt-engine.js';
import { createAIClient } from '../lib/ai-client.js';

let currentMarket = 'india';
let lastPrompt = null;
let lastResult = null;
const engine = new PromptEngine();

const $ = (sel) => document.querySelector(sel);

async function sendMessage(type, data = {}) {
  return chrome.runtime.sendMessage({ type, ...data });
}

async function init() {
  const settings = await sendMessage('GET_SETTINGS');
  currentMarket = settings.tp_market || 'india';
  engine.settings.market = currentMarket;
  engine.settings.riskPercent = settings.tp_riskPercent || 1;
  engine.settings.capital = settings.tp_capital || 100000;

  await updateLicenseUI();
  await refreshChartContext();
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

function getVariables() {
  return {
    symbol: $('#inputSymbol').value || 'NIFTY',
    timeframe: $('#inputTimeframe').value
  };
}

async function runTemplate(templateId) {
  const access = await sendMessage('CHECK_FEATURE_ACCESS', { feature: 'prompt' });
  if (!access.allowed) { showToast(access.reason); return; }

  setLoading('Generating analysis...');
  try {
    lastPrompt = await engine.buildPrompt(templateId, getVariables(), { market: currentMarket });
    await runAI(lastPrompt);
    await sendMessage('INCREMENT_USAGE');
  } catch (err) {
    setOutput('Error: ' + err.message);
  }
}

async function runQuickTA() {
  const templateMap = { india: 'india-ta', forex: 'forex-ta', crypto: 'crypto-ta' };
  await runTemplate(templateMap[currentMarket]);
}

async function runVision() {
  const access = await sendMessage('CHECK_FEATURE_ACCESS', { feature: 'vision' });
  if (!access.allowed) { showToast(access.reason); return; }

  setLoading('Capturing chart & analyzing with vision AI...');
  try {
    const { screenshot } = await sendMessage('CAPTURE_CHART');
    const chartContext = await sendMessage('GET_CHART_CONTEXT') || {};
    lastPrompt = engine.buildVisionPrompt({ ...chartContext, ...getVariables(), market: currentMarket });
    await runAI(lastPrompt, { vision: true, image: screenshot });
    await sendMessage('INCREMENT_USAGE');
  } catch (err) {
    setOutput('Error: ' + err.message);
  }
}

async function runVolatility() {
  setLoading('Analyzing volatility...');
  try {
    lastPrompt = engine.buildVolatilityPrompt(getVariables());
    await runAI(lastPrompt);
    await sendMessage('INCREMENT_USAGE');
  } catch (err) {
    setOutput('Error: ' + err.message);
  }
}

async function runMultiIndicator() {
  setLoading('Running multi-indicator confluence...');
  try {
    const vars = getVariables();
    lastPrompt = buildMultiIndicatorPrompt(
      ['RSI', 'MACD', 'EMA', 'VWAP', 'ATR'],
      vars.symbol,
      vars.timeframe
    );
    await runAI(lastPrompt);
    await sendMessage('INCREMENT_USAGE');
  } catch (err) {
    setOutput('Error: ' + err.message);
  }
}

async function runAI(prompt, options = {}) {
  try {
    const ai = await createAIClient();
    const result = await ai.analyze(prompt, options);
    lastResult = result.content;
    setOutput(result.content);
    showToast('Analysis complete ✓');
  } catch (err) {
    setOutput('AI Error: ' + err.message + '\n\n--- Generated Prompt ---\n\n' + prompt.user);
  }
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
  $('#btnRefreshContext').addEventListener('click', refreshChartContext);
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
