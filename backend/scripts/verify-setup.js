#!/usr/bin/env node
/**
 * Verify all account configurations are working
 * Usage: cd backend && npm run verify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');

const checks = [];

function pass(msg) { checks.push({ ok: true, msg }); console.log(`  ✓ ${msg}`); }
function fail(msg) { checks.push({ ok: false, msg }); console.log(`  ✗ ${msg}`); }
function warn(msg) { checks.push({ ok: null, msg }); console.log(`  ⚠ ${msg}`); }

async function main() {
  console.log('\n⚡ TradePrompt AI — Setup Verification\n');

  // 1. .env file
  if (fs.existsSync(ENV_PATH)) {
    pass('.env file exists');
  } else {
    fail('.env file missing — run: npm run setup');
    printSummary();
    process.exit(1);
  }

  const { config } = await import('dotenv');
  config({ path: ENV_PATH });

  // 2. Required vars
  const required = ['JWT_SECRET', 'ADMIN_SECRET', 'API_BASE_URL'];
  required.forEach(key => {
    if (process.env[key] && !process.env[key].includes('change-this')) {
      pass(`${key} configured`);
    } else {
      fail(`${key} not configured`);
    }
  });

  // 3. Razorpay
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const planId = process.env.RAZORPAY_PLAN_ID;

  if (!keyId || keyId.includes('YOUR') || keyId.includes('DEMO')) {
    warn('Razorpay: Demo mode (auto-activate licenses without payment)');
  } else {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/account', {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await res.json();
      if (res.ok) {
        pass(`Razorpay connected: ${data.email || data.id} (${keyId.startsWith('rzp_live') ? 'LIVE' : 'TEST'})`);
      } else {
        fail(`Razorpay error: ${data.error?.description}`);
      }
    } catch (e) {
      fail(`Razorpay unreachable: ${e.message}`);
    }

    if (planId && !planId.includes('YOUR') && !planId.includes('SET')) {
      pass(`Razorpay Plan ID: ${planId}`);
    } else {
      fail('RAZORPAY_PLAN_ID not set — run: npm run setup');
    }
  }

  // 4. Backend health
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    if (res.ok) {
      const data = await res.json();
      pass(`Backend running at ${apiUrl} (v${data.version})`);
    } else {
      warn(`Backend not running at ${apiUrl} — start with: npm run dev`);
    }
  } catch {
    warn(`Backend not running at ${apiUrl} — start with: npm run dev`);
  }

  // 5. Extension files
  const extManifest = path.join(__dirname, '..', '..', 'extension', 'manifest.json');
  if (fs.existsSync(extManifest)) {
    pass('Extension files found');
  } else {
    fail('Extension manifest not found');
  }

  // 6. Store assets
  const assetsDir = path.join(__dirname, '..', '..', 'store-assets', 'generated');
  if (fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0) {
    pass('Chrome Web Store assets generated');
  } else {
    warn('Store assets not generated — run: python3 scripts/generate-store-assets.py');
  }

  printSummary();
}

function printSummary() {
  const passed = checks.filter(c => c.ok === true).length;
  const failed = checks.filter(c => c.ok === false).length;
  const warnings = checks.filter(c => c.ok === null).length;

  console.log(`\n─── Summary: ${passed} passed, ${failed} failed, ${warnings} warnings ───\n`);

  if (failed === 0) {
    console.log('✅ Ready to go! Next: npm run dev → test checkout → load extension\n');
  } else {
    console.log('❌ Fix failed checks above, then run: npm run verify\n');
    process.exit(1);
  }
}

main();
