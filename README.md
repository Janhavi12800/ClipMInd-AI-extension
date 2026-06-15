# TradePrompt AI — Smart Trading Prompts Extension

Professional AI prompt engineering Chrome extension for **Indian Stock Market (NSE/BSE)**, **Forex**, and **Cryptocurrency** trading.

## Features

- **1-Click Prompt Generation** — Pre-built templates for every trading scenario
- **Vision AI Chart Analysis** — Screenshot your chart, get instant AI analysis
- **Multi-Market Support** — India (NSE/BSE/F&O), Forex, Crypto with market-specific rules
- **Predictive Prompt Architecture** — Multi-layer prompts with auto-injected market context
- **Technical Indicators** — RSI, MACD, EMA, VWAP, ATR, Bollinger, Ichimoku, Fibonacci
- **Risk Management** — Built-in position sizing, stop-loss, and R:R calculations
- **Indian Market Focus** — IST sessions, FII/DII, STT costs, ASM/GSM, crypto tax (30%)
- **TradingView Integration** — Auto-detects symbol, timeframe, and indicators

## Pricing

| Plan | Price | Details |
|------|-------|---------|
| Free Trial | ₹0 | 3 days, all features |
| Pro | ₹100/month | Unlimited via Razorpay |

*Note: You need your own OpenAI or Claude API key (pay-per-use, typically ₹50-200/month for regular use).*

## Quick Start

### 1. Load Extension (Development)

```bash
# Clone the repo
git clone <repo-url>
cd ClipMInd-AI-extension

# Open Chrome → chrome://extensions
# Enable "Developer mode"
# Click "Load unpacked" → select the extension/ folder
```

### 2. Configure API Key

1. Click the TradePrompt AI extension icon
2. Go to Settings (right-click → Options)
3. Select AI Provider (OpenAI or Claude)
4. Enter your API key
5. Click "Test Connection"

### 3. Start Backend (for subscriptions)

```bash
cd backend
cp .env.example .env
# Edit .env with your Razorpay keys
npm install
npm run dev
```

### 4. Use on TradingView

1. Open any chart on TradingView
2. Click the ⚡ floating button (or extension icon)
3. Select market (India/Forex/Crypto)
4. Click any template for instant AI analysis

## Project Structure

```
├── extension/          # Chrome extension (Manifest V3)
│   ├── popup/          # Quick-access popup UI
│   ├── sidepanel/      # Full analysis panel
│   ├── options/        # Settings & subscription
│   ├── content/        # TradingView integration
│   ├── background/     # Service worker
│   └── lib/            # Core libraries
│       ├── prompt-engine.js
│       ├── ai-client.js
│       ├── license.js
│       └── markets/    # India, Forex, Crypto configs
├── backend/            # Subscription API (Node.js + Razorpay)
└── docs/               # Development guidebook
```

## Supported Markets

### 🇮🇳 Indian Stock Market
- NSE/BSE equity, F&O, currency derivatives
- Session-aware (pre-open, normal, closing)
- F&O options chain analysis
- Intraday, swing, and positional templates

### 💱 Forex
- Major pairs (EUR/USD, GBP/USD, etc.)
- USD/INR via NSE CDS (RBI regulated)
- Session-based strategies (Asian, London, NY)

### ₿ Cryptocurrency
- BTC, ETH, and major altcoins
- BTC dominance analysis
- Indian tax-aware calculations (30% + 1% TDS)

## Documentation

| Document | Description |
|----------|-------------|
| [Development Guidebook](docs/DEVELOPMENT_GUIDEBOOK.md) | Full technical architecture & prompt design |
| [Marketing Kit](docs/MARKETING_KIT.md) | Social posts, YouTube script, email templates (Hindi + English) |
| [Launch Checklist](docs/LAUNCH_CHECKLIST.md) | Step-by-step production deployment |
| [Chrome Web Store Listing](docs/CHROME_WEB_STORE_LISTING.md) | Store submission copy & screenshots guide |
| [Privacy Policy](docs/PRIVACY_POLICY.md) | Required for Chrome Web Store |
| [Terms of Service](docs/TERMS_OF_SERVICE.md) | User agreement |

## Build for Chrome Web Store

```bash
# Extension zip
bash scripts/build-extension.sh

# Store screenshots & promo images
python3 scripts/generate-store-assets.py
# Output: store-assets/generated/

# Razorpay plan setup
RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx node backend/scripts/setup-razorpay.js
```

## Disclaimer

⚠️ **This tool is for educational purposes only.** It is not financial advice. The developers are not SEBI-registered investment advisors. Trading involves substantial risk of loss. Always do your own research.

## License

Proprietary — All rights reserved.
