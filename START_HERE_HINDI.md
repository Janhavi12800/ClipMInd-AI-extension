# TradePrompt AI — Ab Seedha Chalega

## ⚡ SELL READY (Sabse Pehle Ye Chalao)

```bash
cd ~/ClipMInd-AI-extension
bash SELL_READY.sh
```

Yeh ek command mein: setup + test + extension zip + sell instructions.

Full guide: **docs/SELL_NOW_HINDI.md**

---

## Sabse Aasaan Tarika (Extension ki zaroorat NAHI)

### Step 1 — Backend chalao

```bash
cd /home/blocksone/ClipMInd-AI-extension/ClipMInd-AI-extension-main/backend
npm run dev
```

### Step 2 — Browser mein kholo

```
http://localhost:3001/app.html
```

**Bas!** Yahi se poora app chalega — market select, template, AI analysis sab.

### Step 3 — OpenAI API Key

1. https://platform.openai.com/api-keys pe jao
2. Key banao (sk-...)
3. App mein paste karo → Save

### Step 4 — TradingView (optional)

TradingView pe chart kholo → extension icon → ya seedha app.html use karo.

---

## Agar purana code hai (ZIP se download kiya)

GitHub se latest lo:

```bash
cd /home/blocksone/ClipMInd-AI-extension
git clone https://github.com/Janhavi12800/ClipMInd-AI-extension.git fresh
cd fresh/backend
npm install
npm run setup:demo
npm run dev
```

Phir browser: **http://localhost:3001/app.html**

---

## Links

| Page | URL |
|------|-----|
| **Main App** | http://localhost:3001/app.html |
| Landing | http://localhost:3001/ |
| Admin | http://localhost:3001/admin.html |
| Health | http://localhost:3001/health |

---

## Extension (optional)

Chrome → `chrome://extensions` → Load unpacked → `extension` folder

Agar onboarding buttons kaam na karein — **app.html use karo**, woh 100% kaam karega.

---

**Support:** GitHub Issues — https://github.com/Janhavi12800/ClipMInd-AI-extension/issues
