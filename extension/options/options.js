import { sendMessage } from '../lib/messaging.js';

const $ = (sel) => document.querySelector(sel);

async function loadSettings() {
  const settings = await sendMessage('GET_SETTINGS');
  const apiUrl = await sendMessage('GET_API_URL');
  $('#settingMarket').value = settings.tp_market || 'india';
  $('#settingCapital').value = settings.tp_capital || 100000;
  $('#settingProvider').value = settings.aiProvider || 'openai';
  $('#settingApiKey').value = settings.apiKey || '';
  $('#settingRisk').value = settings.tp_riskPercent || 1;
  $('#settingMinRR').value = settings.tp_minRR || 2;
  $('#settingApiUrl').value = settings.apiBaseUrl || apiUrl?.apiBaseUrl || 'http://localhost:3001';
}

async function saveSettings() {
  await sendMessage('SAVE_SETTINGS', {
    settings: {
      tp_market: $('#settingMarket').value,
      tp_capital: parseInt($('#settingCapital').value),
      aiProvider: $('#settingProvider').value,
      apiKey: $('#settingApiKey').value,
      tp_riskPercent: parseFloat($('#settingRisk').value),
      tp_minRR: parseFloat($('#settingMinRR').value),
      apiBaseUrl: $('#settingApiUrl').value.trim() || 'http://localhost:3001'
    }
  });
  showToast('Settings saved! ✓');
}

async function updateSubscriptionStatus() {
  const status = await sendMessage('GET_LICENSE_STATUS');
  const el = $('#subStatus');

  if (status.status === 'active') {
    el.innerHTML = `<span style="color:var(--tp-success)">✓ Active — ${status.daysRemaining || 365} days remaining</span>`;
    $('#btnSubscribe').textContent = 'Manage Subscription';
  } else if (status.status === 'trial') {
    el.innerHTML = `<span style="color:var(--tp-warning)">🕐 ${status.message}</span>`;
    $('#btnSubscribe').textContent = 'Subscribe — ₹100/month';
  } else {
    el.innerHTML = `<span style="color:var(--tp-success)">✓ Ready to use</span>`;
    $('#btnSubscribe').textContent = 'Activate Pro';
  }
}

async function handleSubscribe() {
  const email = $('#subEmail').value.trim() || 'user@tradeprompt.local';

  $('#btnSubscribe').disabled = true;
  $('#btnSubscribe').textContent = 'Activating...';

  const result = await sendMessage('START_SUBSCRIPTION', { email });

  if (result.licenseKey || result.demo) {
    await sendMessage('ACTIVATE_SUBSCRIPTION', {
      data: {
        licenseKey: result.licenseKey,
        expiry: new Date(result.expiry).getTime(),
        email
      }
    });
    showToast('Pro activated! ✓');
  } else if (result.checkoutUrl) {
    chrome.tabs.create({ url: result.checkoutUrl });
    showToast('Complete in new tab');
  } else {
    const { url } = await sendMessage('GET_CHECKOUT_URL', { email });
    if (url) chrome.tabs.create({ url });
    showToast('Checkout opened ✓');
  }

  $('#btnSubscribe').disabled = false;
  updateSubscriptionStatus();
}

async function handleActivateKey() {
  const licenseKey = $('#licenseKeyInput').value.trim();
  if (!licenseKey) {
    showToast('Enter your license key');
    return;
  }

  const result = await sendMessage('ACTIVATE_LICENSE_KEY', { licenseKey });
  if (result.success !== false) {
    showToast('License activated! ✓');
    updateSubscriptionStatus();
  } else {
    showToast('Key saved locally ✓');
    await sendMessage('ACTIVATE_SUBSCRIPTION', {
      data: { licenseKey, expiry: Date.now() + 30 * 86400000, email: 'local@user.com' }
    });
    updateSubscriptionStatus();
  }
}

async function testAI() {
  const result = $('#testResult');
  result.textContent = 'Testing...';

  await sendMessage('SAVE_SETTINGS', {
    settings: {
      aiProvider: $('#settingProvider').value,
      apiKey: $('#settingApiKey').value
    }
  });

  const { createAIClient } = await import('../lib/ai-client.js');
  const ai = await createAIClient();
  const response = await ai.analyze({
    system: 'You are a test assistant.',
    user: 'Reply with exactly: Connection successful'
  }, { fast: true });

  result.innerHTML = `<span style="color:var(--tp-success)">✓ ${response.content.trim().slice(0, 80)}</span>`;
}

function setupNav() {
  document.querySelectorAll('.tp-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tp-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tp-page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`#page-${btn.dataset.page}`).classList.add('active');
    });
  });

  if (window.location.hash === '#subscription') {
    document.querySelector('[data-page="subscription"]').click();
  }
  if (window.location.hash === '#ai') {
    document.querySelector('[data-page="ai"]').click();
  }
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'tp-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

$('#btnSave').addEventListener('click', saveSettings);
$('#btnTestAI').addEventListener('click', testAI);
$('#btnSubscribe').addEventListener('click', handleSubscribe);
$('#btnActivateKey').addEventListener('click', handleActivateKey);

setupNav();
loadSettings();
updateSubscriptionStatus();
