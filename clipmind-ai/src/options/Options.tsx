import { useEffect, useState } from 'react';
import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';
import { getSettings, saveSettings } from '../services/settingsService';
import { initAIProvider } from '../services/ai/providerFactory';
import type { ProviderType } from '../services/ai/providerFactory';
import { getSyncStatus, type SyncStatus } from '../services/syncService';
import '../styles/global.css';
import './options.css';

const PROVIDERS: { value: ProviderType; label: string; description: string }[] = [
  { value: 'mock', label: 'Mock (Local)', description: 'Free, works offline. Uses smart keyword rules.' },
  { value: 'openai', label: 'OpenAI', description: 'GPT-4o-mini. Requires API key.' },
  { value: 'gemini', label: 'Google Gemini', description: 'Gemini 1.5 Flash. Requires API key.' },
  { value: 'claude', label: 'Anthropic Claude', description: 'Claude 3.5 Haiku. Requires API key.' },
];

const SHORTCUTS = [
  { keys: 'Ctrl+Shift+S', action: 'Save selected text (with summary)' },
  { keys: 'Ctrl+Shift+P', action: 'Save current page' },
  { keys: 'Ctrl+Shift+M', action: 'Open dashboard' },
];

export function Options() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadSyncStatus = () => getSyncStatus().then(setSyncStatus);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
    loadSyncStatus();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = async () => {
    await saveSettings(settings);
    await initAIProvider();
    setSaved(true);
    loadSyncStatus();
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await saveSettings(settings);
    const result = await chrome.runtime.sendMessage({
      type: 'TEST_AI_PROVIDER',
      payload: { provider: settings.aiProvider },
    });
    setTestResult(result);
    setTesting(false);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    await saveSettings(settings);
    await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    await loadSyncStatus();
    setSyncing(false);
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

        <div className="options__test-row">
          <button className="cm-btn cm-btn--sm" onClick={handleTest} disabled={testing}>
            {testing ? <span className="cm-spinner" /> : '🔌'} Test Connection
          </button>
          {testResult && (
            <span className={`options__test-result ${testResult.ok ? 'options__test-result--ok' : 'options__test-result--err'}`}>
              {testResult.message}
            </span>
          )}
        </div>
      </section>

      <section className="options__section cm-glass-card">
        <h2>Cross-Device Sync</h2>
        <p className="options__hint">
          Sync your 40 most recent clips and projects via Chrome Sync (requires signed-in Chrome).
          API keys are never synced.
        </p>
        <label className="options__toggle">
          <input
            type="checkbox"
            checked={settings.enableSync}
            onChange={(e) => handleChange('enableSync', e.target.checked)}
          />
          <span>Enable cross-device sync</span>
        </label>
        {syncStatus && settings.enableSync && (
          <div className="options__sync-status">
            <p>Last sync: {syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'Never'}</p>
            <p>Synced clips: {syncStatus.clipCount}</p>
            {syncStatus.error && <p className="options__sync-error">{syncStatus.error}</p>}
            <button className="cm-btn cm-btn--sm" onClick={handleSyncNow} disabled={syncing}>
              {syncing ? <span className="cm-spinner" /> : '🔄'} Sync Now
            </button>
          </div>
        )}
      </section>

      <section className="options__section cm-glass-card">
        <h2>Keyboard Shortcuts</h2>
        <p className="options__hint">Customize at chrome://extensions/shortcuts</p>
        <ul className="options__shortcuts">
          {SHORTCUTS.map((s) => (
            <li key={s.keys}>
              <kbd>{s.keys}</kbd>
              <span>{s.action}</span>
            </li>
          ))}
        </ul>
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
          Clips are stored in <code>chrome.storage.local</code>. API keys stay on this device only.
          When using a real AI provider, clip content is sent to that provider&apos;s API.
          No ClipMind servers or tracking.
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
