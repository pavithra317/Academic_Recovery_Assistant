// "Study Capacity & Profile" card. Edits are saved only when the user presses Save.
import { useState } from 'react';
import Icon from '../icons/Icon.jsx';
import { BREAK_RHYTHMS } from '../../utils/recoveryPlanner.js';
import { initials } from '../../utils/format.js';

const WINDOWS = [
  { value: 'morning', label: 'Mornings', time: '8 AM – 1 PM', icon: 'sun' },
  { value: 'afternoon', label: 'Afternoons & Evenings', time: '3 PM – 9 PM', icon: 'moon' },
];
const MAX_COURSES = 8;

export default function SettingsPanel({ preferences, onSave }) {
  const [draft, setDraft] = useState(preferences);
  const [editingName, setEditingName] = useState(false);
  const [courseInput, setCourseInput] = useState('');
  const [courseError, setCourseError] = useState('');
  const [message, setMessage] = useState('');

  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences);

  const update = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setMessage('');
  };

  const addCourse = (event) => {
    event.preventDefault();
    const name = courseInput.trim();
    if (!name) return setCourseError('Enter a course code or name.');
    if (draft.courses.some((c) => c.toLowerCase() === name.toLowerCase())) return setCourseError('That course is already tracked.');
    if (draft.courses.length >= MAX_COURSES) return setCourseError(`You can track up to ${MAX_COURSES} courses.`);
    update({ courses: [...draft.courses, name] });
    setCourseInput('');
    setCourseError('');
  };

  const save = () => {
    const cleaned = { ...draft, name: draft.name.trim() || preferences.name, dailyHours: Number(draft.dailyHours) };
    onSave(cleaned);
    setDraft(cleaned);
    setEditingName(false);
    setMessage('Preferences saved on this device.');
  };

  return (
    <section className="card settings-card" id="study-capacity" aria-labelledby="settings-title">
      <header className="settings-card__head">
        <span className="icon-chip">
          <Icon name="target" size={16} />
        </span>
        <div>
          <h2 id="settings-title" className="section-title">Study Capacity & Profile</h2>
          <p className="muted small">Fine-tune AI recovery calibration</p>
        </div>
      </header>

      <div className="profile-card">
        <span className="avatar avatar--lg" aria-hidden="true">{initials(draft.name)}</span>
        <div className="profile-card__body">
          {editingName ? (
            <input
              aria-label="Student name"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          ) : (
            <p className="profile-card__name">{draft.name}</p>
          )}
          <p className="muted small">{draft.role}</p>
        </div>
        <button className="btn btn--secondary btn--small" type="button" onClick={() => setEditingName((v) => !v)}>
          {editingName ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="settings-block">
        <div className="settings-block__head">
          <span className="label">Tracked Recovery Courses</span>
          <span className="muted small">{draft.courses.length} registered</span>
        </div>
        <ul className="course-pills">
          {draft.courses.map((course) => (
            <li key={course} className="course-pill">
              <span>{course}</span>
              <button type="button" aria-label={`Remove ${course}`} onClick={() => update({ courses: draft.courses.filter((c) => c !== course) })}>
                <Icon name="x" size={12} />
              </button>
            </li>
          ))}
        </ul>
        <form className="course-add" onSubmit={addCourse}>
          <input
            aria-label="New course"
            placeholder="e.g. PHYS 101"
            value={courseInput}
            onChange={(e) => {
              setCourseInput(e.target.value);
              setCourseError('');
            }}
          />
          <button className="btn btn--secondary btn--small" type="submit">
            <Icon name="plus" size={14} /> Add Course
          </button>
        </form>
        {courseError && <p className="field__error">{courseError}</p>}
      </div>

      <div className="settings-block">
        <div className="settings-block__head">
          <div>
            <span className="label">Daily Safe Study Capacity</span>
            <p className="muted small">Prevents burn-out overload scheduling</p>
          </div>
          <span className="value-badge">{Number(draft.dailyHours).toFixed(1)} hrs</span>
        </div>
        <input
          type="range"
          className="range"
          min="1"
          max="5"
          step="0.5"
          value={draft.dailyHours}
          onChange={(e) => update({ dailyHours: Number(e.target.value) })}
          aria-label="Daily safe study hours"
        />
        <div className="range-labels">
          <span>1.0 hr (Light)</span>
          <span>2.5 hrs (Balanced)</span>
          <span>5.0 hrs (Intense)</span>
        </div>
      </div>

      <div className="settings-block">
        <span className="label">Preferred Productivity Window</span>
        <div className="option-grid">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              className={`option-card ${draft.productivityWindow === w.value ? 'is-selected' : ''}`}
              aria-pressed={draft.productivityWindow === w.value}
              onClick={() => update({ productivityWindow: w.value })}
            >
              <span className="option-card__top">
                <Icon name={w.icon} size={16} />
                <span className="option-card__dot" aria-hidden="true" />
              </span>
              <strong>{w.label}</strong>
              <span className="muted small">{w.time}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-block">
        <span className="label">Break Interval Rhythm</span>
        <div className="option-grid">
          {Object.entries(BREAK_RHYTHMS).map(([value, rhythm]) => (
            <button
              key={value}
              type="button"
              className={`option-card ${draft.breakRhythm === value ? 'is-selected' : ''}`}
              aria-pressed={draft.breakRhythm === value}
              onClick={() => update({ breakRhythm: value })}
            >
              <span className="option-card__top">
                <Icon name="clock" size={16} />
                <span className="option-card__dot" aria-hidden="true" />
              </span>
              <strong>{rhythm.label}</strong>
              <span className="muted small">{rhythm.focus}m focus • {rhythm.rest}m pause</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-actions">
        <button type="button" className="btn btn--primary btn--block" onClick={save} disabled={!dirty && !editingName}>
          Save Study Preferences
        </button>
        {message && <p className="small success" role="status">{message}</p>}
      </div>
    </section>
  );
}
