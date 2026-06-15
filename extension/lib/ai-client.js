/**
 * AI Client — OpenAI, Claude, and Vision model integration
 */

export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      text: 'gpt-4o',
      vision: 'gpt-4o',
      fast: 'gpt-4o-mini'
    },
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    })
  },
  claude: {
    name: 'Anthropic Claude',
    models: {
      text: 'claude-sonnet-4-20250514',
      vision: 'claude-sonnet-4-20250514',
      fast: 'claude-3-5-haiku-20241022'
    },
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    })
  }
};

export class AIClient {
  constructor(provider = 'openai', apiKey = '') {
    this.provider = provider;
    this.apiKey = apiKey;
    this.config = AI_PROVIDERS[provider];
  }

  async analyze(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not configured. Go to Settings to add your API key.');
    }

    const model = options.vision
      ? this.config.models.vision
      : options.fast
        ? this.config.models.fast
        : this.config.models.text;

    if (this.provider === 'openai') {
      return this._callOpenAI(prompt, model, options);
    }
    if (this.provider === 'claude') {
      return this._callClaude(prompt, model, options);
    }
    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  async _callOpenAI(prompt, model, options) {
    const messages = [
      { role: 'system', content: prompt.system },
      { role: 'user', content: this._buildOpenAIContent(prompt.user, options.image) }
    ];

    const body = {
      model,
      messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.3
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: this.config.headers(this.apiKey),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      provider: 'openai'
    };
  }

  async _callClaude(prompt, model, options) {
    const content = [];

    if (options.image) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: options.imageMediaType || 'image/png',
          data: options.image.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }

    content.push({ type: 'text', text: prompt.user });

    const body = {
      model,
      max_tokens: options.maxTokens || 2000,
      system: prompt.system,
      messages: [{ role: 'user', content }],
      temperature: options.temperature || 0.3
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: this.config.headers(this.apiKey),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
      provider: 'claude'
    };
  }

  _buildOpenAIContent(text, imageBase64) {
    if (!imageBase64) return text;

    return [
      { type: 'text', text },
      {
        type: 'image_url',
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
          detail: 'high'
        }
      }
    ];
  }

  async captureChartScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 90
    });

    return dataUrl;
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
    model: sync.aiModel || 'gpt-4o'
  };
}

export async function createAIClient() {
  const settings = await getAISettings();
  return new AIClient(settings.provider, settings.apiKey);
}
