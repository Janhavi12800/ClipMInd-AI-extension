import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [/chrome-extension:\/\//, 'http://localhost:*'],
  credentials: true
}));
app.use(express.json());

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS || '3');
const SUBSCRIPTION_AMOUNT = parseInt(process.env.SUBSCRIPTION_AMOUNT || '10000'); // paise (₹100)

const razorpay = process.env.RAZORPAY_KEY_ID
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

const licenses = new Map();
const subscriptions = new Map();

const PLAN = {
  name: 'TradePrompt AI Pro',
  amount: SUBSCRIPTION_AMOUNT,
  currency: 'INR',
  period: 'monthly',
  trialDays: TRIAL_DAYS
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', plan: PLAN });
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, plan = 'monthly' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    if (!razorpay) {
      const licenseKey = `tp_demo_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      licenses.set(licenseKey, {
        email,
        createdAt: new Date(),
        expiry,
        status: 'active',
        plan: 'monthly'
      });

      return res.json({
        success: true,
        licenseKey,
        expiry: expiry.toISOString(),
        message: 'Demo mode: License activated (configure Razorpay for production)',
        demo: true
      });
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

    subscriptions.set(subscription.id, { email, createdAt: new Date() });

    res.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      checkoutUrl: `https://api.razorpay.com/v1/checkout/embedded?subscription_id=${subscription.id}`,
      trialDays: TRIAL_DAYS,
      amount: SUBSCRIPTION_AMOUNT / 100,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: error.message || 'Subscription creation failed' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, email } = req.body;

    if (!razorpay) {
      return res.status(400).json({ message: 'Razorpay not configured' });
    }

    const body = razorpay_payment_id + '|' + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const licenseKey = `tp_${uuidv4().replace(/-/g, '').slice(0, 20)}`;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    licenses.set(licenseKey, {
      email,
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      createdAt: new Date(),
      expiry,
      status: 'active'
    });

    res.json({
      success: true,
      licenseKey,
      expiry: expiry.toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/verify', (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ valid: false });

  const license = licenses.get(licenseKey);
  if (!license) return res.json({ valid: false, message: 'License not found' });

  const now = new Date();
  const expiry = new Date(license.expiry);
  const valid = now < expiry;

  res.json({
    valid,
    expiry: license.expiry,
    daysRemaining: valid ? Math.ceil((expiry - now) / (24 * 60 * 60 * 1000)) : 0,
    status: valid ? 'active' : 'expired',
    email: license.email
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

  if (event === 'subscription.charged') {
    const subId = payload.subscription?.entity?.id;
    for (const [key, license] of licenses) {
      if (license.subscriptionId === subId) {
        const expiry = new Date(license.expiry);
        expiry.setMonth(expiry.getMonth() + 1);
        license.expiry = expiry;
        licenses.set(key, license);
      }
    }
  }

  if (event === 'subscription.cancelled') {
    const subId = payload.subscription?.entity?.id;
    for (const [key, license] of licenses) {
      if (license.subscriptionId === subId) {
        license.status = 'cancelled';
        licenses.set(key, license);
      }
    }
  }

  res.json({ status: 'ok' });
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
      features: [
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

app.listen(PORT, () => {
  console.log(`TradePrompt AI Backend running on http://localhost:${PORT}`);
  console.log(`Razorpay: ${razorpay ? 'Configured' : 'Demo mode (no Razorpay keys)'}`);
});
