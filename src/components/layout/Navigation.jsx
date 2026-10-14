// Main navigation. Labels match the Figma nav: Dashboard, Tasks, Recovery, Study AI, Progress.
// The bottom bar is shown on small screens. The top links (in AppHeader) are shown on wide screens.
import { NavLink } from 'react-router-dom';
import Icon from '../icons/Icon.jsx';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/recovery', label: 'Recovery', icon: 'zap' },
  { to: '/study', label: 'Study AI', icon: 'book' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
];

export default function Navigation() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className="bottom-nav__link">
          <span className="bottom-nav__icon">
            <Icon name={item.icon} size={18} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
