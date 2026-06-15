# TradePrompt AI — Production Launch Checklist

## Phase 1: Razorpay Setup (30 min)

- [ ] Create account at https://dashboard.razorpay.com
- [ ] Complete KYC verification
- [ ] Go to **Subscriptions → Plans → Create Plan**
  - Name: `TradePrompt AI Pro`
  - Amount: `₹100`
  - Billing: `Monthly`
  - Copy **Plan ID** (e.g. `plan_xxxx`)
- [ ] Go to **Settings → API Keys**
  - Copy **Key ID** and **Key Secret**
- [ ] Go to **Settings → Webhooks**
  - URL: `https://YOUR_API_URL/api/webhook/razorpay`
  - Events: `subscription.charged`, `subscription.cancelled`
  - Copy **Webhook Secret**

## Phase 2: Backend Deploy (20 min)

### Option A: Railway
```bash
cd backend
# Connect GitHub repo in Railway dashboard
# Set environment variables:
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_PLAN_ID=plan_xxx
RAZORPAY_WEBHOOK_SECRET=xxx
API_BASE_URL=https://your-app.up.railway.app
SUBSCRIPTION_AMOUNT=10000
TRIAL_DAYS=3
```

### Option B: Render
```bash
# Use render.yaml — connect repo in Render dashboard
# Set same env vars as above
```

### Option C: VPS (Docker)
```bash
cd backend
docker build -t tradeprompt-api .
docker run -d -p 3001:3001 \
  -e RAZORPAY_KEY_ID=rzp_live_xxx \
  -e RAZORPAY_KEY_SECRET=xxx \
  -e RAZORPAY_PLAN_ID=plan_xxx \
  -v tradeprompt-data:/app/data \
  tradeprompt-api
```

- [ ] Verify: `curl https://YOUR_API_URL/api/health`
- [ ] Test checkout: open `https://YOUR_API_URL/checkout.html`

## Phase 3: Update Extension for Production

- [ ] Edit `extension/lib/config.js` — set production `apiBaseUrl`
- [ ] Build zip: `bash scripts/build-extension.sh`
- [ ] Test locally with production API URL

## Phase 4: Chrome Web Store (1-2 days review)

- [ ] Pay $5 developer fee: https://chrome.google.com/webstore/devconsole
- [ ] Upload `dist/tradeprompt-ai-v1.0.0.zip`
- [ ] Fill listing (use `docs/CHROME_WEB_STORE_LISTING.md`)
- [ ] Add screenshots (1280x800):
  1. Popup with templates
  2. Side panel analysis
  3. TradingView integration
  4. Vision analysis result
  5. Settings/subscription page
- [ ] Privacy policy URL (host `docs/PRIVACY_POLICY.md` on GitHub or your site)
- [ ] Submit for review

## Phase 5: Go Live

- [ ] Test full flow: Install → Trial → Subscribe → Pay → Activate
- [ ] Set up support email: support@tradeprompt.ai
- [ ] Share on social media / trading communities
- [ ] Monitor Razorpay dashboard for payments

## Pricing Summary

| Item | Cost |
|------|------|
| Chrome Web Store | $5 one-time |
| Railway/Render hosting | ~$5/month (free tier available) |
| Razorpay fees | 0.9% per transaction |
| Domain (optional) | ~₹800/year |
| **Your revenue per user** | **₹100/month** |

## Support Channels to Set Up

- Email: support@tradeprompt.ai
- Telegram group (optional)
- WhatsApp support (optional, popular in India)

## Marketing Ideas

1. YouTube demo: "AI Trading Prompts for Indian Stock Market"
2. Post in r/IndianStreetBets, TradingView community
3. Hindi + English content for wider reach
4. Free trial → word of mouth
