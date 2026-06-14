import type { Clip } from '../types/clip';
import type { Project } from '../types/project';
import { formatRelativeDate } from '../utils/date';

interface ClipCardProps {
  clip: Clip;
  project?: Project;
  onClick: (clip: Clip) => void;
  onDelete: (id: string) => void;
  onCopy: (clip: Clip) => void;
}

const TYPE_ICONS: Record<string, string> = {
  text: '📝',
  image: '🖼️',
  page: '🌐',
};

export function ClipCard({ clip, project, onClick, onDelete, onCopy }: ClipCardProps) {
  return (
    <article className="clip-card cm-glass-card" onClick={() => onClick(clip)}>
      <div className="clip-card__header">
        <span className="clip-card__type">{TYPE_ICONS[clip.type]}</span>
        <h3 className="clip-card__title">{clip.title}</h3>
        <span className="clip-card__time">{formatRelativeDate(clip.createdAt)}</span>
      </div>

      {clip.type === 'image' && clip.imageUrl && (
        <div className="clip-card__image-wrap">
          <img src={clip.imageUrl} alt={clip.imageAlt || clip.title} className="clip-card__image" loading="lazy" />
        </div>
      )}

      {(clip.summary || clip.content) && (
        <p className="clip-card__preview">
          {clip.summary || (clip.content && clip.content.slice(0, 120) + (clip.content.length > 120 ? '…' : ''))}
        </p>
      )}

      <div className="clip-card__meta">
        <span className="clip-card__domain">
          {clip.favicon && <img src={clip.favicon} alt="" className="clip-card__favicon" />}
          {clip.domain}
        </span>
        <span className="cm-badge">{clip.category}</span>
        {project && <span className="cm-badge cm-badge--project">{project.name}</span>}
      </div>

      {clip.tags.length > 0 && (
        <div className="clip-card__tags">
          {clip.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="clip-card__tag">#{tag}</span>
          ))}
        </div>
      )}

      <div className="clip-card__actions" onClick={(e) => e.stopPropagation()}>
        <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => window.open(clip.pageUrl, '_blank')}>
          Open ↗
        </button>
        <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={() => onCopy(clip)}>
          Copy
        </button>
        <button className="cm-btn cm-btn--sm cm-btn--danger" onClick={() => onDelete(clip.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
