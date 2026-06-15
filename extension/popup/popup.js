import { PromptEngine } from '../lib/prompt-engine.js';
import { createAIClient } from '../lib/ai-client.js';

let currentMarket = 'india';
let currentPrompt = null;
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

  if (!settings.apiKey) {
    $('#apiKeyBanner').classList.remove('tp-hidden');
  } else {
    $('#inputApiKey').value = settings.apiKey;
  }

  await updateLicenseUI();
  setupMarketTabs();
  renderTemplates();
  setupEventListeners();
}

async function updateLicenseUI() {
  const status = await sendMessage('GET_LICENSE_STATUS');
  const badge = $('#licenseBadge');
  const bar = $('#licenseBar');
  const upgrade = $('#upgradeSection');

  if (status.status === 'trial') {
    badge.textContent = 'Trial';
    bar.className = 'tp-license-bar trial';
    bar.textContent = status.message;
    upgrade.classList.add('tp-hidden');
  } else if (status.status === 'active') {
    badge.textContent = 'Pro';
    bar.className = 'tp-license-bar active';
    bar.textContent = `✓ ${status.plan} — Active`;
    upgrade.classList.add('tp-hidden');
  } else {
    badge.textContent = 'Expired';
    bar.className = 'tp-license-bar expired';
    bar.textContent = status.message;
    upgrade.classList.remove('tp-hidden');
  }
}

function setupMarketTabs() {
  document.querySelectorAll('.tp-market-tab').forEach(tab => {
    if (tab.dataset.market === currentMarket) {
      tab.classList.add('active');
    }
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

  const list = $('#templateList');
  list.innerHTML = templates.map(t => `
    <button class="tp-template-btn" data-template="${t.id}">
      <span class="icon">${icons[t.category] || '📋'}</span>
      <span class="info">
        <div class="name">${t.name}</div>
        <div class="cat">${t.category}</div>
      </span>
    </button>
  `).join('');

  list.querySelectorAll('.tp-template-btn').forEach(btn => {
    btn.addEventListener('click', () => generatePrompt(btn.dataset.template));
  });
}

async function generatePrompt(templateId) {
  const access = await sendMessage('CHECK_FEATURE_ACCESS', { feature: 'prompt' });
  if (!access.allowed) {
    showToast(access.reason);
    return;
  }

  let chartContext = {};
  try {
    chartContext = await sendMessage('GET_CHART_CONTEXT') || {};
  } catch { /* no chart context */ }

  const variables = {
    symbol: chartContext.symbol || getDefaultSymbol(),
    timeframe: chartContext.timeframe || '15m',
    exchange: chartContext.exchange || 'NSE'
  };

  try {
    currentPrompt = await engine.buildPrompt(templateId, variables, { market: currentMarket });
    $('#promptOutput').textContent = currentPrompt.user;
    $('#outputSection').classList.remove('tp-hidden');
    $('#aiOutputSection').classList.add('tp-hidden');
    await sendMessage('INCREMENT_USAGE');
    showToast('Prompt generated! ✓');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

function getDefaultSymbol() {
  const defaults = { india: 'NIFTY', forex: 'EUR/USD', crypto: 'BTC/USDT' };
  return defaults[currentMarket] || 'NIFTY';
}

async function runVisionAnalysis() {
  const access = await sendMessage('CHECK_FEATURE_ACCESS', { feature: 'vision' });
  if (!access.allowed) {
    showToast(access.reason);
    return;
  }

  const btn = $('#btnVisionAnalysis');
  btn.disabled = true;
  btn.textContent = '📸 Capturing chart...';

  try {
    const { screenshot } = await sendMessage('CAPTURE_CHART');
    const chartContext = await sendMessage('GET_CHART_CONTEXT') || {};

    currentPrompt = engine.buildVisionPrompt({
      ...chartContext,
      market: currentMarket
    });

    $('#promptOutput').textContent = '📸 Vision analysis prompt ready. Running AI analysis...';
    $('#outputSection').classList.remove('tp-hidden');

    const ai = await createAIClient();
    const result = await ai.analyze(currentPrompt, { vision: true, image: screenshot });

    $('#aiOutput').textContent = result.content;
    $('#aiOutputSection').classList.remove('tp-hidden');
    await sendMessage('INCREMENT_USAGE');
    showToast('Vision analysis complete! ✓');
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📸 Vision Chart Analysis';
  }
}

async function runAIAnalysis() {
  if (!currentPrompt) return;

  const btn = $('#btnAnalyze');
  btn.disabled = true;
  btn.textContent = '🤖 Analyzing...';
  $('#aiOutput').innerHTML = '<span class="tp-spinner"></span>Analyzing with AI...';
  $('#aiOutputSection').classList.remove('tp-hidden');

  try {
    const ai = await createAIClient();
    const result = await ai.analyze(currentPrompt);
    $('#aiOutput').textContent = result.content;
    showToast('Analysis complete! ✓');
  } catch (err) {
    $('#aiOutput').textContent = currentPrompt.user;
    showToast('Prompt ready ✓');
  } finally {
    btn.disabled = false;
    btn.textContent = '🤖 Analyze with AI';
  }
}

function setupEventListeners() {
  $('#btnCopy').addEventListener('click', () => {
    const text = $('#promptOutput').textContent;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard! ✓');
  });

  $('#btnAnalyze').addEventListener('click', runAIAnalysis);
  $('#btnVisionAnalysis').addEventListener('click', runVisionAnalysis);

  $('#btnOpenSidePanel').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.sidePanel.open({ windowId: tab.windowId });
  });

  $('#btnUpgrade').addEventListener('click', async () => {
    chrome.runtime.openOptionsPage();
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#subscription') });
  });

  $('#btnSetupApi')?.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html#ai') });
  });

  $('#btnSaveApiKey')?.addEventListener('click', async () => {
    const key = $('#inputApiKey').value.trim();
    if (!key.startsWith('sk-')) {
      showToast('Valid sk-... key daalo');
      return;
    }
    await sendMessage('SAVE_SETTINGS', { settings: { apiKey: key, aiProvider: 'openai' } });
    $('#apiKeyBanner').classList.add('tp-hidden');
    showToast('API key saved! ✓');
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
