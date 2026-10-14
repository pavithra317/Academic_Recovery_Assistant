// Pure task logic: status, overdue checks, filtering, and statistics.
// Keeping this free of React makes it easy to unit test.
import { DAY_MS, dayKey, startOfDay } from './dates.js';

export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
export const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
export const STATUS_LABELS = { pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed' };
export const FILTERS = ['all', 'pending', 'in-progress', 'completed', 'overdue'];
export const WEEKLY_TARGET_HOURS = 18;

export const isOpen = (task) => task.status !== 'completed';
export const isOverdue = (task, now = new Date()) =>
  isOpen(task) && new Date(task.deadline).getTime() < now.getTime();
// Exams are detected from the title, since the form does not have a separate type field.
export const isExamTask = (task) => /midterm|exam|final|quiz/i.test(task.title);
export const minutesOf = (task) => Number(task.estimatedMinutes) || 0;

export function compareTasks(a, b) {
  const byDeadline = new Date(a.deadline) - new Date(b.deadline);
  if (byDeadline !== 0) return byDeadline;
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}

export function sortTasks(tasks) {
  return [...tasks].sort(compareTasks);
}

export function filterTasks(tasks, filter, now = new Date()) {
  switch (filter) {
    case 'pending':
      return tasks.filter((t) => t.status === 'pending');
    case 'in-progress':
      return tasks.filter((t) => t.status === 'in-progress');
    case 'completed':
      return tasks.filter((t) => !isOpen(t));
    case 'overdue':
      return tasks.filter((t) => isOverdue(t, now));
    default:
      return tasks;
  }
}

export function computeStats(tasks, now = new Date()) {
  const open = tasks.filter(isOpen);
  const completed = tasks.filter((t) => !isOpen(t));
  const overdue = open.filter((t) => isOverdue(t, now));
  const weekAhead = now.getTime() + 7 * DAY_MS;
  const exams = open.filter(isExamTask).sort(compareTasks);

  // Minutes completed per day for the last 7 days (index 6 = today).
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return { date, key: dayKey(date), minutes: 0 };
  });
  const indexByKey = new Map(daily.map((d, i) => [d.key, i]));
  completed.forEach((task) => {
    if (!task.completedAt) return;
    const index = indexByKey.get(dayKey(task.completedAt));
    if (index !== undefined) daily[index].minutes += minutesOf(task);
  });

  const weeklyMinutes = daily.reduce((sum, d) => sum + d.minutes, 0);

  return {
    total: tasks.length,
    completed: completed.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    open: open.length,
    urgentOpen: open.filter((t) => t.priority === 'high').length,
    overdue: overdue.length,
    backlogMinutes: overdue.reduce((sum, t) => sum + minutesOf(t), 0),
    dueThisWeek: open.filter((t) => {
      const time = new Date(t.deadline).getTime();
      return time >= now.getTime() && time <= weekAhead;
    }).length,
    exams: exams.length,
    upcomingExams: exams.slice(0, 2),
    remainingMinutes: open.reduce((sum, t) => sum + minutesOf(t), 0),
    progressPercent: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    daily,
    weeklyMinutes,
    activeDays: daily.filter((d) => d.minutes > 0).length,
    todayMinutes: daily[6].minutes,
  };
}

// Groups tasks by subject for the "Subject Recovery Breakdown" list.
export function subjectBreakdown(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    const key = task.subject.trim();
    const entry = map.get(key) ?? { subject: key, total: 0, completed: 0 };
    entry.total += 1;
    if (!isOpen(task)) entry.completed += 1;
    map.set(key, entry);
  });
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      percent: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
}
