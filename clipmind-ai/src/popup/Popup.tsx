import { useEffect, useState } from 'react';
import type { Clip, ClipStats } from '../types/clip';
import { getClips, getClipStats, onStorageChange } from '../services/storageService';
import { formatRelativeDate } from '../utils/date';
import { StatsCards } from '../components/StatsCards';
import '../styles/global.css';
import './popup.css';

export function Popup() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [stats, setStats] = useState<ClipStats>({ total: 0, text: 0, image: 0, page: 0, categories: 0 });
  const [saving, setSaving] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [duplicateConfirm, setDuplicateConfirm] = useState(false);
  const [pendingWithNote, setPendingWithNote] = useState(false);

  const loadData = async () => {
    const [allClips, clipStats] = await Promise.all([getClips(), getClipStats()]);
    setClips(allClips.slice(0, 5));
    setStats(clipStats);
  };

  useEffect(() => {
    loadData();
    return onStorageChange(loadData);
  }, []);

  const showMessage = (text: string, type: 'success' | 'warning' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const saveCurrentPage = async (withNote = false, force = false) => {
    setSaving(true);
    setDuplicateConfirm(false);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url || tab.url.startsWith('chrome://')) {
        showMessage('Cannot save this page.', 'error');
        return;
      }

      const result = await chrome.runtime.sendMessage({
        type: 'SAVE_PAGE_CLIP',
        payload: {
          pageUrl: tab.url,
          pageTitle: tab.title || tab.url,
          favicon: tab.favIconUrl,
          userNote: withNote ? note : undefined,
          force,
        },
      });

      if (result?.status === 'saved') {
        showMessage('Page saved to ClipMind ✓', 'success');
        setNote('');
        setNoteMode(false);
        await loadData();
      } else if (result?.status === 'duplicate') {
        setDuplicateConfirm(true);
        setPendingWithNote(withNote);
      } else {
        showMessage(result?.message || 'Failed to save page.', 'error');
      }
    } catch {
      showMessage('Failed to save page.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDashboard = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
    } catch {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/sidepanel/index.html') });
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const TYPE_ICONS: Record<string, string> = { text: '📝', image: '🖼️', page: '🌐' };

  return (
    <div className="popup">
      <header className="popup__header">
        <div className="popup__brand">
          <span className="popup__logo">✦</span>
          <div>
            <h1>ClipMind AI</h1>
            <p>Your web memory</p>
          </div>
        </div>
        <button className="cm-btn cm-btn--sm cm-btn--ghost popup__settings-btn" onClick={openSettings} title="Settings">
          ⚙️
        </button>
      </header>

      <div className="popup__actions">
        <button
          className="cm-btn cm-btn--primary popup__save-btn"
          onClick={() => saveCurrentPage(false)}
          disabled={saving}
        >
          {saving ? <span className="cm-spinner" /> : '🌐'} Save Current Page
        </button>
        {!noteMode ? (
          <button className="cm-btn popup__note-btn" onClick={() => setNoteMode(true)}>
            📝 Save with Note
          </button>
        ) : (
          <div className="popup__note-form">
            <textarea
              className="cm-input"
              placeholder="Add a note about this page…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <div className="popup__note-actions">
              <button className="cm-btn cm-btn--sm cm-btn--primary" onClick={() => saveCurrentPage(true)} disabled={saving}>
                Save
              </button>
              <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setNoteMode(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {duplicateConfirm && (
        <div className="popup__duplicate">
          <p>This page is already saved.</p>
          <div className="popup__duplicate-actions">
            <button className="cm-btn cm-btn--sm cm-btn--primary" onClick={() => saveCurrentPage(pendingWithNote, true)}>
              Save Anyway
            </button>
            <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setDuplicateConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`popup__message popup__message--${message.type}`}>{message.text}</div>
      )}

      <StatsCards stats={stats} compact />

      <button className="cm-btn cm-btn--primary popup__dashboard-btn" onClick={openDashboard}>
        Open Dashboard →
      </button>

      <section className="popup__recent">
        <h3>Recent Clips</h3>
        {clips.length === 0 ? (
          <p className="popup__empty">No clips yet. Select text on any page to start.</p>
        ) : (
          <ul className="popup__clip-list">
            {clips.map((clip) => (
              <li key={clip.id} className="popup__clip-item">
                <span>{TYPE_ICONS[clip.type]}</span>
                <div className="popup__clip-info">
                  <span className="popup__clip-title">{clip.title}</span>
                  <span className="popup__clip-meta">{clip.domain} · {formatRelativeDate(clip.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="popup__privacy">
        🔒 Your clips are saved locally in your browser. No account required.
      </footer>
    </div>
  );
}
