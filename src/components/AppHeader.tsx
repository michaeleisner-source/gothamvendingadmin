import { useEffect, useState } from 'react';
import Breadcrumbs from './AppBreadcrumbs';

export default function AppHeader() {
  const [days, setDays] = useState<number>(() => {
    const saved = localStorage.getItem('gv:dateRangeDays');
    return saved ? Number(saved) : 30;
  });

  useEffect(() => {
    localStorage.setItem('gv:dateRangeDays', String(days));
    window.dispatchEvent(new CustomEvent('gv:dateRangeChange', { detail: { days }}));
  }, [days]);

  const [org, setOrg] = useState<string>(() => localStorage.getItem('gv:org') || 'Gotham Vending');
  useEffect(() => {
    localStorage.setItem('gv:org', org);
    window.dispatchEvent(new CustomEvent('gv:orgChange', { detail: { org }}));
  }, [org]);

  const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value.trim();
      window.dispatchEvent(new CustomEvent('gv:search', { detail: { q }}));
    }
  };

  return (
    <>
      {/* Breadcrumb component that injects into header slot */}
      <Breadcrumbs />
      
      <header className="gv-header">
        <div className="gv-breadcrumb-slot" id="gv-breadcrumb-slot" />
        <div className="gv-header-right">
          <select value={org} onChange={e => setOrg(e.target.value)} title="Organization" className="gv-input">
            <option value="Gotham Vending">Gotham Vending</option>
            <option value="Wayne Enterprises">Wayne Enterprises</option>
            <option value="Demo Corp">Demo Corp</option>
          </select>

          <select value={days} onChange={e => setDays(Number(e.target.value))} title="Date Range" className="gv-input">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>

          <input 
            className="gv-input" 
            placeholder="Search machines, products, locations" 
            onKeyDown={onSearch}
            style={{ width: '240px' }}
          />
          <div className="gv-avatar" title="Account" />
        </div>
      </header>
    </>
  );
}