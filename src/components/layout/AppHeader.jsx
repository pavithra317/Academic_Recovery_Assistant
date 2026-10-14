// Top header: brand, desktop navigation, notifications (links to overdue tasks), and profile.
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from '../icons/Icon.jsx';
import { NAV_ITEMS } from './Navigation.jsx';
import { useStudyData } from '../../context/StudyDataContext.jsx';
import { computeStats } from '../../utils/taskUtils.js';
import { initials, plural } from '../../utils/format.js';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/tasks': 'My Tasks',
  '/recovery': 'AI Recovery Plan',
  '/study': 'AI Study Assistant',
  '/progress': 'Progress Tracking',
};

export default function AppHeader() {
  const { tasks, preferences } = useStudyData();
  const { pathname } = useLocation();
  const stats = computeStats(tasks);

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="brand" aria-label="AI Recovery Assistant home">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="zap" size={16} />
          </span>
          <span className="brand__text">
            <span className="brand__title">AI RECOVERY ASSISTANT</span>
            <span className="brand__subtitle">{PAGE_TITLES[pathname] ?? 'Progress Analytics'}</span>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="top-nav__link">
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            to="/tasks?filter=overdue"
            className="icon-btn"
            aria-label={stats.overdue ? `${plural(stats.overdue, 'overdue task')}. View them.` : 'No overdue tasks'}
          >
            <Icon name="bell" size={18} />
            {stats.overdue > 0 && <span className="notify-dot" aria-hidden="true" />}
          </Link>
          <Link to="/progress" className="avatar" aria-label="Profile and study settings">
            {initials(preferences.name)}
          </Link>
        </div>
      </div>
    </header>
  );
}
