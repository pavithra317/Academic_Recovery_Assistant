// Small text and number formatters.

export const plural = (count, word, pluralWord = `${word}s`) =>
  `${count} ${count === 1 ? word : pluralWord}`;

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function formatHours(minutes) {
  return ((Number(minutes) || 0) / 60).toFixed(1);
}
