// Shared shell for every page: header, page content, and bottom navigation.
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader.jsx';
import Navigation from './Navigation.jsx';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader />
      <main id="main-content" className="page-main">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
}
