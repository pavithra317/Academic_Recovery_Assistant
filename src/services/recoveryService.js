// Recovery plan generation. The UI calls generateRecoveryPlan() and does not care where the plan came from.
// - If the FastAPI backend is configured, the plan comes from the backend (Gemini-powered there).
// - Otherwise the local deterministic planner builds a plan. It is labeled "local" in the UI.
import { backendApi, isBackendConfigured } from './api.js';
import { buildLocalRecoveryPlan } from '../utils/recoveryPlanner.js';

export async function generateRecoveryPlan({ tasks, preferences, regenerate = false }) {
  if (isBackendConfigured) {
    const payload = { preferences };
    const response = regenerate
      ? await backendApi.regenerateRecoveryPlan(payload)
      : await backendApi.generateRecoveryPlan(payload);
    return { source: 'backend', blocks: [], unscheduledTaskIds: [], recommendations: [], ...response };
  }

  return buildLocalRecoveryPlan(tasks, preferences, new Date());
}
