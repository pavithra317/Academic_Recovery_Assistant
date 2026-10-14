// Dashboard: hero with the Generate Recovery Plan action, status cards, upcoming deadlines,
// study priorities, and progress. Every number comes from the task list.
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/icons/Icon.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Chip from '../components/common/Chip.jsx';
import ProgressRing from '../components/common/ProgressRing.jsx';
import { ErrorState, EmptyState } from '../components/common/StatusMessage.jsx';
import { useStudyData } from '../context/StudyDataContext.jsx';
import { compareTasks, isOpen, isOverdue, PRIORITY_LABELS, PRIORITY_RANK, sortTasks } from '../utils/taskUtils.js';
import { formatDeadline, relativeDue } from '../utils/dates.js';
import { firstName, formatHours, plural } from '../utils/format.js';

const PRIORITY_TONE = { high: 'danger', medium: 'accent', low: 'neutral' };

export default function DashboardPage() {
  const { tasks, preferences, stats, generatePlan, planStatus } = useStudyData();
  const navigate = useNavigate();
  const now = new Date();

  const open = sortTasks(tasks.filter(isOpen));
  const upcoming = open.filter((t) => !isOverdue(t, now)).slice(0, 5);
  const priorities = [...open]
    .sort((a, b) => Number(isOverdue(b, now)) - Number(isOverdue(a, now)) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || compareTasks(a, b))
    .slice(0, 3);
  const courseCount = new Set(open.map((t) => t.subject)).size;
  const normalOpen = open.length - stats.urgentOpen;
  const hoursLeftToday = Math.max(0, preferences.dailyHours - stats.todayMinutes / 60);

const hour = new Date().getHours();

const greeting =
  hour < 12
    ? 'Good morning'
    : hour < 17
      ? 'Good afternoon'
      : 'Good evening';

const studentName = preferences.name?.trim();

const heroTitle = stats.overdue
  ? `${greeting}${studentName ? `, ${studentName}` : ''}! Let's Make a Fresh Start.`
  : `${greeting}${studentName ? `, ${studentName}` : ''}!`;


  const heroBody = !tasks.length
    ? 'Add your first task. Then generate a recovery plan that paces your work around your daily safe limit.'
    : stats.overdue
      ? `We found ${plural(stats.overdue, 'overdue task')} and ${formatHours(stats.backlogMinutes)} hours of backlog. Let's rebuild your week into focused sprints that stay inside your ${preferences.dailyHours}-hour daily limit.`
      : `Nothing is overdue. Generate a plan to pace the ${plural(open.length, 'open task')} across the coming days.`;

  async function handleGenerate() {
    const ok = await generatePlan();
    if (ok) navigate('/recovery');
  }

  return (
    <div className="page dashboard-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__glow hero__glow--a" aria-hidden="true" />
        <div className="hero__glow hero__glow--b" aria-hidden="true" />
        <div className="hero__content">
          <span className="hero__eyebrow">
            <Icon name="sparkles" size={12} /> Calm recovery protocol
          </span>
          <h1 id="hero-title" className="hero__title">{heroTitle}</h1>
          <p className="hero__body">{heroBody}</p>
          <div className="hero__chips">
            <Chip tone="glass">Daily safe limit: <strong>{preferences.dailyHours} hrs</strong></Chip>
            <Chip tone="glass">High-priority open: <strong>{stats.urgentOpen}</strong></Chip>
          </div>
        </div>
        <div className="hero__actions">
          <button className="btn btn--white" type="button" onClick={handleGenerate} disabled={planStatus.loading}>
            <Icon name="zap" size={16} /> {planStatus.loading ? 'Generating…' : 'Generate Recovery Plan'}
          </button>
          <Link to="/progress#study-capacity" className="btn btn--glass">
            Update My Schedule
          </Link>
        </div>
      </section>

      {planStatus.error && <ErrorState message={planStatus.error} onRetry={handleGenerate} />}

      <section className="status-grid" aria-label="Task summary">
        <StatCard
          label="Pending Tasks"
          value={open.length}
          icon="tasks"
          tone="primary"
          footer={`${stats.urgentOpen} urgent • ${normalOpen} normal across ${plural(courseCount, 'course')}`}
        />
        <StatCard
          label="Overdue Assignments"
          value={stats.overdue}
          icon="alert"
          tone="danger"
          footer={`${formatHours(stats.backlogMinutes)} hrs accumulated backlog`}
        />
        <StatCard label="Upcoming Exams" value={stats.exams} icon="calendar" tone="accent">
          <div className="chip-row">
            {stats.upcomingExams.map((exam) => (
              <Chip key={exam.id} tone="neutral">{exam.title.split(' ').slice(0, 2).join(' ')}: {relativeDue(exam.deadline, now).replace('Due in ', '')}</Chip>
            ))}
          </div>
        </StatCard>
        <StatCard
          label="Available Study Hours Today"
          value={hoursLeftToday.toFixed(1)}
          unit="hrs"
          icon="clock"
          tone="success"
          footer={`Safe cap · ${formatHours(stats.todayMinutes)} hrs logged today`}
        />
      </section>

      <section className="split">
        <article className="card">
          <header className="card-head">
            <h2 className="section-title">Upcoming Deadlines</h2>
            <Link to="/tasks" className="text-link">View all</Link>
          </header>
          {upcoming.length === 0 ? (
            <EmptyState icon="calendar" title="No upcoming deadlines" message="Open tasks with future due dates will appear here." />
          ) : (
            <ul className="list">
              {upcoming.map((task) => (
                <li key={task.id} className="list-item">
                  <div className="list-item__main">
                    <strong>{task.title}</strong>
                    <span className="muted small">{task.subject} · {formatDeadline(task.deadline)}</span>
                  </div>
                  <Chip tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABELS[task.priority]}</Chip>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <header className="card-head">
            <h2 className="section-title">Study Priorities</h2>
            <span className="muted small">Overdue first</span>
          </header>
          {priorities.length === 0 ? (
            <EmptyState icon="sparkles" title="Nothing to prioritize" message="Once you add open tasks, your top three priorities appear here." />
          ) : (
            <ol className="list list--ranked">
              {priorities.map((task, index) => (
                <li key={task.id} className="list-item">
                  <span className="rank">{index + 1}</span>
                  <div className="list-item__main">
                    <strong>{task.title}</strong>
                    <span className="muted small">
                      {isOverdue(task, now) ? relativeDue(task.deadline, now) : `Due ${formatDeadline(task.deadline)}`}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>

      <section className="card progress-summary">
        <ProgressRing percent={stats.progressPercent} size={88} stroke={8}>
          <strong>{stats.progressPercent}%</strong>
        </ProgressRing>
        <div>
          <h2 className="section-title">Overall progress</h2>
          <p className="muted">
            {stats.completed} of {stats.total} tracked tasks completed.{' '}
            <Link to="/progress" className="text-link">See full analytics</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
