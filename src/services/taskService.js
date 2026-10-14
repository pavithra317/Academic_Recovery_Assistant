// All task calls to the FastAPI backend. Components do not call fetch directly.
// Form values (strings from inputs) are converted to the JSON the backend expects here.
import { apiRequest } from './api.js';

export function toTaskPayload(values) {
  return {
    title: values.title.trim(),
    subject: values.subject.trim(),
    description: (values.description || '').trim(),
    deadline: new Date(values.deadline).toISOString(),
    estimatedMinutes: Number(values.estimatedMinutes),
    priority: values.priority,
  };
}

export const fetchTasks = () => apiRequest('/api/tasks');

export const createTask = (values) =>
  apiRequest('/api/tasks', { method: 'POST', body: toTaskPayload(values) });

export const updateTask = (id, values) =>
  apiRequest(`/api/tasks/${id}`, { method: 'PUT', body: toTaskPayload(values) });

export const updateTaskStatus = (id, status) =>
  apiRequest(`/api/tasks/${id}`, { method: 'PUT', body: { status } });

export const setTaskCompleted = (id, completed) =>
  apiRequest(`/api/tasks/${id}/complete`, { method: 'PATCH', body: { completed } });

export const deleteTask = (id) => apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });

export const deleteAllTasks = () => apiRequest('/api/tasks', { method: 'DELETE' });
