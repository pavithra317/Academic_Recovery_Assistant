// Metric card used on the Dashboard (Pending Tasks, Overdue, Upcoming Exams, Available Hours).
import Icon from '../icons/Icon.jsx';

const TONES = {
  primary: { bg: '#e2e7ff', fg: '#3525cd' },
  danger: { bg: '#ffdad6', fg: '#ba1a1a' },
  accent: { bg: '#e9ddff', fg: '#6b38d4' },
  success: { bg: '#006e4b', fg: '#ffffff' },
};

export default function StatCard({ label, value, unit, icon, tone = 'primary', footer, children }) {
  const colors = TONES[tone] ?? TONES.primary;
  return (
    <article className="card stat-card">
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__chip" style={{ background: colors.bg, color: colors.fg }}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="stat-card__value">
        {value}
        {unit && <span className="stat-card__unit"> {unit}</span>}
      </p>
      {children}
      {footer && <p className="stat-card__footer">{footer}</p>}
    </article>
  );
}
