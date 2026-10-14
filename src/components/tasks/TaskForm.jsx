// Add or edit a task. Validates required fields before submitting. Shows "Saving…" while busy.
import { useState } from 'react';
import { validateTask, isValid } from '../../utils/validation.js';
import { startOfDay, toInputDateTime } from '../../utils/dates.js';

// Default values for a new task: tomorrow at 5 PM, 60 minutes, medium priority.
export function emptyTaskValues(now = new Date()) {
  const deadline = startOfDay(now);
  deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(17, 0, 0, 0);
  return { title: '', subject: '', description: '', deadline: toInputDateTime(deadline), estimatedMinutes: '60', priority: 'medium' };
}

export function taskToFormValues(task) {
  return {
    title: task.title,
    subject: task.subject,
    description: task.description || '',
    deadline: toInputDateTime(task.deadline),
    estimatedMinutes: String(task.estimatedMinutes),
    priority: task.priority,
  };
}

function Field({ id, label, error, wide = false, children }) {
  return (
    <div className={`field ${wide ? 'field--wide' : ''}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function TaskForm({ heading, submitLabel, initialValues, courses = [], busy = false, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    const found = validateTask(values);
    setErrors(found);
    if (isValid(found)) onSubmit(values);
  };

  const describedBy = (field) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form className="card task-form" onSubmit={handleSubmit} noValidate aria-labelledby="task-form-heading">
      <h2 id="task-form-heading" className="section-title">
        {heading}
      </h2>
      <div className="form-grid">
        <Field id="task-title" label="Task title" error={errors.title}>
          <input
            id="task-title"
            type="text"
            value={values.title}
            placeholder="e.g. Reaction Mechanisms P-Set 4"
            onChange={update('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy('title')}
          />
        </Field>

        <Field id="task-subject" label="Subject" error={errors.subject}>
          <input
            id="task-subject"
            type="text"
            list="course-options"
            value={values.subject}
            placeholder="e.g. CHEM 201"
            onChange={update('subject')}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={describedBy('subject')}
          />
          <datalist id="course-options">
            {courses.map((course) => (
              <option key={course} value={course} />
            ))}
          </datalist>
        </Field>

        <Field id="task-deadline" label="Deadline" error={errors.deadline}>
          <input
            id="task-deadline"
            type="datetime-local"
            value={values.deadline}
            onChange={update('deadline')}
            aria-invalid={Boolean(errors.deadline)}
            aria-describedby={describedBy('deadline')}
          />
        </Field>

        <Field id="task-minutes" label="Estimated duration (minutes)" error={errors.estimatedMinutes}>
          <input
            id="task-minutes"
            type="number"
            min="5"
            max="1440"
            step="5"
            value={values.estimatedMinutes}
            onChange={update('estimatedMinutes')}
            aria-invalid={Boolean(errors.estimatedMinutes)}
            aria-describedby={describedBy('estimatedMinutes')}
          />
        </Field>

        <Field id="task-priority" label="Priority" error={errors.priority}>
          <select
            id="task-priority"
            value={values.priority}
            onChange={update('priority')}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby={describedBy('priority')}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>

        <Field id="task-description" label="Description (optional)" error={errors.description} wide>
          <textarea
            id="task-description"
            rows={3}
            value={values.description}
            placeholder="Notes, required pages, or what 'done' means"
            onChange={update('description')}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy('description')}
          />
        </Field>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
