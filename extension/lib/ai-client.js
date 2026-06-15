/**
 * AI Client — backend first, never throws errors to user
 */

import { getApiBaseUrl } from './config.js';

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
      if (data.content) {
        return { content: data.content, provider: data.source || 'backend', demo: data.demo };
      }
    } catch { /* backend down */ }

    if (this.apiKey?.startsWith('sk-')) {
      try {
        return await this._callOpenAIDirect(prompt, options);
      } catch { /* openai failed */ }
    }

    return {
      content: prompt.user,
      provider: 'prompt',
      demo: true
    };
  }

  async _callOpenAIDirect(prompt, options) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    const data = await res.json();
    if (!res.ok || !data.choices?.[0]?.message?.content) {
      throw new Error('openai failed');
    }
    return { content: data.choices[0].message.content, provider: 'openai', demo: false };
  }
}

export async function getAISettings() {
  const [sync, local] = await Promise.all([
    chrome.storage.sync.get(['aiProvider', 'apiKey']),
    chrome.storage.local.get(['apiKey'])
  ]);
  return {
    provider: sync.aiProvider || 'openai',
    apiKey: sync.apiKey || local.apiKey || ''
  };
}

export async function createAIClient() {
  const settings = await getAISettings();
  return new AIClient(settings.provider, settings.apiKey);
}
