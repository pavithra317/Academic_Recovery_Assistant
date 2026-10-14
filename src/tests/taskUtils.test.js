import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, filterTasks, isOverdue, subjectBreakdown, sortTasks } from '../utils/taskUtils.js';
import { validateTask, isValid } from '../utils/validation.js';

const NOW = new Date('2026-10-10T12:00:00');
const hours = (h) => new Date(NOW.getTime() + h * 3600000).toISOString();
const make = (overrides) => ({
  id: Math.random().toString(36).slice(2),
  title: 'Task',
  subject: 'CHEM 201',
  deadline: hours(24),
  estimatedMinutes: 60,
  priority: 'medium',
  status: 'pending',
  completedAt: null,
  ...overrides,
});

test('overdue only counts open tasks whose deadline has passed', () => {
  assert.equal(isOverdue(make({ deadline: hours(-1) }), NOW), true);
  assert.equal(isOverdue(make({ deadline: hours(-1), status: 'completed' }), NOW), false);
  assert.equal(isOverdue(make({ deadline: hours(1) }), NOW), false);
});

test('computeStats reflects the task list (no hardcoded numbers)', () => {
  const tasks = [
    make({ title: 'Late problem set', deadline: hours(-5), estimatedMinutes: 90, priority: 'high' }),
    make({ title: 'Upcoming essay', deadline: hours(30), estimatedMinutes: 60 }),
    make({ title: 'CHEM 201 Midterm Exam', deadline: hours(96), estimatedMinutes: 180, priority: 'high' }),
    make({ title: 'Done quiz', status: 'completed', completedAt: hours(-2), estimatedMinutes: 30 }),
  ];
  const stats = computeStats(tasks, NOW);
  assert.equal(stats.total, 4);
  assert.equal(stats.completed, 1);
  assert.equal(stats.open, 3);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.backlogMinutes, 90);
  assert.equal(stats.exams, 1);
  assert.equal(stats.progressPercent, 25);
  assert.equal(stats.todayMinutes, 30);
  assert.equal(stats.activeDays, 1);
  assert.equal(stats.urgentOpen, 2);
});

test('stats are zero for an empty list', () => {
  const stats = computeStats([], NOW);
  assert.equal(stats.total, 0);
  assert.equal(stats.progressPercent, 0);
  assert.equal(stats.overdue, 0);
});

test('filterTasks supports every filter used by the Tasks page', () => {
  const tasks = [
    make({ status: 'pending', deadline: hours(-1) }),
    make({ status: 'in-progress' }),
    make({ status: 'completed', completedAt: hours(-1) }),
  ];
  assert.equal(filterTasks(tasks, 'all', NOW).length, 3);
  assert.equal(filterTasks(tasks, 'pending', NOW).length, 1);
  assert.equal(filterTasks(tasks, 'in-progress', NOW).length, 1);
  assert.equal(filterTasks(tasks, 'completed', NOW).length, 1);
  assert.equal(filterTasks(tasks, 'overdue', NOW).length, 1);
});

test('sortTasks orders by deadline, then priority', () => {
  const a = make({ title: 'A', deadline: hours(10), priority: 'low' });
  const b = make({ title: 'B', deadline: hours(10), priority: 'high' });
  const c = make({ title: 'C', deadline: hours(5), priority: 'low' });
  assert.deepEqual(sortTasks([a, b, c]).map((t) => t.title), ['C', 'B', 'A']);
});

test('subjectBreakdown computes per-subject completion', () => {
  const rows = subjectBreakdown([
    make({ subject: 'CS 106B', status: 'completed', completedAt: hours(-1) }),
    make({ subject: 'CS 106B' }),
    make({ subject: 'ECON 102' }),
  ]);
  const cs = rows.find((r) => r.subject === 'CS 106B');
  assert.equal(cs.total, 2);
  assert.equal(cs.percent, 50);
});

test('validateTask requires fields and rejects bad durations', () => {
  assert.equal(isValid(validateTask({ title: 'Essay', subject: 'ENG', deadline: '2026-10-20T17:00', estimatedMinutes: '60', priority: 'high' })), true);
  const errors = validateTask({ title: '  ', subject: '', deadline: '', estimatedMinutes: '0', priority: '' });
  assert.ok(errors.title);
  assert.ok(errors.subject);
  assert.ok(errors.deadline);
  assert.ok(errors.estimatedMinutes);
  assert.ok(errors.priority);
  assert.ok(validateTask({ title: 'x', subject: 'y', deadline: '2026-10-20T10:00', estimatedMinutes: '2000', priority: 'low' }).estimatedMinutes);
});
