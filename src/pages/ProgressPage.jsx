// Progress Tracking: recovery rate, focus streak, weekly rhythm, subject breakdown,
// and study capacity settings. Every value is computed from the task list and saved preferences.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/icons/Icon.jsx';
import Chip from '../components/common/Chip.jsx';
import ProgressRing from '../components/common/ProgressRing.jsx';
import WeeklyChart from '../components/progress/WeeklyChart.jsx';
import SettingsPanel from '../components/progress/SettingsPanel.jsx';
import { EmptyState } from '../components/common/StatusMessage.jsx';
import { useStudyData } from '../context/StudyDataContext.jsx';
import { WEEKLY_TARGET_HOURS, subjectBreakdown } from '../utils/taskUtils.js';
import { firstName, formatHours, plural } from '../utils/format.js';

function getAchievement(stats, name) {
  if (stats.total === 0) {
    return { title: 'Ready when you are', body: 'Add your first task to start tracking your recovery.' };
  }
  if (stats.open === 0) {
    return { title: `All caught up, ${name}!`, body: 'Every tracked task is complete.' };
  }
  if (stats.overdue === 0) {
    return {
      title: `You're on the right track, ${name}!`,
      body: `${stats.completed} of ${stats.total} tasks done and nothing is overdue.`,
    };
  }
  return {
    title: `Let's clear the backlog, ${name}.`,
    body: `${plural(stats.overdue, 'overdue task')} to recover. Start with the highest-priority one.`,
  };
}

function subjectStatus(percent) {
  if (percent >= 100) return 'Complete';
  if (percent >= 70) return 'Great recovery momentum';
  if (percent >= 40) return 'Steady progress';
  return 'Needs attention';
}

export default function ProgressPage() {
  const { tasks, preferences, stats, savePreferences, resetAll } = useStudyData();
  const [selectedDay, setSelectedDay] = useState(6);
  const location = useLocation();

  // Links like /progress#study-capacity need an explicit scroll inside a single-page app.
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const achievement = getAchievement(stats, firstName(preferences.name));
  const subjects = subjectBreakdown(tasks);
  const weeklyHours = stats.weeklyMinutes / 60;
  const targetReached = Math.min(100, Math.round((weeklyHours / WEEKLY_TARGET_HOURS) * 100));
  const hoursToGoal = Math.max(0, WEEKLY_TARGET_HOURS - weeklyHours);
  const selected = stats.daily[selectedDay];
  const selectedHours = selected.minutes / 60;
  const selectedNote =
    selected.minutes === 0
      ? 'No completed work logged.'
      : selectedHours > preferences.dailyHours
        ? 'Above your safe daily limit.'
        : 'Within your safe daily limit.';

  const handleReset = () => {
    if (!window.confirm('Clear all tasks and the current plan for a fresh start? Study preferences are kept.')) return;
    resetAll().catch((err) => window.alert(`Could not reset: ${err.message}`));
  };

  return (
    <div className="page progress-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Progress Tracking</h1>
        </div>
      </header>

      <section className="achievement" aria-labelledby="achievement-title">
        <div className="achievement__text">
          <h2 id="achievement-title">{achievement.title}</h2>
          <p>{achievement.body}</p>
          <div className="achievement__pills">
            <Chip tone="glass-dark">{stats.completed} tasks done</Chip>
            <Chip tone="glass-dark">{stats.overdue ? `${stats.overdue} overdue` : 'Nothing overdue'}</Chip>
          </div>
        </div>
        <Icon name="target" size={44} className="achievement__icon" />
      </section>

      <section className="bento" aria-label="Progress metrics">
        <article className="card bento__hero">
          <div>
            <span className="label">Overall recovery rate</span>
            <p className="bento__big">{stats.progressPercent}%</p>
            <p className="muted small">Completed {stats.completed} of {stats.total} tracked tasks</p>
          </div>
          <ProgressRing percent={stats.progressPercent} size={96} stroke={8}>
            <span className="small muted">Complete</span>
          </ProgressRing>
        </article>

        <article className="card bento__tasks">
          <div className="bento__head">
            <span className="label">Tasks Completed</span>
            <span className="icon-chip icon-chip--sm"><Icon name="check" size={14} /></span>
          </div>
          <p className="bento__big">{stats.completed} <span className="muted small">/ {stats.total} tasks</span></p>
          <div className="progress">
            <div className="progress__fill" style={{ width: `${stats.progressPercent}%` }} />
          </div>
          <p className="small accent-text">{plural(stats.open, 'assignment')} left</p>
        </article>

        <article className="card bento__streak">
          <div className="bento__head">
            <span className="label">Focus Streak</span>
            <span className="icon-chip icon-chip--sm icon-chip--accent"><Icon name="zap" size={14} /></span>
          </div>
          <p className="bento__big">{stats.activeDays} <span className="muted small">days active</span></p>
          <div className="streak-bars" aria-hidden="true">
            {stats.daily.map((d) => (
              <span key={d.key} className={`streak-bar ${d.minutes > 0 ? 'is-on' : ''}`} />
            ))}
          </div>
          <p className="small accent-text">{stats.activeDays >= 3 ? 'Recovery rhythm active' : 'Build a rhythm: aim for 3 active days'}</p>
        </article>

        <article className="card bento__focus">
          <div className="focus-row">
            <span className="icon-chip"><Icon name="book" size={16} /></span>
            <div>
              <span className="label">Focused Hours Logged</span>
              <p className="bento__big">
                {formatHours(stats.weeklyMinutes)} <span className="muted small">/ {WEEKLY_TARGET_HOURS.toFixed(1)} hrs weekly target</span>
              </p>
            </div>
          </div>
          <div className="focus-meta">
            <Chip tone="success">{targetReached}% reached</Chip>
            <span className="small muted">{hoursToGoal.toFixed(1)} hrs to goal</span>
          </div>
        </article>

        <article className="card bento__chart">
          <header className="card-head">
            <div>
              <h2 className="section-title">Weekly Study Rhythm</h2>
              <p className="muted small">Daily recorded vs. {preferences.dailyHours} hrs safe recovery baseline</p>
            </div>
            <Chip tone="primary">Baseline: {preferences.dailyHours} hrs</Chip>
          </header>
          <WeeklyChart daily={stats.daily} baselineHours={preferences.dailyHours} selectedIndex={selectedDay} onSelect={setSelectedDay} />
          <div className="day-banner">
            <span>
              <strong>{selected.date.toLocaleDateString('en-US', { weekday: 'long' })}:</strong> {formatHours(selected.minutes)} hrs focused. {selectedNote}
            </span>
            <span className="accent-text small">Tap a bar</span>
          </div>
        </article>
      </section>

      <section className="split">
        <article className="card">
          <header className="card-head">
            <h2 className="section-title">Subject Recovery Breakdown</h2>
            <span className="muted small">{plural(subjects.length, 'active course')}</span>
          </header>
          {subjects.length === 0 ? (
            <EmptyState icon="book" title="No subjects yet" message="Subjects appear here as you add tasks." />
          ) : (
            <ul className="subject-list">
              {subjects.map((s) => (
                <li key={s.subject} className="subject-row">
                  <div className="subject-row__head">
                    <div>
                      <strong>{s.subject}</strong>
                      <p className="muted small">{subjectStatus(s.percent)}</p>
                    </div>
                    <div className="subject-row__score">
                      <strong>{s.percent}%</strong>
                      <span className="muted small">{s.total - s.completed} left</span>
                    </div>
                  </div>
                  <div className="progress progress--thick">
                    <div className="progress__fill" style={{ width: `${s.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <SettingsPanel key={JSON.stringify(preferences)} preferences={preferences} onSave={savePreferences} />
      </section>

      <section className="card reset-card">
        <h3>Need a Fresh Academic Start?</h3>
        <p className="muted">Entering midterms or beginning a new quarter? Clear all tasks and the current plan to set a zero-guilt baseline.</p>
        <button type="button" className="link-button" onClick={handleReset}>
          Reset Recovery Baseline for New Term
        </button>
        <p className="muted small">Your study preferences are kept. <Link to="/tasks">Go to My Tasks</Link></p>
      </section>
    </div>
  );
}
