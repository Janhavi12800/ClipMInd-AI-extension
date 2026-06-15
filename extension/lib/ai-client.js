/**
 * AI Client — uses backend proxy first (no user API key needed), never shows errors
 */

import { getApiBaseUrl } from './config.js';

export const AI_PROVIDERS = {
  openai: { name: 'OpenAI', models: { text: 'gpt-4o-mini', vision: 'gpt-4o-mini', fast: 'gpt-4o-mini' } },
  claude: { name: 'Claude', models: { text: 'claude-sonnet-4-20250514', vision: 'claude-sonnet-4-20250514', fast: 'claude-3-5-haiku-20241022' } }
};

export class AIClient {
  constructor(provider = 'openai', apiKey = '') {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  async analyze(prompt, options = {}) {
    const baseUrl = await getApiBaseUrl();

    try {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: prompt.system,
          user: prompt.user,
          image: options.image,
          apiKey: this.apiKey || undefined,
          fast: options.fast || !options.vision,
          symbol: options.symbol,
          market: options.market,
          timeframe: options.timeframe
        })
      });

      const data = await res.json();
      if (data.success && data.content) {
        return {
          content: data.content,
          provider: data.source || 'backend',
          demo: data.demo
        };
      }
    } catch (err) {
      console.warn('[TradePrompt] Backend AI unavailable:', err.message);
    }

    if (this.apiKey?.startsWith('sk-')) {
      try {
        return await this._callOpenAIDirect(prompt, options);
      } catch (err) {
        console.warn('[TradePrompt] Direct OpenAI failed:', err.message);
      }
    }

    const fallback = await this._backendFallback(prompt, options);
    return fallback;
  }

  async _backendFallback(prompt, options) {
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: prompt.system, user: prompt.user, fast: true })
      });
      const data = await res.json();
      if (data.content) {
        return { content: data.content, provider: 'smart-engine', demo: true };
      }
    } catch { /* ignore */ }

    return {
      content: prompt.user + '\n\n---\n📋 Prompt ready. Copy and use in ChatGPT, or start backend: npm run dev',
      provider: 'prompt-only',
      demo: true
    };
  }

  async _callOpenAIDirect(prompt, options) {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: options.image
        ? [
            { type: 'text', text: prompt.user },
            { type: 'image_url', image_url: { url: options.image.startsWith('data:') ? options.image : `data:image/png;base64,${options.image}`, detail: 'high' } }
          ]
        : prompt.user
      }
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message);
    return { content: data.choices[0].message.content, provider: 'openai', demo: false };
  }
}

export async function getAISettings() {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(['aiProvider', 'apiKey', 'aiModel']),
    chrome.storage.local.get(['apiKey', 'aiProvider'])
  ]);
  return {
    provider: sync.aiProvider || local.aiProvider || 'openai',
    apiKey: sync.apiKey || local.apiKey || '',
    model: sync.aiModel || 'gpt-4o-mini'
  };
}

export async function createAIClient() {
  const settings = await getAISettings();
  return new AIClient(settings.provider, settings.apiKey);
}
