# ⚡ TradePrompt AI — SIRF AAPKO YE 5 KAAM KARNE HAIN

> Baaki **sab kuch ready** hai — code, backend, extension, payment, marketing, screenshots.

---

## ✅ Maine (AI) Jo Kar Diya — Aapko Nahi Karna

- [x] Poora Chrome Extension banaya
- [x] 10+ Trading prompt templates (NSE/BSE, Forex, Crypto)
- [x] Vision AI chart analysis
- [x] Payment system (₹100/month, 3-day trial)
- [x] Landing page + checkout page
- [x] Admin dashboard
- [x] Marketing posts (Hindi + English)
- [x] Chrome Store screenshots
- [x] Extension zip file
- [x] Setup scripts
- [x] Poori documentation

---

## 🔴 SIRF AAPKO YE 5 KAAM (Koi aur nahi kar sakta)

### Kaam 1: Project Download (2 min) — Password NAHI

**Option A — ZIP (Sabse aasaan, password nahi):**
1. Kholo: https://github.com/Janhavi12800/ClipMInd-AI-extension
2. Green **Code** button → **Download ZIP**
3. ZIP extract karo `Downloads` folder mein
4. Terminal kholo:
```bash
cd ~/Downloads/ClipMInd-AI-extension-*
bash scripts/install-local.sh
```

**Option B — Git:**
```bash
cd ~
git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git
cd ClipMInd-AI-extension
bash scripts/install-local.sh
```

---

### Kaam 2: Backend Start (1 min) — Password NAHI

```bash
cd ~/Downloads/ClipMInd-AI-extension-*/backend
npm run dev
```

Browser mein check: http://localhost:3001

---

### Kaam 3: Chrome Extension Load (2 min) — Password NAHI

1. Chrome kholo
2. Address bar: `chrome://extensions`
3. **Developer mode** ON (top right)
4. **Load unpacked** click
5. Folder select: `extension` (project ke andar)

---

### Kaam 4: OpenAI API Key (5 min) — Aapka account chahiye

> Ye **free nahi** hai but bahut sasta (~₹50-200/month)

1. Jao: https://platform.openai.com/signup
2. Account banao
3. **API Keys** → **Create new secret key**
4. Extension → **Settings** → **AI Provider** → key paste → Save
5. **Test Connection** click

---

### Kaam 5: Test Karo (2 min) — Password NAHI

1. Kholo: https://www.tradingview.com/chart/
2. Search: `RELIANCE` ya `NIFTY`
3. **⚡ AI** button click (bottom right)
4. Template select → Analysis dekho

**✅ Agar analysis aaya = SAB KAAM KAR RAHA HAI!**

---

## 🟡 BAAD MEIN (Jab Sell Karna Ho)

Ye tab karna jab extension test ho jaye:

| Kaam | Kahan | Cost | Time |
|------|-------|------|------|
| Razorpay account | dashboard.razorpay.com | Free | 30 min + KYC |
| Backend deploy | railway.app | Free tier | 15 min |
| Chrome Web Store | chrome.google.com/webstore/devconsole | $5 | 1-2 days review |

Inke liye guide: `docs/LAUNCH_CHECKLIST.md`

---

## ❓ Problem?

| Error | Fix |
|-------|-----|
| `npm: command not found` | `bash scripts/install-local.sh` dubara chalao |
| `password mang raha` | `sudo` mat use karo — ZIP download karo |
| API key error | OpenAI key sahi paste karo Settings mein |
| ⚡ button nahi dikh raha | TradingView page refresh karo |

---

## 📁 Important Files

| File | Kya hai |
|------|---------|
| `extension/` | Chrome mein load karna hai |
| `dist/*.zip` | Chrome Store upload ke liye |
| `backend/` | Server (npm run dev) |
| `docs/LAUNCH_CHECKLIST.md` | Sell karne ki guide |

---

**Bottom line: ZIP download → install script → backend start → extension load → API key → test. Bas!**
