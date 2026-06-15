/**
 * AI analysis service — OpenAI when configured, smart fallback otherwise (never throws to user)
 */

import { generateSmartAnalysis } from './smart-analysis.js';

export async function runAnalysis({ system, user, image, apiKey, fast = false }) {
  const key = apiKey || process.env.OPENAI_API_KEY || '';

  if (key && key.startsWith('sk-') && !image) {
    try {
      const result = await callOpenAI({ system, user, key, fast });
      return { content: result, source: 'openai', demo: false };
    } catch (err) {
      console.warn('OpenAI failed, using smart analysis:', err.message);
    }
  }

  if (key && key.startsWith('sk-') && image) {
    try {
      const result = await callOpenAIVision({ system, user, image, key });
      return { content: result, source: 'openai-vision', demo: false };
    } catch (err) {
      console.warn('Vision failed, using smart analysis:', err.message);
    }
  }

  const content = generateSmartAnalysis({ system, user });
  return {
    content,
    source: 'smart-engine',
    demo: true,
    message: key ? undefined : 'Running smart analysis (add OPENAI_API_KEY in backend/.env for GPT)'
  };
}

async function callOpenAI({ system, user, key, fast }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: fast ? 'gpt-4o-mini' : 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system || 'You are TradePrompt AI, expert trading analyst. Educational only.' },
        { role: 'user', content: user }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenAI ${res.status}`);
  return data.choices[0].message.content;
}

async function callOpenAIVision({ system, user, image, key }) {
  const imageUrl = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system || 'You are TradePrompt AI chart analyst. Educational only.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: user },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `OpenAI vision ${res.status}`);
  return data.choices[0].message.content;
}
