#!/usr/bin/env node
/**
 * Generate production .env with secure random secrets.
 * Usage: node scripts/generate-production-env.mjs https://your-api.onrender.com
 */

import { writeFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const apiUrl = (process.argv[2] || '').replace(/\/$/, '');
if (!apiUrl || !apiUrl.startsWith('http')) {
  console.error('Usage: node scripts/generate-production-env.mjs https://your-api.onrender.com');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'backend', '.env.production');

const content = `# TradePrompt AI — Production (generated ${new Date().toISOString()})
PORT=3001
NODE_ENV=production
DEMO_MODE=false

# Razorpay LIVE keys — get from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_live_PASTE_YOUR_KEY
RAZORPAY_KEY_SECRET=PASTE_YOUR_SECRET
RAZORPAY_PLAN_ID=plan_PASTE_YOUR_PLAN
RAZORPAY_WEBHOOK_SECRET=

TRIAL_DAYS=3
SUBSCRIPTION_AMOUNT=10000
SUBSCRIPTION_CURRENCY=INR

JWT_SECRET=${randomBytes(32).toString('hex')}
ADMIN_SECRET=${randomBytes(16).toString('hex')}
API_BASE_URL=${apiUrl}

# Optional — server-side OpenAI for enhanced analysis
OPENAI_API_KEY=
`;

writeFileSync(envPath, content);
console.log(`✓ Wrote ${envPath}`);
console.log('\nNext: paste Razorpay LIVE keys into .env.production');
console.log('Then set these env vars in Render/Railway dashboard\n');
