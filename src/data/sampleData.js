// Realistic demo data, shown only on first load (before anything is saved).
// Deadlines are generated relative to "now" so the demo always has overdue, upcoming,
// and completed work. Delete this file's use in StudyDataContext to start empty.

export function createSampleTasks(now = new Date()) {
  const hoursFromNow = (hours) => new Date(now.getTime() + hours * 3600000).toISOString();

  const task = (id, title, subject, deadlineHours, estimatedMinutes, priority, status = 'pending', completedHours = null) => ({
    id,
    title,
    subject,
    deadline: hoursFromNow(deadlineHours),
    estimatedMinutes,
    priority,
    status,
    createdAt: hoursFromNow(-96),
    completedAt: completedHours === null ? null : hoursFromNow(completedHours),
  });

  return [
    task('t-1', 'Reaction Mechanisms P-Set 4', 'CHEM 201', -26, 90, 'high'),
    task('t-2', 'CS 106B Binary Tree Recursion', 'CS 106B', -18, 45, 'high', 'in-progress'),
    task('t-3', 'Binary Search Tree Debugging Lab', 'CS 106B', -30, 60, 'medium'),
    task('t-4', 'ECON 102 Reading Synthesis & Quiz 4', 'ECON 102', 20, 40, 'medium'),
    task('t-5', 'Organic Chemistry Lab Report', 'CHEM 201', 72, 120, 'high'),
    task('t-6', 'CHEM 201 Midterm Exam', 'CHEM 201', 96, 180, 'high'),
    task('t-7', 'ECON 102 Chapter 8 Synthesis', 'ECON 102', 96, 40, 'medium'),
    task('t-8', 'CS 106B Midterm Exam', 'CS 106B', 216, 240, 'high'),
    task('t-9', 'CHEM 201 Problem Set 2', 'CHEM 201', -60, 60, 'medium', 'completed', -30),
    task('t-10', 'CS 106B Recursion Warm-up', 'CS 106B', -20, 45, 'high', 'completed', -5),
    task('t-11', 'ECON 102 Quiz 3', 'ECON 102', -70, 30, 'low', 'completed', -68),
  ];
}

export function createSamplePreferences() {
  return {
    name: '',
    role: '',
    courses: [],
    dailyHours: 2.5,
    productivityWindow: 'afternoon', // 'morning' | 'afternoon'
    breakRhythm: 'pomodoro', // 'pomodoro' | 'deep'
  };
}