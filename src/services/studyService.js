// AI Study Assistant calls. There is NO fake AI here. Without a backend, the call fails with a clear message.
import { backendApi, ApiError } from './api.js';

export async function generateStudyNotes(topic) {
  const clean = (topic || '').trim();
  if (!clean) {
    throw new ApiError('Enter a subject or topic first.', { code: 'VALIDATION' });
  }
  const response = await backendApi.generateStudyNotes({ topic: clean });
  return normalizeStudyNotes(response, clean);
}

// Accepts either { sections: [{ heading, points }] } or { notes: "text" } from the backend.
export function normalizeStudyNotes(payload, topic) {
  const sections = Array.isArray(payload?.sections)
    ? payload.sections.map((section) => ({
        heading: String(section.heading ?? ''),
        points: Array.isArray(section.points) ? section.points.map(String) : [],
      }))
    : [];
  const text = typeof payload?.notes === 'string' ? payload.notes : '';
  return { title: payload?.title || `Study notes: ${topic}`, sections, text };
}
