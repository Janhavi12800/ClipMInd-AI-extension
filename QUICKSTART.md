# TradePrompt AI — Quick Start (2 Minutes)

## One Command Start

```bash
bash scripts/dev.sh
```

Or:

```bash
npm start
```

This will:
1. Install dependencies
2. Create `.env` (demo mode)
3. Start backend on http://localhost:3001

---

## Load Extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

Onboarding page opens automatically. Click **Add API Key**.

---

## Add AI API Key

1. Get key from https://platform.openai.com/api-keys (or Claude)
2. Extension → Settings → **AI Provider** tab
3. Paste key → **Save Settings** → **Test Connection**

---

## First Analysis

1. Open https://www.tradingview.com/chart/
2. Search any symbol: `RELIANCE`, `NIFTY`, `BTCUSDT`
3. Click the **⚡ AI** floating button (bottom right)
4. Select **NSE/BSE Technical Analysis**
5. Click **Analyze with AI** — done!

---

## Test Payment (Demo)

1. Open http://localhost:3001/checkout.html
2. Enter email → Subscribe
3. License auto-activates (no real payment in demo mode)

---

## Production Launch

| Step | Command / Link |
|------|----------------|
| Razorpay setup | `cd backend && npm run setup` |
| Verify config | `npm run verify` |
| Build extension | `npm run build` |
| Store screenshots | `npm run assets` |
| Full guide | [docs/ACCOUNT_SETUP.md](docs/ACCOUNT_SETUP.md) |
| Launch checklist | [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) |

---

## URLs (Local)

| Page | URL |
|------|-----|
| Landing | http://localhost:3001 |
| Checkout | http://localhost:3001/checkout.html |
| Admin | http://localhost:3001/admin |
| Privacy | http://localhost:3001/privacy.html |

---

## Need Help?

- Account setup: `docs/ACCOUNT_SETUP.md`
- Technical docs: `docs/DEVELOPMENT_GUIDEBOOK.md`
- Marketing: `docs/MARKETING_KIT.md`
