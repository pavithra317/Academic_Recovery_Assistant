// Route table. Every page sits inside AppLayout, which provides the header and navigation.
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import RecoveryPlanPage from './pages/RecoveryPlanPage.jsx';
import StudyAssistantPage from './pages/StudyAssistantPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="recovery" element={<RecoveryPlanPage />} />
        <Route path="study" element={<StudyAssistantPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
