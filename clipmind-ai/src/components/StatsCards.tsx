import type { ClipStats } from '../types/clip';

interface StatsCardsProps {
  stats: ClipStats;
  compact?: boolean;
}

export function StatsCards({ stats, compact }: StatsCardsProps) {
  const items = [
    { label: 'Total Clips', value: stats.total, icon: '📚' },
    { label: 'Text', value: stats.text, icon: '📝' },
    { label: 'Images', value: stats.image, icon: '🖼️' },
    { label: 'Pages', value: stats.page, icon: '🌐' },
    { label: 'Categories', value: stats.categories, icon: '🏷️' },
  ];

  return (
    <div className={`stats-cards ${compact ? 'stats-cards--compact' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="stats-card cm-glass-card">
          <span className="stats-card__icon">{item.icon}</span>
          <div className="stats-card__info">
            <span className="stats-card__value">{item.value}</span>
            {!compact && <span className="stats-card__label">{item.label}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
