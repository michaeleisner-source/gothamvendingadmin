import { Outlet } from 'react-router-dom';
import SimplifiedSidebar from '../components/SimplifiedSidebar';
import AppHeader from '../components/AppHeader';
import Breadcrumbs from '../components/AppBreadcrumbs';
import ErrorBoundary from '@/components/util/ErrorBoundary';
import '@/styles/theme.css';

export default function AppLayout() {
  return (
    <div className="gv-content">
      <SimplifiedSidebar />
      <div className="gv-main-col">
        <AppHeader />
        {/* Accessible crumbs; visible crumbs live in header slot */}
        <Breadcrumbs />
        <main className="gv-page" id="gv-page" style={{padding:'16px'}}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}