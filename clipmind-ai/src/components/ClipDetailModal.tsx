import { useState } from 'react';
import type { Clip } from '../types/clip';
import type { Project } from '../types/project';
import { formatDate } from '../utils/date';
import { clipToMarkdown } from '../utils/markdown';
import { runAIActionOnClip } from '../services/clipService';

interface ClipDetailModalProps {
  clip: Clip;
  projects: Project[];
  onClose: () => void;
  onUpdate: (clip: Clip) => void;
  onDelete: (id: string) => void;
}

export function ClipDetailModal({ clip, projects, onClose, onUpdate, onDelete }: ClipDetailModalProps) {
  const [note, setNote] = useState(clip.userNote || '');
  const [editingNote, setEditingNote] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [localClip, setLocalClip] = useState(clip);

  const project = projects.find((p) => p.id === localClip.projectId);

  const handleAIAction = async (action: 'summarize' | 'explain' | 'bullets' | 'tasks') => {
    setLoading(action);
    try {
      const updated = await runAIActionOnClip(localClip.id, action);
      if (updated) {
        setLocalClip(updated);
        onUpdate(updated);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleSaveNote = async () => {
    const { updateClip } = await import('../services/storageService');
    const updated = await updateClip(localClip.id, { userNote: note });
    if (updated) {
      setLocalClip(updated);
      onUpdate(updated);
      setEditingNote(false);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    const { updateClip } = await import('../services/storageService');
    const updated = await updateClip(localClip.id, { projectId });
    if (updated) {
      setLocalClip(updated);
      onUpdate(updated);
    }
  };

  const handleCopyMarkdown = async () => {
    const md = clipToMarkdown(localClip);
    await navigator.clipboard.writeText(md);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cm-glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="cm-badge">{localClip.type}</span>
            <span className="cm-badge">{localClip.category}</span>
            {project && <span className="cm-badge cm-badge--project">{project.name}</span>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <h2 className="modal-title">{localClip.title}</h2>

        {localClip.type === 'image' && localClip.imageUrl && (
          <img src={localClip.imageUrl} alt={localClip.imageAlt || ''} className="modal-image" />
        )}

        {localClip.summary && (
          <section className="modal-section">
            <h4>Summary</h4>
            <p>{localClip.summary}</p>
          </section>
        )}

        {localClip.explanation && (
          <section className="modal-section">
            <h4>Explanation</h4>
            <p>{localClip.explanation}</p>
          </section>
        )}

        {localClip.content && localClip.type !== 'page' && (
          <section className="modal-section">
            <h4>Content</h4>
            <p className="modal-content-text">{localClip.content}</p>
          </section>
        )}

        {localClip.bulletPoints && localClip.bulletPoints.length > 0 && (
          <section className="modal-section">
            <h4>Bullet Points</h4>
            <ul className="modal-list">
              {localClip.bulletPoints.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </section>
        )}

        {localClip.taskList && localClip.taskList.length > 0 && (
          <section className="modal-section">
            <h4>Task List</h4>
            <ul className="modal-list">
              {localClip.taskList.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        )}

        <section className="modal-section">
          <div className="modal-section-header">
            <h4>Note</h4>
            {!editingNote && (
              <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setEditingNote(true)}>
                Edit
              </button>
            )}
          </div>
          {editingNote ? (
            <div>
              <textarea
                className="cm-input modal-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a personal note…"
              />
              <div className="modal-note-actions">
                <button className="cm-btn cm-btn--sm cm-btn--primary" onClick={handleSaveNote}>Save</button>
                <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setEditingNote(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <p className="modal-note">{localClip.userNote || 'No note added.'}</p>
          )}
        </section>

        {localClip.tags.length > 0 && (
          <section className="modal-section">
            <h4>Tags</h4>
            <div className="modal-tags">
              {localClip.tags.map((tag) => (
                <span key={tag} className="clip-card__tag">#{tag}</span>
              ))}
            </div>
          </section>
        )}

        <section className="modal-section modal-meta">
          <p><strong>Source:</strong> <a href={localClip.pageUrl} target="_blank" rel="noopener noreferrer">{localClip.pageTitle}</a></p>
          <p><strong>Domain:</strong> {localClip.domain}</p>
          <p><strong>Saved:</strong> {formatDate(localClip.createdAt)}</p>
        </section>

        <section className="modal-section">
          <h4>Move to Project</h4>
          <select
            className="cm-select"
            value={localClip.projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </section>

        <section className="modal-section">
          <h4>AI Actions</h4>
          <div className="modal-ai-actions">
            {(['summarize', 'explain', 'bullets', 'tasks'] as const).map((action) => (
              <button
                key={action}
                className="cm-btn cm-btn--sm"
                disabled={loading !== null}
                onClick={() => handleAIAction(action)}
              >
                {loading === action ? <span className="cm-spinner" /> : null}
                {action === 'summarize' && '✨ Summarize'}
                {action === 'explain' && '💡 Explain'}
                {action === 'bullets' && '📋 Bullets'}
                {action === 'tasks' && '☑️ Tasks'}
              </button>
            ))}
            <button className="cm-btn cm-btn--sm" onClick={handleCopyMarkdown}>
              📄 Copy Markdown
            </button>
          </div>
        </section>

        <div className="modal-footer">
          <button className="cm-btn cm-btn--danger" onClick={() => { onDelete(localClip.id); onClose(); }}>
            Delete Clip
          </button>
        </div>
      </div>
    </div>
  );
}
