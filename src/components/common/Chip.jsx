// Small pill label. Tones: neutral, primary, accent, danger, success, glass (on dark backgrounds).
export default function Chip({ tone = 'neutral', children, className = '' }) {
  return <span className={`chip chip--${tone} ${className}`.trim()}>{children}</span>;
}
