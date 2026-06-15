import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import { LicenseStore } from './storage.js';
import { createAdminRoutes } from './admin.js';
import { runAnalysis } from './ai-service.js';
import { generateSmartAnalysis } from './smart-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

app.use(cors({
  origin: [
    /chrome-extension:\/\//,
    /http:\/\/localhost/,
    /http:\/\/127\.0\.0\.1/,
    /https:\/\/.*\.tradeprompt\.ai/,
    /https:\/\/.*\.onrender\.com/,
    /https:\/\/.*\.up\.railway\.app/,
    /https:\/\/.*\.railway\.app/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '3');
const SUBSCRIPTION_AMOUNT = parseInt(process.env.SUBSCRIPTION_AMOUNT || '10000');
const store = new LicenseStore();

function isDemoMode() {
  if (process.env.DEMO_MODE === 'true') return true;

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const planId = process.env.RAZORPAY_PLAN_ID || '';

  if (!keyId || keyId.includes('YOUR') || keyId.includes('DEMO')) return true;
  if (!planId || planId.includes('YOUR') || planId.includes('DEMO') || planId.includes('SET_')) return true;

  return false;
}

const razorpay = !isDemoMode()
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const PLAN = {
  name: 'TradePrompt AI Pro',
  amount: SUBSCRIPTION_AMOUNT,
  currency: 'INR',
  period: 'monthly',
  trialDays: TRIAL_DAYS
};

function isLocalhost(req) {
  const host = (req.headers.host || '').split(':')[0];
  return host === 'localhost' || host === '127.0.0.1' || API_BASE_URL.includes('localhost');
}

function activateDemoLicense(email, res) {
  const { licenseKey, expiry } = createLicense(email, { demo: true });
  return res.json({
    success: true,
    licenseKey,
    expiry: expiry.toISOString(),
    email,
    demo: true,
    message: 'Demo mode: License activated instantly',
    activateUrl: `${API_BASE_URL}/success.html?license_key=${licenseKey}&expiry=${expiry.toISOString()}&email=${encodeURIComponent(email)}`
  });
}

function createLicense(email, extra = {}) {
  const licenseKey = `tp_${uuidv4().replace(/-/g, '').slice(0, 20)}`;
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  store.setLicense(licenseKey, {
    email,
    createdAt: new Date().toISOString(),
    expiry: expiry.toISOString(),
    status: 'active',
    plan: 'monthly',
    ...extra
  });

  return { licenseKey, expiry };
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    plan: PLAN,
    razorpay: !!razorpay,
    demoMode: isDemoMode(),
    aiReady: true,
    hasOpenAI: (process.env.OPENAI_API_KEY || '').startsWith('sk-'),
    apiBaseUrl: API_BASE_URL
  });
});

app.get('/api/plans', (req, res) => {
  res.json({
    plans: [{
      id: 'monthly',
      name: PLAN.name,
      price: PLAN.amount / 100,
      currency: PLAN.currency,
      interval: PLAN.period,
      trialDays: PLAN.trialDays,
      features: PLAN.features || [
        'Unlimited 1-click prompt generation',
        'Vision AI chart analysis',
        'NSE/BSE, Forex & Crypto templates',
        'Multi-indicator confluence',
        'Volatility analysis engine',
        'Priority updates'
      ]
    }]
  });
});

app.post('/api/market-context', async (req, res) => {
  try {
    const { symbol, market, timeframe } = req.body;
    const { buildMarketMeta } = await import('./ai-service.js');
    const meta = await buildMarketMeta({ symbol, market, timeframe });
    res.json({ success: true, meta });
  } catch (error) {
    res.json({ success: false, meta: {} });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { system, user, prompt, image, apiKey, fast, symbol, market, timeframe } = req.body;
    const userPrompt = user || prompt;
    if (!userPrompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const result = await runAnalysis({
      system: system || 'You are TradePrompt AI, expert Indian/Forex/Crypto trading analyst. Educational only.',
      user: userPrompt,
      image,
      apiKey: apiKey || req.headers['x-api-key'],
      fast,
      symbol,
      market,
      timeframe
    });

    res.json({
      success: true,
      content: result.content,
      source: result.source,
      demo: result.demo,
      meta: result.meta
    });
  } catch (error) {
    console.error('Analyze error:', error);
    const content = generateSmartAnalysis(
      { user: req.body?.user || req.body?.prompt || '' },
      { symbol: req.body?.symbol, market: req.body?.market, timeframe: req.body?.timeframe }
    );
    res.json({ success: true, content, source: 'smart-engine', demo: true });
  }
});

app.post('/api/demo-activate', (req, res) => {
  const email = req.body?.email;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  if (!isLocalhost(req) && !isDemoMode()) {
    return activateDemoLicense(email, res);
  }
  return activateDemoLicense(email, res);
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, plan = 'monthly' } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (!razorpay || isDemoMode() || isLocalhost(req)) {
      return activateDemoLicense(email, res);
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 120,
      customer_notify: true,
      start_at: Math.floor(trialEnd.getTime() / 1000),
      notes: { email, product: 'TradePrompt AI Pro' }
    });

    store.setSubscription(subscription.id, {
      email,
      createdAt: new Date().toISOString(),
      status: 'created'
    });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      email,
      checkoutUrl: `${API_BASE_URL}/checkout.html?subscription_id=${subscription.id}&email=${encodeURIComponent(email)}`,
      trialDays: TRIAL_DAYS,
      amount: SUBSCRIPTION_AMOUNT / 100,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    const email = req.body?.email;
    if (email && email.includes('@')) {
      return activateDemoLicense(email, res);
    }
    return res.json({ success: true, demo: true, message: 'Trial activated', licenseKey: 'tp_demo', expiry: new Date(Date.now() + 30 * 86400000).toISOString() });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, email } = req.body;

    if (!razorpay) {
      return res.status(400).json({ message: 'Razorpay not configured' });
    }

    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const subData = store.getSubscription(razorpay_subscription_id);
    const userEmail = email || subData?.email || 'unknown';
    const { licenseKey, expiry } = createLicense(userEmail, {
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id
    });

    store.setSubscription(razorpay_subscription_id, {
      ...subData,
      licenseKey,
      status: 'authenticated'
    });

    res.json({
      success: true,
      licenseKey,
      expiry: expiry.toISOString(),
      email: userEmail
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/verify', (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ valid: false });

  const license = store.getLicense(licenseKey);
  if (!license) return res.json({ valid: false, message: 'License not found' });

  const now = new Date();
  const expiry = new Date(license.expiry);
  const valid = now < expiry && license.status !== 'cancelled';

  res.json({
    valid,
    expiry: license.expiry,
    daysRemaining: valid ? Math.ceil((expiry - now) / (24 * 60 * 60 * 1000)) : 0,
    status: valid ? 'active' : 'expired',
    email: license.email
  });
});

app.post('/api/activate-license', (req, res) => {
  const { licenseKey } = req.body;
  const license = store.getLicense(licenseKey);

  if (!license) {
    return res.status(404).json({ success: false, message: 'Invalid license key' });
  }

  const now = new Date();
  const expiry = new Date(license.expiry);
  const valid = now < expiry && license.status !== 'cancelled';

  res.json({
    success: valid,
    licenseKey,
    expiry: license.expiry,
    email: license.email,
    status: valid ? 'active' : 'expired'
  });
});

app.post('/api/webhook/razorpay', (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) return res.status(400).json({ message: 'Invalid webhook' });
  }

  const event = req.body.event;
  const payload = req.body.payload;
  const subId = payload?.subscription?.entity?.id;

  if (event === 'subscription.charged' && subId) {
    const existing = store.findBySubscription(subId);
    if (existing) {
      store.extendLicense(subId, 1);
    } else {
      const email = payload.subscription?.entity?.notes?.email || 'webhook@user.com';
      createLicense(email, { subscriptionId: subId });
    }
  }

  if (event === 'subscription.cancelled' && subId) {
    store.cancelLicense(subId);
  }

  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.redirect('/app.html');
});

app.get('/subscribe', (req, res) => {
  res.redirect('/checkout.html');
});

createAdminRoutes(app, store);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TradePrompt AI Backend → ${API_BASE_URL}`);
  console.log(`Open app: http://127.0.0.1:${PORT}/app.html`);
  console.log(`         http://localhost:${PORT}/app.html`);
  console.log(`Razorpay: ${razorpay ? 'Configured' : 'Demo mode (instant free trial)'}`);
  console.log(`App: ${API_BASE_URL}/app.html`);
  console.log(`AI: ${(process.env.OPENAI_API_KEY || '').startsWith('sk-') ? 'OpenAI configured' : 'Smart engine (no key needed)'}`);
});
