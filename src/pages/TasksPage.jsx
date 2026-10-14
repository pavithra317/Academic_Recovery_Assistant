// My Tasks: add, edit, delete, complete, and filter tasks.
// Accepts ?filter=overdue (from the header bell) and ?new=1 (from the Recovery page).
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/icons/Icon.jsx';
import TaskForm, { emptyTaskValues, taskToFormValues } from '../components/tasks/TaskForm.jsx';
import TaskItem from '../components/tasks/TaskItem.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusMessage.jsx';
import { useStudyData } from '../context/StudyDataContext.jsx';
import { FILTERS, computeStats, filterTasks, sortTasks } from '../utils/taskUtils.js';

const FILTER_LABELS = { all: 'All', pending: 'Pending', 'in-progress': 'In progress', completed: 'Completed', overdue: 'Overdue' };

export default function TasksPage() {
  const { tasks, tasksStatus, preferences, addTask, updateTask, deleteTask, setTaskStatus, refreshTasks } = useStudyData();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('filter');

  const [filter, setFilter] = useState(FILTERS.includes(requestedFilter) ? requestedFilter : 'all');
  const [formState, setFormState] = useState(() => (searchParams.get('new') === '1' ? { mode: 'create' } : null));
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const formRef = useRef(null);

  // Bring the form into view when Add or Edit is pressed, even if the list is scrolled down.
  useEffect(() => {
    if (formState) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [formState]);

  const now = new Date();
  const stats = computeStats(tasks, now);
  const counts = {
    all: tasks.length,
    pending: stats.pending,
    'in-progress': stats.inProgress,
    completed: stats.completed,
    overdue: stats.overdue,
  };
  const visible = sortTasks(filterTasks(tasks, filter, now));

  const closeForm = () => {
    setFormState(null);
    setFormError('');
    if (searchParams.has('new')) setSearchParams({}, { replace: true });
  };

  const handleSubmit = async (values) => {
    setBusy(true);
    setFormError('');
    try {
      if (formState.mode === 'edit') {
        await updateTask(formState.task.id, values);
        setNotice(`Updated "${values.title.trim()}".`);
      } else {
        await addTask(values);
        setNotice(`Added "${values.title.trim()}".`);
      }
      closeForm();
    } catch (err) {
      setFormError(err.message || 'Could not save the task.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setActionError('');
    try {
      await deleteTask(task.id);
      if (formState?.task?.id === task.id) setFormState(null);
      setNotice(`Deleted "${task.title}".`);
    } catch (err) {
      setActionError(err.message || 'Could not delete the task.');
    }
  };

  const changeStatus = async (id, status) => {
    setActionError('');
    try {
      await setTaskStatus(id, status);
    } catch (err) {
      setActionError(err.message || 'Could not update the task.');
    }
  };

  const showLoading = tasksStatus.loading && tasks.length === 0;

  return (
    <div className="page tasks-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Task manager</p>
          <h1>My Tasks</h1>
          <p className="muted">Assignments, exams, and readings. Your recovery plan is built from these.</p>
        </div>
        <button className="btn btn--primary" type="button" onClick={() => setFormState({ mode: 'create' })}>
          <Icon name="plus" size={16} /> Add Task
        </button>
      </header>

      <div className="summary-row" aria-label="Task summary">
        <span className="chip chip--neutral">Pending {stats.pending}</span>
        <span className="chip chip--primary">In progress {stats.inProgress}</span>
        <span className="chip chip--success">Completed {stats.completed}</span>
        {stats.overdue > 0 && <span className="chip chip--danger">Overdue {stats.overdue}</span>}
      </div>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {actionError && <ErrorState message={actionError} />}
      {tasksStatus.error && <ErrorState message={tasksStatus.error} onRetry={refreshTasks} />}

      <div ref={formRef}>
        {formError && <ErrorState message={formError} />}
        {formState && (
          <TaskForm
            key={formState.mode === 'edit' ? formState.task.id : 'new-task'}
            heading={formState.mode === 'edit' ? 'Edit task' : 'Add a new task'}
            submitLabel={formState.mode === 'edit' ? 'Save changes' : 'Add task'}
            initialValues={formState.mode === 'edit' ? taskToFormValues(formState.task) : emptyTaskValues(now)}
            courses={preferences.courses}
            busy={busy}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        )}
      </div>

      <div className="filter-tabs" role="group" aria-label="Filter tasks">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-tab ${filter === f ? 'is-active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]} <span className="filter-tab__count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {showLoading ? (
        <LoadingState label="Loading your tasks…" />
      ) : tasks.length === 0 ? (
        tasksStatus.error ? null : (
          <EmptyState
            icon="tasks"
            title="No tasks yet"
            message="Add your first assignment, exam, or reading to start building a recovery plan."
            action={
              <button className="btn btn--primary" type="button" onClick={() => setFormState({ mode: 'create' })}>
                <Icon name="plus" size={16} /> Add your first task
              </button>
            }
          />
        )
      ) : visible.length === 0 ? (
        <EmptyState icon="info" title="No tasks match this filter" message="Try another filter to see more tasks." />
      ) : (
        <ul className="task-list" aria-label="Tasks">
          {visible.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              now={now}
              onEdit={(t) => setFormState({ mode: 'edit', task: t })}
              onDelete={handleDelete}
              onStatusChange={changeStatus}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
