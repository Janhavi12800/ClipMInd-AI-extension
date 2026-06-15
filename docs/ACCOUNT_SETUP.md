# TradePrompt AI — Account Setup Guide (पूरी गाइड)

यह guide आपको **शून्य से production** तक सभी accounts setup करने में मदद करेगी।

---

## Quick Setup (5 मिनट — Demo Mode)

बिना Razorpay के test करने के लिए:

```bash
cd backend
npm install
npm run setup
# "Skip Razorpay?" → y दबाएं
npm run dev
```

फिर browser में खोलें:
- Landing page: http://localhost:3001
- Checkout: http://localhost:3001/checkout.html
- Admin: http://localhost:3001/admin

Extension load करें:
```
chrome://extensions → Developer Mode ON → Load unpacked → extension/ folder
```

---

## Account 1: Razorpay (Payments — ₹100/month)

### Step 1: Account बनाएं
1. जाएं: **https://dashboard.razorpay.com/signup**
2. Business type: **Individual** या **Private Limited**
3. Email + Phone verify करें

### Step 2: KYC Complete करें
| Document | Required For |
|----------|-------------|
| PAN Card | सभी |
| Aadhaar | Individual |
| Bank Account | Live payments |
| GST (optional) | Business |

> **Test mode** KYC के बिना भी काम करता है (`rzp_test_` keys)

### Step 3: API Keys लें
1. Dashboard → **Settings** → **API Keys**
2. **Generate Test Key** click करें
3. Copy करें:
   - `Key ID` → `rzp_test_xxxxxxxx`
   - `Key Secret` → `xxxxxxxx` (सिर्फ एक बार दिखता है!)

### Step 4: Auto Setup Script चलाएं
```bash
cd backend

# Option A: Interactive wizard
npm run setup

# Option B: Direct with keys
RAZORPAY_KEY_ID=rzp_test_xxxx RAZORPAY_KEY_SECRET=xxxx npm run setup
```

यह automatically:
- Razorpay से connect होगा
- ₹100/month plan बनाएगा
- `.env` file generate करेगा

### Step 5: Test Payment
1. `npm run dev` चलाएं
2. खोलें: http://localhost:3001/checkout.html
3. Test card use करें:
   - Card: `4111 1111 1111 1111`
   - CVV: any 3 digits
   - Expiry: any future date
   - OTP: `1234`

### Step 6: Live Mode (KYC के बाद)
1. Dashboard → API Keys → **Generate Live Key**
2. `.env` में update करें:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   ```
3. फिर से `npm run setup` चलाएं (नया plan बनेगा)

### Step 7: Webhook (Deploy के बाद)
1. Dashboard → **Settings** → **Webhooks**
2. Add New Webhook:
   - URL: `https://YOUR_DEPLOYED_URL/api/webhook/razorpay`
   - Events:
     - `subscription.authenticated`
     - `subscription.charged`
     - `subscription.cancelled`
3. Webhook Secret copy करें → `.env` में `RAZORPAY_WEBHOOK_SECRET=`

---

## Account 2: OpenAI API Key (AI Analysis)

Extension को AI analysis के लिए API key चाहिए।

### Setup
1. जाएं: **https://platform.openai.com/signup**
2. **API Keys** → **Create new secret key**
3. Copy key: `sk-proj-xxxxxxxx`
4. Extension में:
   - Click extension icon → Settings (या right-click → Options)
   - AI Provider: **OpenAI**
   - API Key paste करें
   - **Test Connection** click करें

### Cost Estimate
| Usage | Approx Cost |
|-------|-------------|
| Light (10 prompts/day) | ₹50-100/month |
| Medium (30 prompts/day) | ₹150-300/month |
| Heavy (100 prompts/day) | ₹500+/month |

### Alternative: Claude (Anthropic)
1. **https://console.anthropic.com/**
2. API key: `sk-ant-xxxxxxxx`
3. Extension Settings → Provider: **Claude**

---

## Account 3: Chrome Web Store Developer

### Setup
1. जाएं: **https://chrome.google.com/webstore/devconsole**
2. Google account से login
3. **$5 one-time registration fee** pay करें
4. Developer account active हो जाएगा

### Extension Upload
```bash
# Build zip
bash scripts/build-extension.sh

# Generate screenshots
python3 scripts/generate-store-assets.py
```

Upload करें:
- Zip: `dist/tradeprompt-ai-v1.0.0.zip`
- Screenshots: `store-assets/generated/*.png`
- Listing copy: `docs/CHROME_WEB_STORE_LISTING.md`
- Privacy URL: `https://YOUR_URL/privacy.html`

---

## Account 4: Backend Hosting (Railway — Recommended)

### Free tier पर deploy:

1. जाएं: **https://railway.app**
2. GitHub से login
3. **New Project** → **Deploy from GitHub repo**
4. Select your repo → Set root: `backend`
5. Environment Variables add करें (`.env` से copy):
   ```
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_PLAN_ID=plan_xxx
   ADMIN_SECRET=xxx
   JWT_SECRET=xxx
   API_BASE_URL=https://your-app.up.railway.app
   TRIAL_DAYS=3
   SUBSCRIPTION_AMOUNT=10000
   ```
6. Deploy → URL copy करें
7. `extension/lib/config.js` में production URL update करें

---

## Account 5: Admin Dashboard

Setup wizard automatically `ADMIN_SECRET` generate करता है।

Access:
```
URL: http://localhost:3001/admin  (या deployed URL)
Secret: आपका ADMIN_SECRET (.env से)
```

यहाँ देखें:
- Total subscribers
- Monthly revenue (MRR)
- Recent signups

---

## Verification — सब कुछ check करें

```bash
cd backend
npm run verify
```

Expected output:
```
  ✓ .env file exists
  ✓ JWT_SECRET configured
  ✓ ADMIN_SECRET configured
  ✓ Razorpay connected: your@email.com (TEST)
  ✓ Razorpay Plan ID: plan_xxxx
  ✓ Backend running at http://localhost:3001
  ✓ Extension files found
  ✓ Chrome Web Store assets generated

✅ Ready to go!
```

---

## Complete Setup Checklist

```
RAZORPAY
[ ] Account created at dashboard.razorpay.com
[ ] Test API keys obtained
[ ] npm run setup completed
[ ] Test payment successful at /checkout.html
[ ] KYC done (for live payments)
[ ] Live keys configured
[ ] Webhook configured (after deploy)

AI PROVIDER
[ ] OpenAI or Claude account created
[ ] API key added in extension Settings
[ ] Test Connection successful

EXTENSION
[ ] Loaded in Chrome (developer mode)
[ ] Onboarding completed
[ ] TradingView ⚡ button visible
[ ] 1-click prompt generation works
[ ] Vision analysis works

CHROME WEB STORE
[ ] $5 developer fee paid
[ ] Extension zip built
[ ] Screenshots generated
[ ] Submitted for review

HOSTING
[ ] Backend deployed (Railway/Render)
[ ] Production URL in config.js
[ ] Razorpay webhook pointing to production
[ ] Landing page live
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Razorpay "Invalid key" | Check Key ID + Secret, no extra spaces |
| Demo mode only | Keys में `YOUR` या `DEMO` है — real keys डालें |
| Extension not loading | `chrome://extensions` → Errors check करें |
| AI "API key not configured" | Extension Settings → API key save करें |
| Payment succeeds but no license | Webhook configure करें, या license key manually activate करें |
| CORS error | `API_BASE_URL` सही है check करें |

---

## Support

- Full docs: `docs/DEVELOPMENT_GUIDEBOOK.md`
- Launch guide: `docs/LAUNCH_CHECKLIST.md`
- Marketing: `docs/MARKETING_KIT.md`
- Email: support@tradeprompt.ai
