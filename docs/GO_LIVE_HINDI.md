# GO LIVE — 5 Minute Production Sell Guide (Hindi)

## Sabse Fast Path

```bash
cd ~/ClipMInd-AI-extension
git pull
bash GO_LIVE.sh
```

---

## Step 1 — Backend Deploy (FREE Render)

1. Open: https://dashboard.render.com
2. **New +** → **Web Service**
3. Connect repo: `Janhavi12800/ClipMInd-AI-extension`
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check:** `/api/health`

5. Environment variables (Render dashboard):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DEMO_MODE` | `false` |
| `API_BASE_URL` | `https://YOUR-APP.onrender.com` |
| `JWT_SECRET` | (random 32 chars) |
| `ADMIN_SECRET` | (random 16 chars) |
| `RAZORPAY_KEY_ID` | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | your secret |
| `RAZORPAY_PLAN_ID` | from setup wizard |
| `TRIAL_DAYS` | `3` |
| `SUBSCRIPTION_AMOUNT` | `10000` |

6. **Deploy** → copy URL e.g. `https://tradeprompt-api.onrender.com`

7. Test:
```bash
curl https://tradeprompt-api.onrender.com/api/health
```

---

## Step 2 — Razorpay LIVE Keys

```bash
cd backend
npm run setup
# LIVE keys daalo (rzp_live_...)
```

Webhook (Razorpay dashboard):
```
URL: https://YOUR-APP.onrender.com/api/webhook/razorpay
Events: subscription.charged, subscription.cancelled
```

---

## Step 3 — Store Zip (API URL baked in)

```bash
bash scripts/build-store.sh https://YOUR-APP.onrender.com
```

Output: `dist/tradeprompt-ai-store-v1.0.3.zip`

---

## Step 4 — Chrome Web Store Upload

| Field | Value |
|-------|-------|
| Zip | `dist/tradeprompt-ai-store-v1.0.3.zip` |
| Privacy URL | `https://YOUR-APP.onrender.com/privacy.html` |
| Screenshots | `store-assets/generated/` |
| Description | `docs/CHROME_WEB_STORE_LISTING.md` |
| Fee | $5 |

Console: https://chrome.google.com/webstore/devconsole

---

## Step 5 — Live Test

```bash
node scripts/sell-ready-test.mjs https://YOUR-APP.onrender.com
```

Browser:
- Checkout: `https://YOUR-APP.onrender.com/checkout.html`
- App: `https://YOUR-APP.onrender.com/app.html`

---

## Sell Ready Status

| Item | After these steps |
|------|-------------------|
| Extension product | ✅ |
| Live backend | ✅ |
| ₹ payments | ✅ (Razorpay LIVE) |
| Chrome Store | ✅ (after upload) |

**Ab poori tarah sell ready.**
