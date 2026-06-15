# TradePrompt AI — Ab Sell Karo (Fast Guide)

## ✅ Ek Command — Sab Ready

```bash
cd ~/ClipMInd-AI-extension
bash SELL_READY.sh
```

Yeh automatically karega:
1. Backend setup (`.env`)
2. Extension zip banayega (`dist/tradeprompt-ai-v1.0.2.zip`)
3. Server start + full test
4. Batayega kya upload karna hai Chrome Store pe

---

## 3 Tarike Sell Karne Ke

### Tarika 1 — Abhi Test / Demo Sell (₹0 setup)

| Step | Kya karo |
|------|----------|
| 1 | `bash SELL_READY.sh` |
| 2 | Chrome → `chrome://extensions` → Load unpacked → `extension/` |
| 3 | `http://127.0.0.1:3001/app.html` kholo |
| 4 | Customers ko zip bhejo ya GitHub link |

**Payment:** Demo mode — email daalo, license instant activate.

---

### Tarika 2 — Chrome Web Store (Public Sell)

| Item | Location |
|------|----------|
| Extension zip | `dist/tradeprompt-ai-v1.0.2.zip` |
| Screenshots | `store-assets/generated/` |
| Listing text | `docs/CHROME_WEB_STORE_LISTING.md` |
| Privacy URL | Deploy ke baad: `https://YOUR_URL/privacy.html` |
| Dev Console | https://chrome.google.com/webstore/devconsole |
| Fee | $5 one-time |

**Steps:**
1. `bash SELL_READY.sh` — zip ready
2. Chrome Web Store Developer account banao ($5)
3. "New Item" → zip upload
4. Screenshots + description paste (`CHROME_WEB_STORE_LISTING.md` se)
5. Submit for review (1-3 din)

---

### Tarika 3 — Live ₹100/Month (Razorpay)

```bash
cd backend
npm run setup          # Razorpay TEST keys pehle
npm run verify
npm run dev
```

**Razorpay setup:**
1. https://dashboard.razorpay.com → KYC complete
2. LIVE keys lo (`rzp_live_...`)
3. `npm run setup` dubara — LIVE keys daalo

**Deploy backend (free tier):**
- Railway: `backend/` folder connect karo
- Render: `render.yaml` use karo
- Env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, `JWT_SECRET`, `ADMIN_SECRET`, `API_BASE_URL`

**Webhook:**
```
URL: https://YOUR_API_URL/api/webhook/razorpay
Events: subscription.charged, subscription.cancelled
```

**Extension update:**
- Options → API URL = your deployed URL
- Ya `extension/lib/config.js` → production `apiBaseUrl`

---

## Sell Ready Checklist

| Check | Command |
|-------|---------|
| Backend verify | `cd backend && npm run verify` |
| Full sell test | `node scripts/sell-ready-test.mjs` |
| Extension zip | `bash scripts/build-extension.sh` |
| App chalao | `bash KHOLO.sh` |

---

## Pricing (Tumhara Model)

| Plan | Price |
|------|-------|
| Free Trial | 3 din — full features |
| Pro | ₹100/month (Razorpay) |
| AI cost | User apni OpenAI/Claude key lagata hai (BYOK) |

---

## Support Setup (Professional)

- Email: support@tradeprompt.ai (ya apna email)
- Admin panel: `http://YOUR_URL/admin` (ADMIN_SECRET from `.env`)
- Issues: GitHub Issues

---

## Agar Error Aaye

```bash
# Galat folder mein ho?
cd ~/ClipMInd-AI-extension    # YAHAN hona chahiye

# Project nahi hai?
git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git
cd ClipMInd-AI-extension

# Sab fix + test
bash SELL_READY.sh
```
