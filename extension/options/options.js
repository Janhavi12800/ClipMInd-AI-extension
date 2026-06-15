const $ = (sel) => document.querySelector(sel);

async function sendMessage(type, data = {}) {
  return chrome.runtime.sendMessage({ type, ...data });
}

async function loadSettings() {
  const settings = await sendMessage('GET_SETTINGS');
  $('#settingMarket').value = settings.tp_market || 'india';
  $('#settingCapital').value = settings.tp_capital || 100000;
  $('#settingProvider').value = settings.aiProvider || 'openai';
  $('#settingApiKey').value = settings.apiKey || '';
  $('#settingRisk').value = settings.tp_riskPercent || 1;
  $('#settingMinRR').value = settings.tp_minRR || 2;
}

async function saveSettings() {
  await sendMessage('SAVE_SETTINGS', {
    settings: {
      tp_market: $('#settingMarket').value,
      tp_capital: parseInt($('#settingCapital').value),
      aiProvider: $('#settingProvider').value,
      apiKey: $('#settingApiKey').value,
      tp_riskPercent: parseFloat($('#settingRisk').value),
      tp_minRR: parseFloat($('#settingMinRR').value)
    }
  });
  showToast('Settings saved! ✓');
}

async function updateSubscriptionStatus() {
  const status = await sendMessage('GET_LICENSE_STATUS');
  const el = $('#subStatus');

  if (status.status === 'trial') {
    el.innerHTML = `<span style="color:var(--tp-warning)">🕐 ${status.message}</span>`;
    $('#btnSubscribe').textContent = 'Subscribe — ₹100/month';
  } else if (status.status === 'active') {
    el.innerHTML = `<span style="color:var(--tp-success)">✓ Active — ${status.daysRemaining} days remaining</span>`;
    $('#btnSubscribe').textContent = 'Manage Subscription';
  } else {
    el.innerHTML = `<span style="color:var(--tp-danger)">Trial expired. Subscribe to continue.</span>`;
    $('#btnSubscribe').textContent = 'Subscribe Now — ₹100/month';
  }
}

async function handleSubscribe() {
  const email = $('#subEmail').value;
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email');
    return;
  }

  $('#btnSubscribe').disabled = true;
  $('#btnSubscribe').textContent = 'Processing...';

  try {
    const result = await sendMessage('START_SUBSCRIPTION', { email });
    if (result.checkoutUrl) {
      chrome.tabs.create({ url: result.checkoutUrl });
    } else if (result.subscriptionId) {
      showToast('Opening payment...');
    }
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    $('#btnSubscribe').disabled = false;
    updateSubscriptionStatus();
  }
}

async function testAI() {
  const result = $('#testResult');
  result.textContent = 'Testing...';

  try {
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
      user: 'Reply with exactly: "Connection successful"'
    }, { fast: true });

    result.innerHTML = `<span style="color:var(--tp-success)">✓ ${response.content.trim()}</span>`;
  } catch (err) {
    result.innerHTML = `<span style="color:var(--tp-danger)">✗ ${err.message}</span>`;
  }
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

setupNav();
loadSettings();
updateSubscriptionStatus();
