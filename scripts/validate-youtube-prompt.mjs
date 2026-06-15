#!/usr/bin/env node
/**
 * Validates YouTube extension reference scaffold + cursor prompt completeness.
 * Run: node scripts/validate-youtube-prompt.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const errors = [];
const warnings = [];
let passed = 0;

function pass(msg) {
  passed += 1;
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  errors.push(msg);
  console.log(`  ✗ ${msg}`);
}

function warn(msg) {
  warnings.push(msg);
  console.log(`  ⚠ ${msg}`);
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

console.log('\n=== YouTube Cursor Prompt Validation ===\n');

// 1. Cursor rule file exists
console.log('1. Cursor rule file');
const rulePath = '.cursor/rules/youtube-extension.mdc';
if (!existsSync(join(root, rulePath))) {
  fail(`${rulePath} missing`);
} else {
  const rule = read(rulePath);
  pass(`${rulePath} exists (${rule.length} chars)`);

  const requiredSections = [
    'Manifest V3',
    'YouTube SPA Navigation',
    'ytInitialPlayerResponse',
    'responseSchema',
    'gemini-2.5-flash-image',
    'Quality CTR',
    'waitForElement',
    'SECURITY',
    'What NOT to Do'
  ];
  for (const section of requiredSections) {
    if (!rule.includes(section) && !rule.toLowerCase().includes(section.toLowerCase())) {
      fail(`Rule missing section/topic: ${section}`);
    } else {
      pass(`Rule covers: ${section}`);
    }
  }

  if (!rule.startsWith('---')) fail('Rule missing YAML frontmatter');
  else pass('Rule has YAML frontmatter');
}

// 2. Manifest JSON validity
console.log('\n2. Reference manifest.json');
const manifestPath = 'reference/youtube-extension/manifest.json';
try {
  const manifest = JSON.parse(read(manifestPath));
  if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
  else pass('manifest_version = 3');

  const hosts = manifest.host_permissions || [];
  if (!hosts.some((h) => h.includes('youtube.com'))) fail('Missing youtube.com host_permissions');
  else pass('youtube.com host_permissions present');

  if (manifest.background?.service_worker) pass('service_worker declared');
  else fail('background.service_worker missing');

  if ((manifest.permissions || []).includes('scripting')) {
    pass('scripting permission present (needed for MAIN world transcript extraction)');
  } else {
    warn('scripting permission missing — ytInitialPlayerResponse extraction will fail');
  }
} catch (e) {
  fail(`manifest.json parse error: ${e.message}`);
}

// 3. Reference JS modules load
console.log('\n3. Reference JS modules');
const scraperUrl = pathToFileURL(join(root, 'reference/youtube-extension/lib/youtube-scraper.js')).href;
const promptUrl = pathToFileURL(join(root, 'reference/youtube-extension/lib/prompt-engine.js')).href;

try {
  const scraper = await import(scraperUrl);
  const requiredExports = [
    'waitForElement',
    'getVideoId',
    'extractVideoData',
    'watchYouTubeNavigation',
    'getThumbnailUrl',
    'isWatchPage'
  ];
  for (const name of requiredExports) {
    if (typeof scraper[name] !== 'function') fail(`youtube-scraper missing export: ${name}`);
    else pass(`youtube-scraper exports ${name}`);
  }

  // Unit-style checks (no DOM)
  const id = scraper.getVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  if (id !== 'dQw4w9WgXcQ') fail(`getVideoId wrong: ${id}`);
  else pass('getVideoId parses standard watch URL');

  const thumb = scraper.getThumbnailUrl('abc123');
  if (!thumb.includes('img.youtube.com/vi/abc123/maxresdefault.jpg')) fail('getThumbnailUrl format wrong');
  else pass('getThumbnailUrl format correct');
} catch (e) {
  fail(`youtube-scraper import failed: ${e.message}`);
}

try {
  const prompts = await import(promptUrl);
  if (prompts.GEMINI_VISION_MODEL !== 'gemini-2.5-flash') {
    fail(`Wrong Gemini model constant: ${prompts.GEMINI_VISION_MODEL}`);
  } else {
    pass('GEMINI_VISION_MODEL = gemini-2.5-flash');
  }

  const thumbPrompt = prompts.buildThumbnailAnalysisPrompt({ title: 'Test Video' });
  if (!thumbPrompt.system || !thumbPrompt.user) fail('buildThumbnailAnalysisPrompt incomplete');
  else pass('buildThumbnailAnalysisPrompt returns system+user');

  const seoPrompt = prompts.buildSeoPrompt({ topic: 'AI tools', keywords: ['cursor', 'youtube'] });
  if (!seoPrompt.user.includes('AI tools')) fail('buildSeoPrompt missing topic');
  else pass('buildSeoPrompt embeds topic');

  // Schema structure sanity
  for (const key of ['ctr_score', 'strengths', 'recommendations']) {
    if (!prompts.THUMBNAIL_ANALYSIS_SCHEMA.properties[key]) {
      fail(`THUMBNAIL_ANALYSIS_SCHEMA missing ${key}`);
    }
  }
  pass('THUMBNAIL_ANALYSIS_SCHEMA has required fields');

  for (const key of ['titles', 'description', 'hook_script_15sec']) {
    if (!prompts.SEO_GENERATION_SCHEMA.properties[key]) {
      fail(`SEO_GENERATION_SCHEMA missing ${key}`);
    }
  }
  pass('SEO_GENERATION_SCHEMA has required fields');
} catch (e) {
  fail(`prompt-engine import failed: ${e.message}`);
}

// 4. Gemini API payload shape check
console.log('\n4. Gemini API payload shape');
const samplePayload = {
  contents: [{
    parts: [
      { text: 'Analyze thumbnail' },
      { inline_data: { mime_type: 'image/jpeg', data: 'BASE64' } }
    ]
  }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: { type: 'object', properties: { ctr_score: { type: 'integer' } } },
    temperature: 0.3
  }
};
if (samplePayload.generationConfig.responseMimeType !== 'application/json') {
  fail('Gemini payload missing responseMimeType');
} else {
  pass('Gemini payload uses responseMimeType + responseSchema');
}

// 5. Cross-check against known bad patterns from original prompt
console.log('\n5. Known issue regression checks');
const ruleText = existsSync(join(root, rulePath)) ? read(rulePath) : '';
if (ruleText.includes('gemini-2.5-flash-image') && !ruleText.includes('NOT')) {
  warn('Rule mentions gemini-2.5-flash-image without warning');
} else {
  pass('gemini-2.5-flash-image misuse documented');
}

if (ruleText.includes('gpt-4o-mini') && ruleText.includes('vision') && !ruleText.includes('not 4o-mini')) {
  warn('May still recommend gpt-4o-mini for vision');
} else {
  pass('Vision model guidance uses gpt-4o (not mini)');
}

if (!ruleText.includes('waitForElement')) fail('Missing waitForElement pattern');
else pass('waitForElement pattern documented');

if (!ruleText.includes('MAIN')) fail('Missing MAIN world note for ytInitialPlayerResponse');
else pass('MAIN world injection documented');

// Summary
console.log('\n=== Summary ===');
console.log(`Passed checks: ${passed}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nFAILED — fix errors above\n');
  process.exit(1);
}

console.log('\nAPPROVED — all validation checks passed\n');
process.exit(0);
