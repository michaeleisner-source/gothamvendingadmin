import { Outlet } from 'react-router-dom';
import SimplifiedSidebar from '../components/SimplifiedSidebar';
import AppHeader from '../components/AppHeader';
import Breadcrumbs from '../components/AppBreadcrumbs';
import '@/styles/theme.css';

export default function AppLayout() {
  return (
    <div className="gv-content">
      <SimplifiedSidebar />
      <div className="gv-main-col">
        <AppHeader />
        {/* Accessible crumbs; visible crumbs live in header slot */}
        <Breadcrumbs />
        <main className="gv-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}