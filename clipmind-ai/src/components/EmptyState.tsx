interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
}

export function EmptyState({
  title = 'No clips yet',
  description = 'Select text on any webpage, right-click images, or save the current page to start building your web memory.',
  icon = '✦',
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
    </div>
  );
}
