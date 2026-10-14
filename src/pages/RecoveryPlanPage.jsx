// AI Recovery Plan: timeline of focus blocks, recommendations, overdue triage, and momentum.
// The plan comes from the backend when connected. Otherwise it is built by the local planner.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/icons/Icon.jsx';
import Chip from '../components/common/Chip.jsx';
import PlanBlock from '../components/plan/PlanBlock.jsx';
import ProgressRing from '../components/common/ProgressRing.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusMessage.jsx';
import { useStudyData } from '../context/StudyDataContext.jsx';
import { buildICS, downloadTextFile } from '../utils/calendar.js';
import { isOpen, isOverdue, sortTasks } from '../utils/taskUtils.js';
import { dayKey, formatDeadline, longDate, weekdayLetter } from '../utils/dates.js';
import { formatDuration, formatHours, plural } from '../utils/format.js';

const REC_LABELS = ['Impact first', 'Chrono-pacing', 'Buffer'];

// Groups plan blocks by day and inserts rest windows where there is a gap between blocks.
function groupPlanByDay(blocks) {
  const days = [];
  blocks.forEach((block) => {
    let day = days.find((d) => d.key === block.date);
    if (!day) {
      day = { key: block.date, date: block.start, blocks: [] };
      days.push(day);
    }
    day.blocks.push(block);
  });
  return days.map((day) => {
    const items = [];
    day.blocks.forEach((block, index) => {
      if (index > 0) {
        const gap = Math.round((new Date(block.start) - new Date(day.blocks[index - 1].end)) / 60000);
        if (gap >= 5) items.push({ type: 'rest', key: `rest-${block.id}`, minutes: gap });
      }
      items.push({ type: 'block', key: block.id, block });
    });
    return { ...day, items };
  });
}

function MomentumChart({ daily, safeMinutes }) {
  const width = 300;
  const height = 80;
  const max = Math.max(safeMinutes, ...daily.map((d) => d.minutes), 60);
  const points = daily.map((d, i) => {
    const x = (i / (daily.length - 1)) * (width - 20) + 10;
    const y = height - 10 - (d.minutes / max) * (height - 20);
    return [x, y];
  });
  const baselineY = height - 10 - (safeMinutes / max) * (height - 20);
  return (
    <div className="momentum-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Study minutes over the last seven days">
        <line x1="10" x2={width - 10} y1={baselineY} y2={baselineY} className="momentum-chart__baseline" />
        <polyline fill="none" stroke="#6b38d4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points.map((p) => p.join(',')).join(' ')} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#6b38d4" />
        ))}
      </svg>
      <div className="momentum-chart__labels">
        {daily.map((d) => (
          <span key={d.key}>{weekdayLetter(d.date)}</span>
        ))}
      </div>
    </div>
  );
}

export default function RecoveryPlanPage() {
  const { tasks, preferences, plan, planStatus, planIsStale, stats, generatePlan, setTaskStatus } = useStudyData();
  const now = new Date();

  const openTasks = tasks.filter(isOpen);
  const openIds = new Set(openTasks.map((t) => t.id));
  // Hide blocks for tasks that were completed or deleted since the plan was made.
  const blocks = (plan?.blocks ?? []).filter((b) => openIds.has(b.taskId));
  const days = groupPlanByDay([...blocks].sort((a, b) => new Date(a.start) - new Date(b.start)));
  const scheduledMinutes = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const unscheduledCount = (plan?.unscheduledTaskIds ?? []).filter((id) => openIds.has(id)).length;
  const overdueTasks = sortTasks(tasks.filter((t) => isOverdue(t, now)));
  const nextDeadline = sortTasks(openTasks.filter((t) => !isOverdue(t, now)))[0];
  const recommendations = plan?.recommendations ?? [];
  const isLocal = plan?.source !== 'backend';

  const [planMessage, setPlanMessage] = useState('');

  const regenerate = async () => {
    setPlanMessage('');
    const ok = await generatePlan({ regenerate: Boolean(plan) });
    if (ok) {
      const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      setPlanMessage(`Plan updated at ${time}.`);
    }
  };

  const downloadCalendar = () => {
    downloadTextFile('recovery-plan.ics', buildICS(blocks, now));
  };

  const encouragement =
    openTasks.length === 0
      ? 'All tracked tasks are complete. Nice work.'
      : stats.overdue === 0
        ? "You're clear of overdue work. Keep to the plan."
        : `Overdue work is down to ${plural(stats.overdue, 'task')}. Finish the first block to keep the momentum going.`;

  return (
    <div className="page recovery-page">
      <div className="recovery-grid">
        <div className="recovery-main">
          <section className="card plan-hero" aria-labelledby="plan-title">
            <header className="plan-hero__head">
              <div>
                <p className="eyebrow"><span className="dot-inline" aria-hidden="true" /> Active recovery track</p>
                <h1 id="plan-title">AI Recovery Plan</h1>
                <p className="muted small">
                  {isLocal
                    ? 'Built by the local planner. The AI backend is not connected yet.'
                    : 'Generated by the AI backend.'}
                </p>
              </div>
              <div className="plan-hero__actions">
                <button className="btn btn--secondary" type="button" onClick={regenerate} disabled={planStatus.loading}>
                  <Icon name="refresh" size={14} /> {planStatus.loading ? 'Working…' : plan ? 'Regenerate Plan' : 'Generate Plan'}
                </button>
                <button className="btn btn--primary" type="button" onClick={downloadCalendar} disabled={!blocks.length}>
                  <Icon name="download" size={14} /> Apply to Calendar
                </button>
              </div>
            </header>

            {planMessage && <p className="notice" role="status">{planMessage}</p>}
            {planStatus.error && <ErrorState message={planStatus.error} onRetry={regenerate} />}
            {planStatus.loading && <LoadingState label="Building your plan…" />}

            {planIsStale && (
              <p className="notice notice--warning" role="status">
                Tasks or study settings changed since this plan was made. Regenerate for updated timing.
              </p>
            )}

            {plan && blocks.length > 0 && (
              <div className={`status-bar ${unscheduledCount ? 'status-bar--warn' : 'status-bar--ok'}`}>
                <span>
                  <Icon name="clock" size={16} /> {blocks.length} focus blocks · {formatHours(scheduledMinutes)} hrs scheduled
                </span>
                <Chip tone={unscheduledCount ? 'danger' : 'success'}>
                  {unscheduledCount ? `${plural(unscheduledCount, 'task')} need attention` : 'Every task fits'}
                </Chip>
              </div>
            )}

            {!plan && !planStatus.loading && (
              <EmptyState
                icon="zap"
                title="No plan yet"
                message="Generate a plan to schedule your open tasks into focus blocks that fit your daily safe limit."
                action={
                  <button className="btn btn--primary" type="button" onClick={regenerate}>
                    <Icon name="zap" size={14} /> Generate Recovery Plan
                  </button>
                }
              />
            )}

            {plan && blocks.length === 0 && !planStatus.loading && (
              <EmptyState icon="check" title="Nothing left to schedule" message="All tracked tasks are complete, so there are no focus blocks to plan." />
            )}

            {days.map((day) => (
              <section key={day.key} className="plan-day" aria-label={longDate(day.date)}>
                <h2 className="plan-day__head">
                  {dayKey(now) === day.key ? 'Today · ' : ''}
                  {longDate(day.date)}
                </h2>
                {day.items.map((item) =>
                  item.type === 'rest' ? (
                    <div key={item.key} className="rest-block">
                      <Icon name="moon" size={16} />
                      <span>Rest window · {formatDuration(item.minutes)}</span>
                    </div>
                  ) : (
                    <PlanBlock key={item.key} block={item.block} onComplete={(taskId) =>
                      setTaskStatus(taskId, 'completed').catch((err) => setPlanMessage(`Could not update the task: ${err.message}`))
                    } />
                  )
                )}
              </section>
            ))}
          </section>

          {recommendations.length > 0 && (
            <section className="card" aria-labelledby="recs-title">
              <header className="card-head">
                <span className="icon-chip">
                  <Icon name="sparkles" size={16} />
                </span>
                <div>
                  <h2 id="recs-title" className="section-title">AI Recommendations & Strategic Insights</h2>
                  <p className="muted small">Adaptive pacing based on your deadlines and safe daily limit</p>
                </div>
              </header>
              <div className="rec-grid">
                {recommendations.map((text, index) => (
                  <article key={index} className="rec-card">
                    <span className="rec-card__label">{REC_LABELS[index] ?? 'Insight'}</span>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="recovery-side" aria-label="Triage and progress">
          <section className="card" aria-labelledby="triage-title">
            <header className="card-head">
              <div>
                <h2 id="triage-title" className="section-title">Missed Tasks & Triage</h2>
                <p className="muted small">{plural(overdueTasks.length, 'item')} flagged for absorption</p>
              </div>
              <span className="count-badge">{overdueTasks.length}</span>
            </header>
            {overdueTasks.length === 0 ? (
              <p className="muted small">Nothing is overdue. Your backlog is clear.</p>
            ) : (
              <ul className="triage-list">
                {overdueTasks.map((task) => (
                  <li key={task.id} className="triage-item">
                    <div className="triage-item__chips">
                      <Chip tone="danger">Overdue</Chip>
                      <Chip tone="accent">{task.subject}</Chip>
                    </div>
                    <strong>{task.title}</strong>
                    <span className="muted small">
                      Est: {formatDuration(task.estimatedMinutes)} · Due {formatDeadline(task.deadline)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/tasks?new=1" className="btn btn--secondary btn--block">
              <Icon name="plus" size={14} /> Add missed assignment
            </Link>
          </section>

          <section className="card" aria-labelledby="momentum-title">
            <header className="card-head">
              <h2 id="momentum-title" className="section-title">Recovery Momentum</h2>
              <Chip tone={stats.overdue ? 'neutral' : 'success'}>{stats.overdue ? 'Catching up' : 'On pace'}</Chip>
            </header>
            <div className="momentum-top">
              <ProgressRing percent={stats.progressPercent} size={96} stroke={8}>
                <strong>{stats.progressPercent}%</strong>
                <span className="small muted">Cleared</span>
              </ProgressRing>
              <div className="momentum-metrics">
                <p className="muted">Completed tasks: <strong className="ink">{stats.completed} / {stats.total}</strong></p>
                <p className="muted">Remaining workload: <strong className="accent">{formatHours(stats.remainingMinutes)} hrs</strong></p>
              </div>
            </div>
            <div className="momentum-block">
              <div className="momentum-block__head">
                <span className="label">Weekly study rhythm</span>
                <span className="small success">Safe {preferences.dailyHours} hr baseline</span>
              </div>
              <MomentumChart daily={stats.daily} safeMinutes={preferences.dailyHours * 60} />
            </div>
            <div className="encourage">
              <strong>Encouraging momentum</strong>
              <p>{encouragement}</p>
            </div>
          </section>

          {nextDeadline && (
            <section className="card next-card">
              <Icon name="calendar" size={18} />
              <div>
                <strong>{nextDeadline.title}</strong>
                <p className="muted small">Next deadline · {formatDeadline(nextDeadline.deadline)}</p>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
