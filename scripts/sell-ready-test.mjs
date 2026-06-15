#!/usr/bin/env node
/**
 * End-to-end sell-readiness smoke test.
 * Run: node scripts/sell-ready-test.mjs [baseUrl]
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const baseUrl = process.argv[2] || 'http://127.0.0.1:3001';

const errors = [];
let passed = 0;

function ok(msg) {
  passed += 1;
  console.log(`  ✓ ${msg}`);
}

function bad(msg) {
  errors.push(msg);
  console.log(`  ✗ ${msg}`);
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

console.log('\n=== TradePrompt AI — Sell Ready Test ===\n');
console.log(`Base URL: ${baseUrl}\n`);

// 1. Files on disk
console.log('1. Package files');
const manifest = join(root, 'extension', 'manifest.json');
if (!existsSync(manifest)) bad('extension/manifest.json missing');
else {
  const m = JSON.parse(readFileSync(manifest, 'utf8'));
  ok(`Extension v${m.version} (${m.name})`);
}

const distDir = join(root, 'dist');
if (!existsSync(distDir) || readdirSync(distDir).filter((f) => f.endsWith('.zip')).length === 0) {
  bad('dist/*.zip missing — run: bash scripts/build-extension.sh');
} else {
  const zip = readdirSync(distDir).find((f) => f.endsWith('.zip'));
  ok(`Store zip ready: dist/${zip}`);
}

const assets = join(root, 'store-assets', 'generated');
if (!existsSync(assets) || readdirSync(assets).length < 3) {
  bad('store-assets/generated incomplete');
} else {
  ok(`Store screenshots: ${readdirSync(assets).length} files`);
}

if (!existsSync(join(root, 'backend', '.env'))) {
  bad('backend/.env missing — run: cd backend && npm run setup:demo');
} else {
  ok('backend/.env exists');
}

// 2. API health
console.log('\n2. Backend APIs');
try {
  const { res, data } = await fetchJson('/api/health');
  if (!res.ok) bad(`/api/health failed (${res.status})`);
  else {
    ok(`/api/health → ${data.status}, demoMode=${data.demoMode}`);
    if (!data.aiReady) bad('AI not ready');
    else ok('AI engine ready');
  }
} catch (e) {
  bad(`Backend not reachable: ${e.message}`);
}

// 3. Plans + subscribe flow
try {
  const { res, data } = await fetchJson('/api/plans');
  if (!res.ok || !data.plans?.[0]) bad('/api/plans failed');
  else ok(`/api/plans → ₹${data.plans[0].price}/month`);
} catch (e) {
  bad(`/api/plans: ${e.message}`);
}

try {
  const { res, data } = await fetchJson('/api/demo-activate', {
    method: 'POST',
    body: JSON.stringify({ email: 'selltest@tradeprompt.ai' })
  });
  if (!res.ok || !data.licenseKey) bad('/api/demo-activate failed');
  else ok(`/api/demo-activate → license ${data.licenseKey.slice(0, 12)}...`);

  const { res: vRes, data: vData } = await fetchJson('/api/verify', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: data.licenseKey })
  });
  if (!vRes.ok || !vData.valid) bad('/api/verify failed');
  else ok('/api/verify → license valid');
} catch (e) {
  bad(`License flow: ${e.message}`);
}

// 4. AI analyze
try {
  const { res, data } = await fetchJson('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({
      user: 'Analyze RELIANCE NSE 15m intraday setup. Give entry, SL, target.',
      symbol: 'RELIANCE',
      market: 'india',
      timeframe: '15m'
    })
  });
  if (!res.ok || !data.content) bad('/api/analyze failed');
  else ok(`/api/analyze → ${data.source} (${data.content.length} chars)`);
} catch (e) {
  bad(`/api/analyze: ${e.message}`);
}

// 5. Static pages
console.log('\n3. Customer pages');
for (const page of ['/app.html', '/checkout.html', '/privacy.html', '/terms.html']) {
  try {
    const res = await fetch(`${baseUrl}${page}`);
    if (!res.ok) bad(`${page} → ${res.status}`);
    else ok(`${page} loads`);
  } catch (e) {
    bad(`${page}: ${e.message}`);
  }
}

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Errors: ${errors.length}`);

if (errors.length) {
  console.log('\nNOT READY — fix errors above\n');
  process.exit(1);
}

console.log('\n✅ SELL READY (local/demo) — extension zip + backend + payments flow OK');
console.log('   Live ₹ payments: add Razorpay LIVE keys + deploy backend\n');
process.exit(0);
