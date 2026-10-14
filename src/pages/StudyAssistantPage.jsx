// AI Study Assistant: enter a subject or topic and see generated study notes.
// No fake AI. Without a connected backend, the page shows a clear "not connected" message.
import { useState } from 'react';
import Icon from '../components/icons/Icon.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusMessage.jsx';
import { generateStudyNotes } from '../services/studyService.js';
import { useStudyData } from '../context/StudyDataContext.jsx';

export default function StudyAssistantPage() {
  const { preferences } = useStudyData();
  const [topic, setTopic] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = topic.trim();
    if (!clean) {
      setFieldError('Enter a subject or topic first.');
      return;
    }
    setFieldError('');
    setError('');
    setLoading(true);
    try {
      setNotes(await generateStudyNotes(clean));
    } catch (err) {
      setNotes(null);
      setError(err.message || 'Could not generate study notes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page study-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Study support</p>
          <h1>AI Study Assistant</h1>
          <p className="muted">Enter a subject or topic to get structured study notes.</p>
        </div>
      </header>

      <form className="card study-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="study-topic">Subject or topic</label>
          <div className="study-form__row">
            <input
              id="study-topic"
              type="text"
              value={topic}
              placeholder="e.g. Binary search trees, Keynesian multiplier"
              onChange={(e) => {
                setTopic(e.target.value);
                setFieldError('');
              }}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'study-topic-error' : undefined}
            />
            <button className="btn btn--primary" type="submit" disabled={loading}>
              <Icon name="sparkles" size={14} /> {loading ? 'Generating…' : 'Generate Study Notes'}
            </button>
          </div>
          {fieldError && <p className="field__error" id="study-topic-error">{fieldError}</p>}
        </div>
        <div className="chip-row">
          <span className="muted small">Quick pick:</span>
          {preferences.courses.map((course) => (
            <button key={course} type="button" className="chip chip--neutral chip--button" onClick={() => setTopic(course)}>
              {course}
            </button>
          ))}
        </div>
      </form>

      <section className="card notes-card" aria-live="polite">
        <header className="card-head">
          <h2 className="section-title">Generated Notes</h2>
          {notes && (
            <button className="btn btn--ghost btn--small" type="button" onClick={() => setNotes(null)}>
              Clear notes
            </button>
          )}
        </header>

        {loading && <LoadingState label="Writing your notes…" />}
        {error && <ErrorState message={error} />}

        {!loading && !error && !notes && (
          <EmptyState
            icon="book"
            title="No notes yet"
            message="Notes for your topic will appear here once you generate them."
          />
        )}

        {!loading && notes && (
          <article className="notes-body">
            <h3 className="notes-title">{notes.title}</h3>
            {notes.sections.map((section, index) => (
              <section key={index} className="notes-section">
                {section.heading && <h4>{section.heading}</h4>}
                <ul>
                  {section.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </section>
            ))}
            {notes.text && notes.text.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
          </article>
        )}
      </section>
    </div>
  );
}
