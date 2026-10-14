// Local recovery planner. It is NOT AI. It is a simple, deterministic scheduler that
// spreads open tasks into focus blocks that respect the daily safe-hours limit.
// It is used when the FastAPI backend is not connected. The UI labels it as "local".
import { isOpen, isOverdue, minutesOf, sortTasks } from './taskUtils.js';
import { DAY_MS, dayKey, startOfDay } from './dates.js';
import { formatDuration, plural } from './format.js';

export const HORIZON_DAYS = 14;
const WINDOW_START_HOUR = { morning: 8, afternoon: 15 };
export const BREAK_RHYTHMS = {
  pomodoro: { focus: 25, rest: 5, label: 'Pomodoro' },
  deep: { focus: 50, rest: 10, label: 'Deep Block' },
};

export function buildLocalRecoveryPlan(tasks, preferences, now = new Date()) {
  const rhythm = BREAK_RHYTHMS[preferences.breakRhythm] ?? BREAK_RHYTHMS.pomodoro;
  const startHour = WINDOW_START_HOUR[preferences.productivityWindow] ?? WINDOW_START_HOUR.afternoon;
  const dailyCapacity = Math.max(15, Math.round((Number(preferences.dailyHours) || 2.5) * 60));

  const days = Array.from({ length: HORIZON_DAYS }, (_, i) => {
    const date = startOfDay(now);
    date.setDate(date.getDate() + i);
    return { date, used: 0, cursor: null };
  });

  const openTasks = sortTasks(tasks.filter(isOpen));
  const blocks = [];
  const unscheduledTaskIds = [];

  openTasks.forEach((task) => {
    let remaining = minutesOf(task);
    const deadline = new Date(task.deadline);
    const overdue = isOverdue(task, now);
    const deadlineIndex = Math.round((startOfDay(deadline) - startOfDay(now)) / DAY_MS);
    // Overdue work may spill across the whole horizon. Other work stays on or before its deadline day.
    const lastIndex = overdue
      ? HORIZON_DAYS - 1
      : Math.min(HORIZON_DAYS - 1, Math.max(0, deadlineIndex));

    for (let i = 0; i <= lastIndex && remaining > 0; i += 1) {
      const day = days[i];
      while (remaining > 0 && day.used < dailyCapacity) {
        if (!day.cursor) {
          day.cursor = new Date(day.date);
          day.cursor.setHours(startHour, 0, 0, 0);
        }
        const start = new Date(day.cursor);
        if (!overdue && start.getTime() >= deadline.getTime()) break;

        const minutes = Math.min(rhythm.focus, remaining, dailyCapacity - day.used);
        const end = new Date(start.getTime() + minutes * 60000);
        blocks.push({
          id: `${task.id}-${blocks.length + 1}`,
          taskId: task.id,
          title: task.title,
          subject: task.subject,
          priority: task.priority,
          deadline: task.deadline,
          overdue,
          minutes,
          start: start.toISOString(),
          end: end.toISOString(),
          date: dayKey(start),
        });
        day.used += minutes;
        remaining -= minutes;
        day.cursor = new Date(end.getTime() + rhythm.rest * 60000);
      }
    }

    if (remaining > 0) unscheduledTaskIds.push(task.id);
  });

  blocks.sort((a, b) => new Date(a.start) - new Date(b.start));

  return {
    source: 'local',
    generatedAt: now.toISOString(),
    dailyCapacityMinutes: dailyCapacity,
    blocks,
    scheduledMinutes: blocks.reduce((sum, b) => sum + b.minutes, 0),
    unscheduledTaskIds,
    recommendations: buildRecommendations({ openTasks, now, dailyCapacity, rhythm, unscheduledTaskIds }),
  };
}

function buildRecommendations({ openTasks, now, dailyCapacity, rhythm, unscheduledTaskIds }) {
  const recs = [];

  const overdue = openTasks.filter((t) => isOverdue(t, now));
  if (overdue.length) {
    recs.push(
      `Start with the ${overdue.length === 1 ? 'overdue task' : `${overdue.length} overdue tasks`}. They carry the most backlog and are scheduled first.`
    );
  }

  const urgent = openTasks.find(
    (t) => t.priority === 'high' && !isOverdue(t, now) && new Date(t.deadline) - now <= 2 * DAY_MS
  );
  if (urgent) {
    recs.push(`Finish ${urgent.title} next. It is high priority and due within 48 hours.`);
  }

  const totalMinutes = openTasks.reduce((sum, t) => sum + minutesOf(t), 0);
  if (totalMinutes) {
    recs.push(
      `Your open workload is ${formatDuration(totalMinutes)}. At your safe limit of ${formatDuration(dailyCapacity)} a day, it needs about ${Math.ceil(totalMinutes / dailyCapacity)} day(s).`
    );
  }

  if (unscheduledTaskIds.length) {
    recs.push(
      `${plural(unscheduledTaskIds.length, 'task')} will not fit in the next ${HORIZON_DAYS} days at this daily limit. Raise your safe daily hours or move the deadlines.`
    );
  }

  recs.push(`Work in ${rhythm.focus}-minute focus blocks with ${rhythm.rest}-minute rests to keep your pace sustainable.`);
  return recs;
}

// Fingerprint of the inputs that shape a plan. If it changes, the saved plan is stale.
export function planSignature(tasks, preferences) {
  return JSON.stringify({
    open: tasks.filter(isOpen).map((t) => [t.id, t.deadline, minutesOf(t), t.priority]),
    dailyHours: preferences.dailyHours,
    window: preferences.productivityWindow,
    rhythm: preferences.breakRhythm,
  });
}
