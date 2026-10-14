import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalRecoveryPlan, planSignature } from '../utils/recoveryPlanner.js';
import { buildICS } from '../utils/calendar.js';
import { normalizeStudyNotes } from '../services/studyService.js';

const NOW = new Date('2026-10-10T09:00:00');
const hours = (h) => new Date(NOW.getTime() + h * 3600000).toISOString();
const prefs = { dailyHours: 2.5, productivityWindow: 'afternoon', breakRhythm: 'pomodoro' };
const task = (id, overrides) => ({
  id, title: `Task ${id}`, subject: 'CHEM 201', deadline: hours(72), estimatedMinutes: 60,
  priority: 'medium', status: 'pending', completedAt: null, ...overrides,
});

test('planner never schedules more than the daily safe limit on a day', () => {
  const tasks = [task('a', { estimatedMinutes: 300 }), task('b', { estimatedMinutes: 300 })];
  const plan = buildLocalRecoveryPlan(tasks, prefs, NOW);
  const perDay = {};
  plan.blocks.forEach((b) => { perDay[b.date] = (perDay[b.date] || 0) + b.minutes; });
  Object.values(perDay).forEach((total) => assert.ok(total <= 150, `day total ${total} exceeds 150 min`));
  // Both tasks are due 72h out (9 AM on day 3). Afternoon blocks on day 3 start after that deadline,
  // so only days 0-2 (450 min) are usable. The second task must be reported as unscheduled.
  assert.equal(plan.scheduledMinutes, 450);
  assert.deepEqual(plan.unscheduledTaskIds, ['b']);
});

test('overdue tasks are scheduled first', () => {
  const tasks = [task('future', { deadline: hours(40) }), task('late', { deadline: hours(-5) })];
  const plan = buildLocalRecoveryPlan(tasks, prefs, NOW);
  assert.equal(plan.blocks[0].taskId, 'late');
  assert.equal(plan.blocks[0].overdue, true);
});

test('completed tasks are not planned', () => {
  const tasks = [task('done', { status: 'completed', completedAt: hours(-1) }), task('open')];
  const plan = buildLocalRecoveryPlan(tasks, prefs, NOW);
  assert.ok(plan.blocks.every((b) => b.taskId === 'open'));
});

test('a block never starts after a non-overdue deadline', () => {
  const tasks = [task('soon', { deadline: hours(2), estimatedMinutes: 30 })];
  const plan = buildLocalRecoveryPlan(tasks, { ...prefs, productivityWindow: 'morning' }, NOW);
  plan.blocks.forEach((b) => assert.ok(new Date(b.start) < new Date(hours(2))));
});

test('blocks use the focus length from the chosen rhythm', () => {
  const plan = buildLocalRecoveryPlan([task('x', { estimatedMinutes: 50 })], { ...prefs, breakRhythm: 'deep' }, NOW);
  assert.ok(plan.blocks.every((b) => b.minutes <= 50));
  assert.equal(plan.blocks[0].minutes, 50);
});

test('planner reports tasks that do not fit the horizon', () => {
  const huge = task('huge', { estimatedMinutes: 60 * 24 * 30, deadline: hours(24 * 30) });
  const plan = buildLocalRecoveryPlan([huge], prefs, NOW);
  assert.deepEqual(plan.unscheduledTaskIds, ['huge']);
  assert.ok(plan.recommendations.some((r) => r.includes('will not fit')));
});

test('planSignature changes when task inputs change', () => {
  const base = planSignature([task('a')], prefs);
  assert.notEqual(base, planSignature([task('a', { estimatedMinutes: 90 })], prefs));
  assert.notEqual(base, planSignature([task('a')], { ...prefs, dailyHours: 3 }));
});

test('buildICS produces valid VEVENT blocks', () => {
  const plan = buildLocalRecoveryPlan([task('a')], prefs, NOW);
  const ics = buildICS(plan.blocks, NOW);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, plan.blocks.length);
});

test('normalizeStudyNotes accepts both backend shapes', () => {
  const sections = normalizeStudyNotes({ title: 'Mitosis', sections: [{ heading: 'Phases', points: ['Prophase'] }] }, 'Mitosis');
  assert.equal(sections.sections[0].points[0], 'Prophase');
  const text = normalizeStudyNotes({ notes: 'Plain notes' }, 'Mitosis');
  assert.equal(text.text, 'Plain notes');
  assert.equal(text.title, 'Study notes: Mitosis');
});
