// Thin wrapper around localStorage. Used for temporary persistence until the backend is connected.
// Every call is wrapped in try/catch because storage can be full or blocked (private mode, etc.).

export const STORAGE_KEYS = {
  tasks: 'arp.tasks.v1',
  preferences: 'arp.preferences.v1',
  plan: 'arp.plan.v1',
};

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
