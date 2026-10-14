// Central place for every HTTP call to the FastAPI backend.
// UI components never call fetch directly. They go through the service files.
//
// Configure the backend URL with VITE_API_BASE_URL in a .env file (see .env.example).
// Do NOT put API keys or database credentials in the frontend. Gemini and MongoDB
// credentials belong only on the backend.

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;

export const isBackendConfigured = API_BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(message, { status = null, code = 'REQUEST_FAILED' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  if (!isBackendConfigured) {
    throw new ApiError('The AI backend is not connected yet.', { code: 'NOT_CONFIGURED' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // FastAPI returns errors as { "detail": "..." }.
      // FastAPI sends "detail" as text (most errors) or as a list (validation errors).
      const detail = data?.detail;
      let message = data?.message || `The server responded with status ${response.status}.`;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map((item) => item.msg).join(' ');
      throw new ApiError(message, {
        status: response.status,
        code: 'HTTP_ERROR',
      });
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', { code: 'TIMEOUT' });
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }
}

// Endpoint paths the FastAPI backend should implement. See README for expected payloads.
export const backendApi = {
  generateRecoveryPlan: (payload) => apiRequest('/api/recovery-plan', { method: 'POST', body: payload }),
  regenerateRecoveryPlan: (payload) => apiRequest('/api/recovery-plan', { method: 'POST', body: payload }),
  generateStudyNotes: (payload) => apiRequest('/api/study-assistant', { method: 'POST', body: payload }),
};
