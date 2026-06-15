# TradePrompt AI — Development Guidebook

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [AI Prompt Engineering Landscape](#2-ai-prompt-engineering-landscape)
3. [Competitive Feature Analysis](#3-competitive-feature-analysis)
4. [Multimodal Vision AI Architecture](#4-multimodal-vision-ai-architecture)
5. [Predictive Prompt Architecture](#5-predictive-prompt-architecture)
6. [Market Integration (India, Forex, Crypto)](#6-market-integration)
7. [UI/UX Design](#7-uiux-design)
8. [Technical Architecture](#8-technical-architecture)
9. [Security & Risk Management](#9-security--risk-management)
10. [Backtesting Prompts](#10-backtesting-prompts)
11. [Monetization Setup](#11-monetization-setup)
12. [Deployment Guide](#12-deployment-guide)

---

## 1. Product Overview

**TradePrompt AI** is a professional Chrome extension for AI-powered trading analysis targeting:
- 🇮🇳 Indian Stock Market (NSE/BSE/F&O)
- 💱 Forex (including USD/INR via NSE CDS)
- ₿ Cryptocurrency

**Business Model:**
- 3-day free trial (full features)
- ₹100/month subscription via Razorpay
- Users bring their own AI API key (OpenAI/Claude)

---

## 2. AI Prompt Engineering Landscape

### Current State (2025-2026)

| Tool | Strengths | Weaknesses | Price |
|------|-----------|------------|-------|
| TradingView AI Copilot | Deep chart integration, alert management | Beta, 15 req/day limit, no India-specific | Free (beta) |
| ChatGPT/Claude (manual) | Powerful reasoning | No chart context, manual copy-paste | $20/mo |
| Trade Ideas | Real-time scanning | US-focused, expensive | $118+/mo |
| TrendSpider | AI pattern recognition | No Indian markets focus | $39+/mo |
| Koyfin AI | Fundamental + technical | Limited technical depth | $39+/mo |

### TradePrompt AI Differentiators

1. **India-first design** — NSE/BSE session timing, FII/DII, ASM/GSM, STT costs
2. **Predictive Prompt Architecture** — Multi-layer prompts (system → market → technical → risk → output)
3. **Vision AI chart analysis** — Screenshot → GPT-4o/Claude vision
4. **1-click generation** — Pre-built templates per market/scenario
5. **Affordable** — ₹100/month vs $20-118/month competitors
6. **BYOK model** — Users provide API key (no markup on AI costs)

---

## 3. Competitive Feature Analysis

### Best Features to Include (Sourced from Top Tools)

| Feature | Source Inspiration | TradePrompt Implementation |
|---------|-------------------|---------------------------|
| 1-click technical analysis | TradingView Copilot | Template buttons per market |
| Chart vision analysis | GPT-4o Vision | Screenshot capture + vision prompt |
| Multi-indicator confluence | TrendSpider | Confluence scoring engine |
| Session-based analysis | Forex tools | India session phases, forex sessions |
| Volatility analysis (when/how/why) | Custom | Dedicated volatility prompt |
| Risk management integration | Professional tools | Mandatory risk layer in every prompt |
| Alert level suggestions | TradingView Copilot | Support/resistance in output format |
| Indian tax awareness | Unique | 30% crypto tax, STT, TDS calculations |
| F&O/OI analysis | Indian brokers | Options chain prompt template |
| Copy-to-clipboard workflow | All tools | One-click copy for prompts & results |

---

## 4. Multimodal Vision AI Architecture

### How Vision Analysis Works

```
User clicks "Vision Analysis"
        ↓
chrome.tabs.captureVisibleTab() → PNG screenshot
        ↓
Content script provides chart context (symbol, TF, indicators)
        ↓
PromptEngine.buildVisionPrompt(context)
        ↓
AIClient.analyze(prompt, { vision: true, image: screenshot })
        ↓
GPT-4o / Claude Sonnet processes image + text prompt
        ↓
Structured analysis returned to side panel
```

### Vision Prompt Design Principles

1. **Ask for specific price levels** from Y-axis
2. **Identify visible indicators** by reading legend
3. **Detect chart patterns** visually
4. **Cross-reference** with extracted text context
5. **Always include risk parameters** even in vision mode

### Supported Vision Models

| Provider | Model | Strength |
|----------|-------|----------|
| OpenAI | gpt-4o | Best chart reading accuracy |
| Anthropic | claude-sonnet-4 | Strong reasoning + vision |

---

## 5. Predictive Prompt Architecture

### Multi-Layer Design

```
Layer 1: SYSTEM PROMPT
  → Role, principles, output discipline, disclaimer

Layer 2: MARKET CONTEXT (auto-injected)
  → Session timing, market status, regulations
  → India: IST time, NSE/BSE status, session phase
  → Forex: Active session, overlap, UTC time
  → Crypto: Fear & Greed, BTC dominance

Layer 3: TECHNICAL TEMPLATE (user-selected)
  → 12+ templates per market
  → Variable interpolation {symbol}, {timeframe}, etc.

Layer 4: RISK MANAGEMENT (auto-appended)
  → Position sizing, max risk %, min R:R
  → Capital-based calculations

Layer 5: OUTPUT FORMAT (auto-appended)
  → Structured response: Bias, Levels, SL, Targets, Confidence
```

### Template Categories

**India (4 templates):**
- NSE/BSE Technical Analysis
- Intraday Setup Scanner
- F&O Options Analysis
- Swing Trade Analysis

**Forex (3 templates):**
- Forex Technical Analysis
- Session-Based Strategy
- USD/INR (RBI Regulated)

**Crypto (3 templates):**
- Crypto Technical Analysis
- BTC Dominance Analysis
- Indian Tax-Aware Trade

---

## 6. Market Integration

### Indian Market (NSE/BSE)

| Data Point | Source | API |
|-----------|--------|-----|
| Live quotes | NSE India | `nseindia.com/api` (unofficial) |
| Historical | Yahoo Finance | `query1.finance.yahoo.com` |
| F&O chain | NSE | `/api/option-chain-indices` |
| FII/DII | NSE | `/api/fiidiiTradeReact` |

**Market Hours (IST):**
- Pre-open: 9:00-9:08
- Normal: 9:15-15:30
- Post-close: 15:40-16:00

### Forex

| Data Point | Source |
|-----------|--------|
| Major pairs | TradingView FX: prefix |
| USD/INR | NSE CDS / RBI reference rate |
| Economic calendar | ForexFactory / Investing.com |

**Key Sessions (UTC):**
- Asian: 00:00-09:00
- London: 08:00-17:00
- NY: 13:00-22:00
- Overlap: 13:00-17:00 (highest volatility)

### Crypto

| Data Point | Source | API |
|-----------|--------|-----|
| Prices | CoinGecko | `api.coingecko.com/api/v3` |
| Fear & Greed | Alternative.me | `api.alternative.me/fng` |
| On-chain | Glassnode | Paid API |

**Indian Regulations:**
- 30% flat tax on gains (Section 115BBH)
- 1% TDS on transfers (Section 194S)
- No loss offset allowed

---

## 7. UI/UX Design

### Design Principles

1. **Dark theme** — Matches TradingView, reduces eye strain
2. **1-click actions** — Maximum 2 clicks to get analysis
3. **Progressive disclosure** — Simple popup → Full side panel
4. **Context awareness** — Auto-detect symbol from TradingView
5. **Mobile-friendly popup** — 380px width, clean layout

### User Flow

```
Install Extension
    ↓
3-Day Trial Starts Automatically
    ↓
Open TradingView → Click ⚡ FAB button
    ↓
Side Panel Opens with Chart Context
    ↓
Select Market → Click Template (1-click)
    ↓
AI Analysis Appears → Copy or Act
    ↓
Trial Ends → Subscribe ₹100/month
```

### UI Components

| Component | Purpose |
|-----------|---------|
| Popup (380px) | Quick access, template selection |
| Side Panel | Full analysis workspace |
| FAB Button | Quick launch on TradingView |
| Options Page | Settings, API key, subscription |
| License Bar | Trial/subscription status |

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                  Chrome Extension                │
├──────────┬──────────┬───────────┬───────────────┤
│  Popup   │ Side     │ Content   │  Background   │
│  UI      │ Panel    │ Script    │  Service      │
│          │          │ (TV)      │  Worker       │
├──────────┴──────────┴───────────┴───────────────┤
│                  Shared Libraries                │
│  prompt-engine │ ai-client │ license │ markets  │
├─────────────────────────────────────────────────┤
│              Chrome Storage API                  │
│  sync: settings, apiKey │ local: license, usage │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ OpenAI   │ │ Claude   │ │ Backend  │
   │ API      │ │ API      │ │ (Node.js)│
   └──────────┘ └──────────┘ └────┬─────┘
                                    ↓
                              ┌──────────┐
                              │ Razorpay │
                              │ Payments │
                              └──────────┘
```

### File Structure

```
extension/
├── manifest.json
├── background/service-worker.js
├── content/tradingview.js
├── popup/ (popup.html, popup.js)
├── sidepanel/ (sidepanel.html, sidepanel.js)
├── options/ (options.html, options.js)
├── lib/
│   ├── prompt-engine.js
│   ├── ai-client.js
│   ├── license.js
│   ├── indicators.js
│   └── markets/ (india.js, forex.js, crypto.js)
└── assets/ (styles.css, icons/)

backend/
├── src/server.js
├── package.json
└── .env.example
```

---

## 9. Security & Risk Management

### Security Measures

| Area | Implementation |
|------|---------------|
| API Keys | Stored in chrome.storage.sync (encrypted by Chrome) |
| License | Server-side verification + local cache |
| Payments | Razorpay signature verification (HMAC SHA256) |
| Webhooks | Signature validation on Razorpay webhooks |
| CSP | Manifest V3 default Content Security Policy |
| No data collection | API keys never sent to our servers |

### Financial Disclaimer (Mandatory)

Displayed in popup, sidepanel, and options:
> This tool provides AI-generated analysis for educational purposes only.
> Not financial advice. Not SEBI-registered. Trade at your own risk.

### Risk Management (Built into every prompt)

- Max 1-2% risk per trade (configurable)
- Minimum 1:2 Risk:Reward ratio
- Position sizing formula included
- Stop-loss mandatory in output format
- Market-specific warnings (ASM/GSM, crypto tax, forex regulations)

---

## 10. Backtesting Prompts

### How to Test Prompt Quality

1. **Manual backtesting:**
   - Generate prompt for a known historical setup
   - Feed to AI with historical chart screenshot
   - Compare AI prediction vs actual outcome

2. **Prompt consistency test:**
   - Run same template 5 times with same inputs
   - Check if key levels are consistent (±1% tolerance)

3. **Market condition matrix:**

| Condition | Template | Expected Output |
|-----------|----------|----------------|
| Trending bull | india-ta | Bullish bias, pullback entry |
| Range-bound | india-intraday | NO TRADE or fade levels |
| High volatility | volatility | Straddle or wait |
| Expiry day | india-fno | Theta-focused strategy |
| BTC crash | crypto-ta | Risk-off, reduce size |

4. **Vision accuracy test:**
   - Capture chart screenshot
   - Verify AI reads correct price levels
   - Check indicator identification accuracy

### Backtesting Checklist

- [ ] Prompt generates without errors for all 10 templates
- [ ] Market context auto-injects correctly (IST time, session)
- [ ] Risk layer appears in deep analysis mode
- [ ] Vision analysis reads chart price levels accurately
- [ ] Output follows structured format (Bias, Levels, Confidence)
- [ ] Indian tax template calculates correctly
- [ ] License trial expires after exactly 3 days
- [ ] Subscription activates after Razorpay payment

---

## 11. Monetization Setup

### Razorpay Configuration

1. Create account at https://dashboard.razorpay.com
2. Create a Plan:
   - Amount: ₹100 (10000 paise)
   - Interval: monthly
   - Name: "TradePrompt AI Pro"
3. Copy Plan ID to `.env`
4. Set up webhook for `subscription.charged` and `subscription.cancelled`

### Pricing Strategy

| Tier | Price | Features |
|------|-------|----------|
| Trial | Free (3 days) | All Pro features |
| Pro | ₹100/month | Unlimited prompts, vision AI |
| Future: Team | ₹500/month | Multi-user, shared templates |

### Revenue Projections

| Users | Monthly Revenue | Annual |
|-------|----------------|--------|
| 100 | ₹10,000 | ₹1,20,000 |
| 500 | ₹50,000 | ₹6,00,000 |
| 1,000 | ₹1,00,000 | ₹12,00,000 |
| 5,000 | ₹5,00,000 | ₹60,00,000 |

---

## 12. Deployment Guide

### Extension (Chrome Web Store)

1. Zip the `extension/` folder
2. Go to https://chrome.google.com/webstore/devconsole
3. Pay $5 one-time developer fee
4. Upload zip, fill listing details
5. Submit for review (1-3 days)

### Backend (Production)

```bash
# Deploy to Railway/Render/Fly.io
cd backend
npm install
# Set environment variables
npm start
```

### Environment Variables (Production)

```
RAZORPAY_KEY_ID=rzp_live_XXXX
RAZORPAY_KEY_SECRET=XXXX
RAZORPAY_PLAN_ID=plan_XXXX
RAZORPAY_WEBHOOK_SECRET=XXXX
API_BASE_URL=https://api.tradeprompt.ai
```

### Update Extension API URL

In `extension/lib/license.js`, change:
```js
constructor(apiBaseUrl = 'https://api.tradeprompt.ai')
```

### Local Development

```bash
# Load extension in Chrome
1. Open chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked" → select extension/ folder

# Start backend
cd backend && npm install && npm run dev
```

---

## Quick Start Checklist

- [ ] Load extension in Chrome (developer mode)
- [ ] Add OpenAI or Claude API key in Settings
- [ ] Open TradingView chart
- [ ] Click ⚡ button or extension icon
- [ ] Select market → Click template → Get analysis
- [ ] Configure Razorpay for production payments
- [ ] Deploy backend to cloud
- [ ] Submit to Chrome Web Store

---

*TradePrompt AI v1.0.0 — Built for Indian traders, powered by AI.*
