// Date helpers used across the app. All times are handled in the user's local timezone.

const pad = (n) => String(n).padStart(2, '0');

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Stable "YYYY-MM-DD" key for grouping by local day.
export function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Format used by <input type="datetime-local">: "YYYY-MM-DDTHH:mm".
export function toInputDateTime(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDeadline(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'No deadline';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function longDate(value) {
  return new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function weekdayLetter(value) {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(value).getDay()];
}

// "Overdue 1d", "Due in 18h", etc.
export function relativeDue(value, now = new Date()) {
  const diff = new Date(value).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const days = Math.round(abs / DAY_MS);
  const hours = Math.max(1, Math.round(abs / 3600000));
  const span = days >= 1 ? `${days}d` : `${hours}h`;
  return diff < 0 ? `Overdue ${span}` : `Due in ${span}`;
}
