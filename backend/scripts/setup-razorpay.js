#!/usr/bin/env node
/**
 * Razorpay Setup Script
 * Creates subscription plan and prints configuration for .env
 *
 * Usage:
 *   RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx node scripts/setup-razorpay.js
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const AMOUNT = parseInt(process.env.SUBSCRIPTION_AMOUNT || '10000'); // paise

if (!KEY_ID || !KEY_SECRET) {
  console.error('\n❌ Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables\n');
  console.log('Example:');
  console.log('  RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx node scripts/setup-razorpay.js\n');
  process.exit(1);
}

const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');

async function razorpayRequest(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || JSON.stringify(data));
  return data;
}

async function main() {
  console.log('\n⚡ TradePrompt AI — Razorpay Setup\n');

  const account = await razorpayRequest('/account');
  console.log(`✓ Connected to Razorpay account: ${account.email || account.id}`);
  console.log(`  Mode: ${KEY_ID.startsWith('rzp_live') ? '🔴 LIVE' : '🟡 TEST'}\n`);

  console.log('Creating subscription plan...');
  const plan = await razorpayRequest('/plans', 'POST', {
    period: 'monthly',
    interval: 1,
    item: {
      name: 'TradePrompt AI Pro',
      amount: AMOUNT,
      currency: 'INR',
      description: 'Monthly subscription — AI trading prompts for Indian markets'
    },
    notes: { product: 'TradePrompt AI', trial_days: '3' }
  });

  console.log(`✓ Plan created: ${plan.id}`);
  console.log(`  Amount: ₹${AMOUNT / 100}/month\n`);

  console.log('─'.repeat(50));
  console.log('Add these to your backend/.env:\n');
  console.log(`RAZORPAY_KEY_ID=${KEY_ID}`);
  console.log(`RAZORPAY_KEY_SECRET=${KEY_SECRET}`);
  console.log(`RAZORPAY_PLAN_ID=${plan.id}`);
  console.log(`SUBSCRIPTION_AMOUNT=${AMOUNT}`);
  console.log(`TRIAL_DAYS=3`);
  console.log(`API_BASE_URL=https://your-deployed-url.com`);
  console.log('─'.repeat(50));

  console.log('\nWebhook setup:');
  console.log('  URL: https://your-deployed-url.com/api/webhook/razorpay');
  console.log('  Events: subscription.charged, subscription.cancelled, subscription.authenticated\n');

  console.log('Test checkout:');
  console.log('  http://localhost:3001/checkout.html\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
