import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AppLayout() {
  return (
    <div className="gv-app" style={{display:'grid', gridTemplateColumns:'240px 1fr', minHeight:'100vh', background:'#f8fafc'}}>
      <Sidebar />
      <div style={{display:'grid', gridTemplateRows:'auto auto 1fr'}}>
        <header style={{display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'10px 16px', background:'#ffffff', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontWeight:800}}>Gotham Vending</div>
          <div/>
        </header>

        {/* 🔽 Breadcrumbs must be mounted so the slot updates */}
        <Breadcrumbs />

        <main className="gv-page" id="gv-page" style={{padding:16}}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}