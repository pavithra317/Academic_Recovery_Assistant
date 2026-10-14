// Single source of truth for tasks, preferences, and the recovery plan.
//
// Two modes, chosen automatically:
// - Backend mode (VITE_API_BASE_URL is set): tasks are loaded from and saved to MongoDB through the FastAPI backend.
// - Offline mode (no backend URL): tasks are kept in localStorage, as before. Demo data is shown on first load.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createSamplePreferences, createSampleTasks } from '../data/sampleData.js';
import { computeStats } from '../utils/taskUtils.js';
import { STORAGE_KEYS, loadJSON, removeKey, saveJSON } from '../utils/storage.js';
import { generateRecoveryPlan } from '../services/recoveryService.js';
import { planSignature } from '../utils/recoveryPlanner.js';
import { isBackendConfigured } from '../services/api.js';
import * as taskService from '../services/taskService.js';

const StudyDataContext = createContext(null);

const makeId = () => `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// Applies form values to a task that lives only in the browser (offline mode).
function applyValuesLocally(task, values) {
  return {
    ...task,
    title: values.title.trim(),
    subject: values.subject.trim(),
    description: (values.description || '').trim(),
    deadline: new Date(values.deadline).toISOString(),
    estimatedMinutes: Number(values.estimatedMinutes),
    priority: values.priority,
  };
}

export function StudyDataProvider({ children }) {
  const useBackend = isBackendConfigured;

  const [tasks, setTasks] = useState(() =>
    useBackend ? [] : loadJSON(STORAGE_KEYS.tasks, null) ?? createSampleTasks()
  );
  const [tasksStatus, setTasksStatus] = useState({ loading: useBackend, error: '' });
  const [preferences, setPreferences] = useState(() => ({
    ...createSamplePreferences(),
    ...loadJSON(STORAGE_KEYS.preferences, {}),
  }));
  const [plan, setPlan] = useState(() => loadJSON(STORAGE_KEYS.plan, null));
  const [planStatus, setPlanStatus] = useState({ loading: false, error: '' });

  const refreshTasks = useCallback(async () => {
    if (!useBackend) return;
    setTasksStatus({ loading: true, error: '' });
    try {
      const list = await taskService.fetchTasks();
      setTasks(list);
      setTasksStatus({ loading: false, error: '' });
    } catch (err) {
      setTasksStatus({ loading: false, error: err.message || 'Could not load tasks.' });
    }
  }, [useBackend]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    if (!useBackend) saveJSON(STORAGE_KEYS.tasks, tasks);
  }, [tasks, useBackend]);

  useEffect(() => {
    if (plan) saveJSON(STORAGE_KEYS.plan, plan);
    else removeKey(STORAGE_KEYS.plan);
  }, [plan]);

  // Every action below either succeeds or throws an Error with a message the UI can show.
  const addTask = useCallback(
    async (values) => {
      if (useBackend) {
        const created = await taskService.createTask(values);
        setTasks((prev) => [created, ...prev]);
        return created;
      }
      const nowIso = new Date().toISOString();
      const task = {
        ...applyValuesLocally({ id: makeId(), status: 'pending', createdAt: nowIso, completedAt: null }, values),
      };
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [useBackend]
  );

  const updateTask = useCallback(
    async (id, values) => {
      if (useBackend) {
        const updated = await taskService.updateTask(id, values);
        setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
        return updated;
      }
      setTasks((prev) => prev.map((task) => (task.id === id ? applyValuesLocally(task, values) : task)));
      return null;
    },
    [useBackend]
  );

  const deleteTask = useCallback(
    async (id) => {
      if (useBackend) await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    },
    [useBackend]
  );

  const setTaskStatus = useCallback(
    async (id, status) => {
      if (useBackend) {
        const updated =
          status === 'completed'
            ? await taskService.setTaskCompleted(id, true)
            : await taskService.updateTaskStatus(id, status); // also reopens a completed task
        setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
        return updated;
      }
      setTasks((prev) =>
        prev.map((task) =>
          task.id !== id
            ? task
            : { ...task, status, completedAt: status === 'completed' ? new Date().toISOString() : null }
        )
      );
      return null;
    },
    [useBackend]
  );

  const savePreferences = useCallback((next) => {
    setPreferences(next);
    saveJSON(STORAGE_KEYS.preferences, next);
  }, []);

  const resetAll = useCallback(async () => {
    if (useBackend) await taskService.deleteAllTasks();
    setTasks([]);
    setPlan(null);
    setPlanStatus({ loading: false, error: '' });
  }, [useBackend]);

  // Returns true on success so pages can navigate after generating.
  const generatePlan = useCallback(
    async ({ regenerate = false } = {}) => {
      setPlanStatus({ loading: true, error: '' });
      try {
        const result = await generateRecoveryPlan({ tasks, preferences, regenerate });
        setPlan({ ...result, signature: planSignature(tasks, preferences) });
        setPlanStatus({ loading: false, error: '' });
        return true;
      } catch (err) {
        setPlanStatus({ loading: false, error: err.message || 'Could not generate a plan.' });
        return false;
      }
    },
    [tasks, preferences]
  );

  const value = useMemo(
    () => ({
      tasks,
      tasksStatus,
      useBackend,
      refreshTasks,
      preferences,
      plan,
      planStatus,
      planIsStale: Boolean(plan) && plan.signature !== planSignature(tasks, preferences),
      stats: computeStats(tasks, new Date()),
      addTask,
      updateTask,
      deleteTask,
      setTaskStatus,
      savePreferences,
      resetAll,
      generatePlan,
    }),
    [tasks, tasksStatus, useBackend, refreshTasks, preferences, plan, planStatus, addTask, updateTask, deleteTask, setTaskStatus, savePreferences, resetAll, generatePlan]
  );

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData() {
  const context = useContext(StudyDataContext);
  if (!context) throw new Error('useStudyData must be used inside StudyDataProvider.');
  return context;
}