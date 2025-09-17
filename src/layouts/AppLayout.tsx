import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import Breadcrumbs from '../components/AppBreadcrumbs';
import ErrorBoundary from '@/components/util/ErrorBoundary';
import QAOverlay from '../pages/qa/QAOverlay';
import '@/styles/theme.css';

export default function AppLayout() {
  return (
    <div className="gv-content" style={{display:'flex', minHeight:'100vh'}}>
      <Sidebar />
      <div className="gv-main-col" style={{flex:1}}>
        <AppHeader />
        {/* Accessible crumbs; visible crumbs live in header slot */}
        <Breadcrumbs />
        <main className="gv-page" id="gv-page" style={{padding:'16px'}}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      
      {/* QA overlay available everywhere */}
      <QAOverlay />
    </div>
  );
}