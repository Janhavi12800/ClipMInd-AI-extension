import { useEffect, useState } from 'react';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';
import { getSettings, saveSettings } from '../services/settingsService';
import { initAIProvider } from '../services/ai/providerFactory';
import type { ProviderType } from '../services/ai/providerFactory';
import '../styles/global.css';
import './options.css';

const PROVIDERS: { value: ProviderType; label: string; description: string }[] = [
  { value: 'mock', label: 'Mock (Local)', description: 'Free, works offline. Uses smart keyword rules.' },
  { value: 'openai', label: 'OpenAI', description: 'GPT models. Requires API key.' },
  { value: 'gemini', label: 'Google Gemini', description: 'Gemini models. Requires API key.' },
  { value: 'claude', label: 'Anthropic Claude', description: 'Claude models. Requires API key.' },
];

export function Options() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveSettings(settings);
    await initAIProvider();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="options options--loading">
        <span className="cm-spinner" />
      </div>
    );
  }

  return (
    <div className="options">
      <header className="options__header">
        <div className="options__brand">
          <span className="options__logo">✦</span>
          <div>
            <h1>ClipMind AI Settings</h1>
            <p>Configure your local preferences</p>
          </div>
        </div>
      </header>

      <section className="options__section cm-glass-card">
        <h2>AI Provider</h2>
        <p className="options__hint">Choose how ClipMind generates summaries, tags, and answers.</p>

        <div className="options__providers">
          {PROVIDERS.map((p) => (
            <label key={p.value} className={`options__provider ${settings.aiProvider === p.value ? 'options__provider--active' : ''}`}>
              <input
                type="radio"
                name="provider"
                value={p.value}
                checked={settings.aiProvider === p.value}
                onChange={() => handleChange('aiProvider', p.value)}
              />
              <div>
                <strong>{p.label}</strong>
                <span>{p.description}</span>
              </div>
            </label>
          ))}
        </div>

        {settings.aiProvider === 'openai' && (
          <div className="options__field">
            <label htmlFor="openai-key">OpenAI API Key</label>
            <input
              id="openai-key"
              className="cm-input"
              type="password"
              placeholder="sk-…"
              value={settings.openaiApiKey}
              onChange={(e) => handleChange('openaiApiKey', e.target.value)}
            />
          </div>
        )}

        {settings.aiProvider === 'gemini' && (
          <div className="options__field">
            <label htmlFor="gemini-key">Gemini API Key</label>
            <input
              id="gemini-key"
              className="cm-input"
              type="password"
              placeholder="AIza…"
              value={settings.geminiApiKey}
              onChange={(e) => handleChange('geminiApiKey', e.target.value)}
            />
          </div>
        )}

        {settings.aiProvider === 'claude' && (
          <div className="options__field">
            <label htmlFor="claude-key">Claude API Key</label>
            <input
              id="claude-key"
              className="cm-input"
              type="password"
              placeholder="sk-ant-…"
              value={settings.claudeApiKey}
              onChange={(e) => handleChange('claudeApiKey', e.target.value)}
            />
          </div>
        )}
      </section>

      <section className="options__section cm-glass-card">
        <h2>Appearance</h2>
        <label className="options__toggle">
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={(e) => handleChange('darkMode', e.target.checked)}
          />
          <span>Dark mode (dashboard &amp; settings)</span>
        </label>
      </section>

      <section className="options__section cm-glass-card">
        <h2>Capture</h2>
        <label className="options__toggle">
          <input
            type="checkbox"
            checked={settings.showSelectionBubble}
            onChange={(e) => handleChange('showSelectionBubble', e.target.checked)}
          />
          <span>Show floating bubble on text selection</span>
        </label>
      </section>

      <section className="options__section cm-glass-card options__privacy">
        <h2>Privacy</h2>
        <p>
          Your clips and API keys are stored locally in <code>chrome.storage.local</code>.
          No data is sent to ClipMind servers. When you connect a real AI provider,
          content is sent only to that provider&apos;s API.
        </p>
      </section>

      <footer className="options__footer">
        <button className="cm-btn cm-btn--primary" onClick={handleSave}>
          Save Settings
        </button>
        {saved && <span className="options__saved">✓ Settings saved</span>}
      </footer>
    </div>
  );
}
