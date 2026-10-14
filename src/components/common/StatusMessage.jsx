// Reusable loading, error, and empty-state blocks.
import Icon from '../icons/Icon.jsx';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="status status--loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status status--error" role="alert">
      <Icon name="alert" size={18} />
      <div className="status__body">
        <p>{message}</p>
        {onRetry && (
          <button className="btn btn--secondary btn--small" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'info', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={20} />
      </span>
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {action}
    </div>
  );
}
