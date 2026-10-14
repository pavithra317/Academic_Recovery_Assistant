// Form validation for tasks. Returns an object of { fieldName: message }.
// An empty object means the form is valid.

export function validateTask(values) {
  const errors = {};

  const title = (values.title || '').trim();
  if (!title) errors.title = 'Task title is required.';
  else if (title.length > 120) errors.title = 'Keep the title under 120 characters.';

  if (!(values.subject || '').trim()) errors.subject = 'Subject is required.';

  if (!values.deadline) {
    errors.deadline = 'Deadline is required.';
  } else if (Number.isNaN(new Date(values.deadline).getTime())) {
    errors.deadline = 'Enter a valid date and time.';
  }

  const raw = String(values.estimatedMinutes ?? '').trim();
  const minutes = Number(raw);
  if (raw === '') errors.estimatedMinutes = 'Estimated duration is required.';
  else if (!Number.isFinite(minutes) || minutes <= 0) errors.estimatedMinutes = 'Duration must be more than 0 minutes.';
  else if (minutes > 1440) errors.estimatedMinutes = 'Duration cannot exceed 24 hours (1440 minutes).';

  if (!['high', 'medium', 'low'].includes(values.priority)) errors.priority = 'Choose a priority.';

  if ((values.description || '').length > 1000) errors.description = 'Keep the description under 1000 characters.';

  return errors;
}

export const isValid = (errors) => Object.keys(errors).length === 0;
