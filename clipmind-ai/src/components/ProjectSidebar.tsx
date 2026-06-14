import { useState } from 'react';
import type { Project } from '../types/project';
import { INBOX_PROJECT_ID } from '../types/project';

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

const PROJECT_COLORS = ['#7c6ff7', '#6366f1', '#818cf8', '#a78bfa', '#c084fc', '#60a5fa', '#34d399', '#f472b6'];

export function ProjectSidebar({ projects, activeProjectId, onSelect, onCreate, onDelete }: ProjectSidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName('');
    setCreating(false);
  };

  return (
    <aside className="project-sidebar">
      <div className="project-sidebar__header">
        <h3>Projects</h3>
        <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setCreating(!creating)} title="New project">
          +
        </button>
      </div>

      {creating && (
        <div className="project-sidebar__create">
          <input
            className="cm-input"
            placeholder="Project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="project-sidebar__create-actions">
            <button className="cm-btn cm-btn--sm cm-btn--primary" onClick={handleCreate}>Create</button>
            <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <nav className="project-sidebar__list cm-scrollbar">
        <button
          className={`project-item ${activeProjectId === 'all' ? 'project-item--active' : ''}`}
          onClick={() => onSelect('all')}
        >
          <span className="project-item__dot" style={{ background: '#7c6ff7' }} />
          All Clips
        </button>
        {projects.map((project) => (
          <div key={project.id} className="project-item-wrap">
            <button
              className={`project-item ${activeProjectId === project.id ? 'project-item--active' : ''}`}
              onClick={() => onSelect(project.id)}
            >
              <span className="project-item__dot" style={{ background: project.color || '#7c6ff7' }} />
              {project.name}
            </button>
            {project.id !== INBOX_PROJECT_ID && (
              <button
                className="project-item__delete"
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                title="Delete project"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export { PROJECT_COLORS };
