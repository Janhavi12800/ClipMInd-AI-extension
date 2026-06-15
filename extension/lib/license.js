/**
 * License & Subscription Manager
 * 3-day trial → ₹100/month via Razorpay
 */

import { getApiBaseUrl } from './config.js';

const TRIAL_DAYS = 3;
const SUBSCRIPTION_PRICE = 100; // INR
const STORAGE_KEYS = {
  installDate: 'tp_installDate',
  licenseKey: 'tp_licenseKey',
  subscriptionStatus: 'tp_subscriptionStatus',
  subscriptionExpiry: 'tp_subscriptionExpiry',
  userEmail: 'tp_userEmail',
  dailyUsage: 'tp_dailyUsage',
  lastUsageDate: 'tp_lastUsageDate'
};

export const LICENSE_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  NONE: 'none'
};

export const PLAN = {
  name: 'TradePrompt AI Pro',
  price: SUBSCRIPTION_PRICE,
  currency: 'INR',
  interval: 'monthly',
  trialDays: TRIAL_DAYS,
  features: [
    'Unlimited 1-click prompt generation',
    'Vision AI chart analysis',
    'NSE/BSE, Forex & Crypto templates',
    'Multi-indicator confluence analysis',
    'Volatility analysis engine',
    'Priority updates & new templates'
  ],
  freeLimits: {
    dailyPrompts: 5,
    visionAnalysis: 2
  },
  proLimits: {
    dailyPrompts: 100,
    visionAnalysis: 50
  }
};

export class LicenseManager {
  constructor(apiBaseUrl) {
    this._apiBaseUrl = apiBaseUrl || null;
  }

  async getApiBaseUrl() {
    if (this._apiBaseUrl) return this._apiBaseUrl;
    return await getApiBaseUrl();
  }

  async initialize() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.installDate);
    if (!stored[STORAGE_KEYS.installDate]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.installDate]: Date.now(),
        [STORAGE_KEYS.subscriptionStatus]: LICENSE_STATUS.TRIAL
      });
    }
  }

  async getStatus() {
    await this.initialize();
    const data = await chrome.storage.local.get(Object.values(STORAGE_KEYS));

    const serverStatus = await this._verifyWithServer(data[STORAGE_KEYS.licenseKey]);
    if (serverStatus) {
      return serverStatus;
    }

    const installDate = data[STORAGE_KEYS.installDate];
    const trialEnd = installDate + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (data[STORAGE_KEYS.subscriptionStatus] === LICENSE_STATUS.ACTIVE) {
      const expiry = data[STORAGE_KEYS.subscriptionExpiry];
      if (expiry && now < expiry) {
        return {
          status: LICENSE_STATUS.ACTIVE,
          daysRemaining: Math.ceil((expiry - now) / (24 * 60 * 60 * 1000)),
          plan: PLAN.name
        };
      }
      return { status: LICENSE_STATUS.EXPIRED, message: 'Subscription expired. Renew for ₹100/month.' };
    }

    if (now < trialEnd) {
      const daysLeft = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));
      return {
        status: LICENSE_STATUS.TRIAL,
        daysRemaining: daysLeft,
        trialTotal: TRIAL_DAYS,
        message: `Free trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
      };
    }

    const apiBaseUrl = await this.getApiBaseUrl();
    return {
      status: LICENSE_STATUS.EXPIRED,
      message: 'Trial ended. Subscribe for ₹100/month to continue.',
      upgradeUrl: `${apiBaseUrl}/subscribe`
    };
  }

  async canUseFeature(feature = 'prompt') {
    const status = await this.getStatus();
    const apiBaseUrl = await this.getApiBaseUrl();
    const isLocal = apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');

    if (isLocal) {
      return { allowed: true, remaining: 999 };
    }

    if (status.status === LICENSE_STATUS.ACTIVE) {
      return this._checkDailyLimit(PLAN.proLimits, feature);
    }

    if (status.status === LICENSE_STATUS.TRIAL) {
      return this._checkDailyLimit(PLAN.proLimits, feature);
    }

    return { allowed: false, reason: status.message };
  }

  async _checkDailyLimit(limits, feature) {
    const today = new Date().toDateString();
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.dailyUsage,
      STORAGE_KEYS.lastUsageDate
    ]);

    let usage = data[STORAGE_KEYS.dailyUsage] || 0;
    if (data[STORAGE_KEYS.lastUsageDate] !== today) {
      usage = 0;
      await chrome.storage.local.set({
        [STORAGE_KEYS.dailyUsage]: 0,
        [STORAGE_KEYS.lastUsageDate]: today
      });
    }

    const limit = feature === 'vision' ? limits.visionAnalysis : limits.dailyPrompts;

    if (usage >= limit) {
      return { allowed: false, reason: `Daily limit reached (${limit}). Resets tomorrow.` };
    }

    return { allowed: true, remaining: limit - usage };
  }

  async incrementUsage() {
    const today = new Date().toDateString();
    const data = await chrome.storage.local.get([
      STORAGE_KEYS.dailyUsage,
      STORAGE_KEYS.lastUsageDate
    ]);

    let usage = data[STORAGE_KEYS.dailyUsage] || 0;
    if (data[STORAGE_KEYS.lastUsageDate] !== today) usage = 0;

    await chrome.storage.local.set({
      [STORAGE_KEYS.dailyUsage]: usage + 1,
      [STORAGE_KEYS.lastUsageDate]: today
    });
  }

  async activateSubscription(licenseData) {
    const expiry = typeof licenseData.expiry === 'number'
      ? licenseData.expiry
      : new Date(licenseData.expiry).getTime();

    await chrome.storage.local.set({
      [STORAGE_KEYS.licenseKey]: licenseData.licenseKey,
      [STORAGE_KEYS.subscriptionStatus]: LICENSE_STATUS.ACTIVE,
      [STORAGE_KEYS.subscriptionExpiry]: expiry,
      [STORAGE_KEYS.userEmail]: licenseData.email || ''
    });
  }

  async activateWithKey(licenseKey) {
    const apiBaseUrl = await this.getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/activate-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Invalid license key');

    await this.activateSubscription({
      licenseKey: data.licenseKey,
      expiry: new Date(data.expiry).getTime(),
      email: data.email
    });

    return data;
  }

  async getCheckoutUrl(email = '') {
    const apiBaseUrl = await this.getApiBaseUrl();
    const extId = chrome.runtime.id;
    const params = new URLSearchParams({ email, ext_id: extId });
    return `${apiBaseUrl}/checkout.html?${params}`;
  }

  async startSubscription(email) {
    try {
      const apiBaseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: 'monthly' })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Subscription failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  async _verifyWithServer(licenseKey) {
    if (!licenseKey) return null;

    try {
      const apiBaseUrl = await this.getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      if (!response.ok) return null;
      const data = await response.json();

      if (data.valid) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.subscriptionStatus]: LICENSE_STATUS.ACTIVE,
          [STORAGE_KEYS.subscriptionExpiry]: new Date(data.expiry).getTime()
        });
        return {
          status: LICENSE_STATUS.ACTIVE,
          daysRemaining: data.daysRemaining,
          plan: PLAN.name
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const DISCLAIMER = `
⚠️ IMPORTANT DISCLAIMER

TradePrompt AI provides AI-generated trading analysis for EDUCATIONAL PURPOSES ONLY.

• This is NOT financial advice, investment recommendation, or a solicitation to buy/sell any security
• Past performance does not guarantee future results
• AI analysis may contain errors — always verify with your own research
• Trading involves substantial risk of loss — only trade with capital you can afford to lose
• Indian residents must comply with SEBI, RBI, and IT regulations
• 30% tax + 1% TDS applies on crypto gains in India
• The developers are not SEBI-registered investment advisors

By using this extension, you acknowledge these risks and agree to our Terms of Service.
`;

export const RISK_WARNINGS = {
  general: 'Never risk more than 1-2% of your capital on a single trade.',
  india: 'Ensure compliance with SEBI regulations. ASM/GSM stocks have trading restrictions.',
  forex: 'Forex trading by Indian residents through offshore brokers exists in a regulatory grey area.',
  crypto: '30% flat tax on crypto gains. Losses cannot be offset against other income in India.',
  leverage: 'Leveraged trading amplifies both gains AND losses. Use with extreme caution.',
  ai: 'AI can hallucinate price levels and indicators. Always cross-verify with the actual chart.'
};
